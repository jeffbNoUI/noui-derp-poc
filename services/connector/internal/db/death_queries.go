// Package db — death and survivor benefit database queries.
// Provides CRUD operations for DEATH_RECORD, SURVIVOR_CLAIM,
// DEATH_BENEFIT_ELECTION, and OVERPAYMENT_RECORD tables.
//
// Consumed by: death_handlers.go (connector API layer)
// Depends on: 004_death_survivor_schema.sql, models/death_survivor.go
package db

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetDeathRecord retrieves the death record for a member.
// Returns nil if no death record exists.
func (q *Queries) GetDeathRecord(memberID string) (*models.DeathRecord, error) {
	row := q.db.QueryRow(`
		SELECT DEATH_REC_ID, MBR_ID, DEATH_DT, NOTIFY_DT,
		       COALESCE(NOTIFY_SRC,''), COALESCE(NOTIFY_CONTACT,''),
		       COALESCE(NOTIFY_PHONE,''),
		       CERT_RECV_DT, CERT_VERIFY_DT,
		       COALESCE(CERT_VERIFY_BY,''), COALESCE(CERT_DOC_REF,''),
		       COALESCE(MBR_STATUS_PREV,''), COALESCE(MBR_STATUS_CURR,''),
		       STATUS_CD, SUSPEND_DT, FINAL_PAY_DT,
		       COALESCE(OVERPAY_FLG,'N'), COALESCE(OVERPAY_AMT,0),
		       COALESCE(NOTES,'')
		FROM DEATH_RECORD
		WHERE MBR_ID = $1
		ORDER BY DEATH_REC_ID DESC
		LIMIT 1
	`, memberID)

	d := &models.DeathRecord{}
	err := row.Scan(
		&d.DeathRecordID, &d.MemberID, &d.DeathDate, &d.NotifyDate,
		&d.NotifySource, &d.NotifyContact, &d.NotifyPhone,
		&d.CertReceivedDate, &d.CertVerifyDate,
		&d.CertVerifyBy, &d.CertDocRef,
		&d.PreviousStatus, &d.CurrentStatus,
		&d.StatusCode, &d.SuspendDate, &d.FinalPayDate,
		&d.OverpayFlag, &d.OverpayAmount, &d.Notes,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query death record %s: %w", memberID, err)
	}
	return d, nil
}

// GetSurvivorClaims retrieves all survivor claims for a deceased member.
func (q *Queries) GetSurvivorClaims(memberID string) ([]models.SurvivorClaim, error) {
	rows, err := q.db.Query(`
		SELECT CLAIM_ID, DEATH_REC_ID, MBR_ID,
		       COALESCE(SURV_FIRST_NM,''), COALESCE(SURV_LAST_NM,''),
		       SURV_DOB, COALESCE(SURV_RELATION,''),
		       CLAIM_TYPE, JS_PCT,
		       COALESCE(MONTHLY_AMT,0), COALESCE(LUMP_SUM_AMT,0),
		       EFF_DT, FIRST_PAY_DT,
		       STATUS_CD, APPROVED_DT, COALESCE(APPROVED_BY,''),
		       COALESCE(DENY_REASON,''), COALESCE(NOTES,'')
		FROM SURVIVOR_CLAIM
		WHERE MBR_ID = $1
		ORDER BY CLAIM_ID DESC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query survivor claims %s: %w", memberID, err)
	}
	defer rows.Close()

	var claims []models.SurvivorClaim
	for rows.Next() {
		c := models.SurvivorClaim{}
		err := rows.Scan(
			&c.ClaimID, &c.DeathRecordID, &c.MemberID,
			&c.SurvivorFirst, &c.SurvivorLast,
			&c.SurvivorDOB, &c.SurvivorRelation,
			&c.ClaimType, &c.JSPercentage,
			&c.MonthlyAmount, &c.LumpSumAmount,
			&c.EffectiveDate, &c.FirstPayDate,
			&c.StatusCode, &c.ApprovedDate, &c.ApprovedBy,
			&c.DenyReason, &c.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("scan survivor claim row: %w", err)
		}
		claims = append(claims, c)
	}
	return claims, rows.Err()
}

// GetDeathBenefitElection retrieves the death benefit installment election for a member.
func (q *Queries) GetDeathBenefitElection(memberID string) (*models.DeathBenefitElection, error) {
	row := q.db.QueryRow(`
		SELECT ELECT_ID, MBR_ID, LUMP_SUM_AMT, NUM_INSTALLMENTS,
		       INSTALLMENT_AMT, EFF_DT, COALESCE(INSTALLMENTS_PAID,0),
		       COALESCE(REMAINING_AMT,0),
		       COALESCE(BENE_FIRST_NM,''), COALESCE(BENE_LAST_NM,''),
		       COALESCE(BENE_RELATION,''),
		       TRANSFER_DT, COALESCE(STATUS_CD,'ACTIVE')
		FROM DEATH_BENEFIT_ELECTION
		WHERE MBR_ID = $1
		ORDER BY ELECT_ID DESC
		LIMIT 1
	`, memberID)

	e := &models.DeathBenefitElection{}
	err := row.Scan(
		&e.ElectionID, &e.MemberID, &e.LumpSumAmount, &e.NumInstallments,
		&e.InstallmentAmount, &e.EffectiveDate, &e.InstallmentsPaid,
		&e.RemainingAmount,
		&e.BeneficiaryFirst, &e.BeneficiaryLast, &e.BeneficiaryRelation,
		&e.TransferDate, &e.StatusCode,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query death benefit election %s: %w", memberID, err)
	}
	return e, nil
}

// GetOverpaymentRecords retrieves overpayment records for a death record.
func (q *Queries) GetOverpaymentRecords(memberID string) ([]models.OverpaymentRecord, error) {
	rows, err := q.db.Query(`
		SELECT OVERPAY_ID, DEATH_REC_ID, MBR_ID,
		       PAY_DT, PAY_AMT,
		       COALESCE(RECOVERY_STATUS,'IDENTIFIED'),
		       COALESCE(RECOVERY_AMT,0),
		       RECOVERY_DT, COALESCE(RECOVERY_SRC,''),
		       COALESCE(NOTES,'')
		FROM OVERPAYMENT_RECORD
		WHERE MBR_ID = $1
		ORDER BY PAY_DT ASC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query overpayment records %s: %w", memberID, err)
	}
	defer rows.Close()

	var records []models.OverpaymentRecord
	for rows.Next() {
		o := models.OverpaymentRecord{}
		err := rows.Scan(
			&o.OverpaymentID, &o.DeathRecordID, &o.MemberID,
			&o.PaymentDate, &o.PaymentAmount,
			&o.RecoveryStatus, &o.RecoveryAmount,
			&o.RecoveryDate, &o.RecoverySource,
			&o.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("scan overpayment row: %w", err)
		}
		records = append(records, o)
	}
	return records, rows.Err()
}

// SaveDeathNotification creates a new death record and suspends the member's benefit
// within a single transaction. If the member status update fails, the death record
// insert is rolled back — a deceased member must not remain active.
// Returns the generated death record ID.
func (q *Queries) SaveDeathNotification(req *models.DeathNotificationRequest) (int, error) {
	now := time.Now().UTC()

	// Read-only lookup outside the transaction
	member, err := q.GetMember(req.MemberID)
	if err != nil {
		return 0, fmt.Errorf("lookup member %s: %w", req.MemberID, err)
	}
	if member == nil {
		return 0, fmt.Errorf("member %s not found", req.MemberID)
	}

	var deathDate *time.Time
	if req.DeathDate != "" {
		t, err := time.Parse("2006-01-02", req.DeathDate)
		if err != nil {
			return 0, fmt.Errorf("parse death date %q: %w", req.DeathDate, err)
		}
		deathDate = &t
	}

	var deathRecID int
	err = q.RunInTx(func(txq *Queries) error {
		// INSERT DEATH_RECORD
		txErr := txq.db.QueryRow(`
			INSERT INTO DEATH_RECORD (
				MBR_ID, DEATH_DT, NOTIFY_DT, NOTIFY_SRC,
				NOTIFY_CONTACT, NOTIFY_PHONE,
				MBR_STATUS_PREV, MBR_STATUS_CURR,
				STATUS_CD, SUSPEND_DT, NOTES,
				CREATE_DT, CREATE_USER
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
			RETURNING DEATH_REC_ID
		`,
			req.MemberID, deathDate, now, req.NotifySource,
			req.NotifyContact, req.NotifyPhone,
			member.StatusCode, "S", // S = Suspended
			"NOTIFIED", now, req.Notes,
			now, "NOUI_SYSTEM",
		).Scan(&deathRecID)
		if txErr != nil {
			return fmt.Errorf("insert death record: %w", txErr)
		}

		// UPDATE MEMBER_MASTER — must succeed or entire operation rolls back
		_, txErr = txq.db.Exec(`
			UPDATE MEMBER_MASTER SET STATUS_CD = 'S' WHERE MBR_ID = $1
		`, req.MemberID)
		if txErr != nil {
			return fmt.Errorf("suspend member %s: %w", req.MemberID, txErr)
		}
		return nil
	})
	if err != nil {
		return 0, err
	}

	log.Printf("AUDIT: Death notification recorded for member %s, death_rec_id=%d", req.MemberID, deathRecID)
	return deathRecID, nil
}

// SaveSurvivorClaim creates a new survivor benefit claim.
// Returns the generated claim ID.
func (q *Queries) SaveSurvivorClaim(req *models.SurvivorClaimRequest, deathRecID int) (int, error) {
	now := time.Now().UTC()

	var survDOB *time.Time
	if req.SurvivorDOB != "" {
		t, err := time.Parse("2006-01-02", req.SurvivorDOB)
		if err != nil {
			return 0, fmt.Errorf("parse survivor DOB %q: %w", req.SurvivorDOB, err)
		}
		survDOB = &t
	}

	var jsPct *float64
	if req.JSPercentage > 0 {
		jsPct = &req.JSPercentage
	}

	var claimID int
	err := q.db.QueryRow(`
		INSERT INTO SURVIVOR_CLAIM (
			DEATH_REC_ID, MBR_ID,
			SURV_FIRST_NM, SURV_LAST_NM, SURV_DOB, SURV_RELATION,
			CLAIM_TYPE, JS_PCT,
			STATUS_CD, CREATE_DT, CREATE_USER
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING CLAIM_ID
	`,
		deathRecID, req.MemberID,
		req.SurvivorFirst, req.SurvivorLast, survDOB, req.SurvivorRelation,
		req.ClaimType, jsPct,
		"PENDING", now, "NOUI_SYSTEM",
	).Scan(&claimID)
	if err != nil {
		return 0, fmt.Errorf("insert survivor claim: %w", err)
	}

	log.Printf("AUDIT: Survivor claim #%d created for member %s, type=%s", claimID, req.MemberID, req.ClaimType)
	return claimID, nil
}
