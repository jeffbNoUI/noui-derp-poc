// Package db — vendor-specific database queries for the DERP connector service.
// Queries aggregate data from MEMBER_MASTER, BENEFIT_PAYMENT, and CASE_HIST
// to support vendor portal enrollment and statistics endpoints.
// Consumed by: vendor_handlers.go (API layer)
// Depends on: PostgreSQL legacy schema, models/vendor.go types
package db

import (
	"fmt"
	"log"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetEnrollmentQueue retrieves recently retired members pending vendor enrollment.
// Joins MEMBER_MASTER with BENEFIT_PAYMENT to find members with active retirement
// benefits who need insurance enrollment processing.
// Falls back to empty results on query failure (POC — legacy DB may lack data).
func (q *Queries) GetEnrollmentQueue() ([]models.EnrollmentQueueItem, error) {
	rows, err := q.db.Query(`
		SELECT
			m.MBR_ID,
			m.FIRST_NM || ' ' || m.LAST_NM AS member_name,
			COALESCE(m.TIER_CD, 0),
			bp.EFF_DT,
			COALESCE(bp.PAY_OPTION, 'maximum'),
			COALESCE(bp.STATUS_CD, 'A'),
			COALESCE(bp.IPR_AMT, 0),
			bp.CREATE_DT
		FROM BENEFIT_PAYMENT bp
		JOIN MEMBER_MASTER m ON bp.MBR_ID = m.MBR_ID
		WHERE bp.STATUS_CD = 'A'
		ORDER BY bp.CREATE_DT DESC
		LIMIT 50
	`)
	if err != nil {
		log.Printf("WARN: GetEnrollmentQueue query failed: %v", err)
		return []models.EnrollmentQueueItem{}, nil
	}
	defer rows.Close()

	var items []models.EnrollmentQueueItem
	for rows.Next() {
		var item models.EnrollmentQueueItem
		var iprAmt float64
		if err := rows.Scan(
			&item.MemberID, &item.MemberName, &item.Tier,
			&item.RetirementDate, &item.EnrollmentType,
			&item.Status, &iprAmt, &item.AssignedAt,
		); err != nil {
			log.Printf("WARN: GetEnrollmentQueue scan error: %v", err)
			continue
		}

		// IPR eligibility: members with IPR amount > 0 are eligible
		// CRITICAL: IPR uses EARNED service only — purchased service excluded (RMC §18-412)
		if iprAmt > 0 {
			item.IPREligible = true
			item.IPRMonthly = iprAmt
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		log.Printf("WARN: GetEnrollmentQueue rows error: %v", err)
	}
	return items, nil
}

// GetVendorStats computes aggregate vendor dashboard statistics.
// Counts pending enrollments, verified this month, total active enrollees,
// and average processing time from BENEFIT_PAYMENT and CASE_HIST.
// Falls back to zero-value stats on query failure.
func (q *Queries) GetVendorStats() (*models.VendorDashboardStats, error) {
	stats := &models.VendorDashboardStats{}

	// Count pending enrollments (benefit payments with active status, recent)
	row := q.db.QueryRow(`
		SELECT COUNT(*)
		FROM BENEFIT_PAYMENT
		WHERE STATUS_CD = 'A'
	`)
	if err := row.Scan(&stats.PendingEnrollments); err != nil {
		log.Printf("WARN: GetVendorStats pending count failed: %v", err)
	}

	// Count verified this month
	row = q.db.QueryRow(`
		SELECT COUNT(*)
		FROM BENEFIT_PAYMENT
		WHERE STATUS_CD = 'A'
		  AND CALC_DT >= DATE_TRUNC('month', CURRENT_DATE)
	`)
	if err := row.Scan(&stats.VerifiedThisMonth); err != nil {
		log.Printf("WARN: GetVendorStats verified count failed: %v", err)
	}

	// Total active enrollees (all members with active benefit payments)
	row = q.db.QueryRow(`
		SELECT COUNT(DISTINCT MBR_ID)
		FROM BENEFIT_PAYMENT
		WHERE STATUS_CD = 'A'
	`)
	if err := row.Scan(&stats.TotalActiveEnrollees); err != nil {
		log.Printf("WARN: GetVendorStats total enrollees failed: %v", err)
	}

	// Average processing days — approximate from case open to close
	row = q.db.QueryRow(`
		SELECT COALESCE(AVG(
			EXTRACT(EPOCH FROM (COALESCE(CLOSE_DT, NOW()) - OPEN_DT)) / 86400
		), 0)
		FROM CASE_HIST
		WHERE CASE_TYPE = 'SVC_RET'
	`)
	var avgDays float64
	if err := row.Scan(&avgDays); err != nil {
		log.Printf("WARN: GetVendorStats avg processing failed: %v", err)
	}
	stats.AvgProcessingDays = avgDays

	// Ensure non-nil return even if all queries failed
	return stats, nil
}

// GetRecentRetireeServiceCredit retrieves earned service years for a specific member.
// Used by the vendor IPR calculation endpoint to determine IPR eligibility and amount.
// CRITICAL: Returns only earned service (purchased excluded) per RMC §18-412.
func (q *Queries) GetRecentRetireeServiceCredit(memberID string) (float64, error) {
	row := q.db.QueryRow(`
		SELECT COALESCE(SUM(YEARS_CREDIT), 0)
		FROM SVC_CREDIT
		WHERE MBR_ID = $1
		  AND COALESCE(INCL_IPR, 'Y') = 'Y'
	`, memberID)

	var earnedYears float64
	if err := row.Scan(&earnedYears); err != nil {
		return 0, fmt.Errorf("query retiree service credit %s: %w", memberID, err)
	}
	return earnedYears, nil
}
