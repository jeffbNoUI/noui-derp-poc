// Refund-domain database queries for the connector service.
// Provides access to CONTRIBUTION_LEDGER, INTEREST_CREDIT, and REFUND_APPLICATION tables.
//
// Consumed by: connector/internal/api/refund_handlers.go
// Depends on: database/schema/003_refund_schema.sql, connector/internal/models/refund.go
package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetContributionLedger retrieves monthly contribution ledger entries for a member,
// ordered chronologically. Used for refund contribution accumulation.
func (q *Queries) GetContributionLedger(memberID string) ([]models.ContributionLedgerEntry, error) {
	rows, err := q.db.Query(`
		SELECT LEDGER_ID, MBR_ID, LEDGER_MONTH,
		       COALESCE(PENS_SALARY,0), COALESCE(EMPL_CONTRIB,0),
		       COALESCE(EMPR_CONTRIB,0), COALESCE(RUNNING_BAL,0),
		       COALESCE(FISCAL_YR,0)
		FROM CONTRIBUTION_LEDGER
		WHERE MBR_ID = $1
		ORDER BY LEDGER_MONTH ASC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query contribution ledger %s: %w", memberID, err)
	}
	defer rows.Close()

	var entries []models.ContributionLedgerEntry
	for rows.Next() {
		e := models.ContributionLedgerEntry{}
		err := rows.Scan(
			&e.LedgerID, &e.MemberID, &e.LedgerMonth,
			&e.PensSalary, &e.EmplContrib,
			&e.EmprContrib, &e.RunningBal,
			&e.FiscalYear,
		)
		if err != nil {
			return nil, fmt.Errorf("scan contribution ledger row: %w", err)
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

// GetInterestCredits retrieves annual interest compounding records for a member.
func (q *Queries) GetInterestCredits(memberID string) ([]models.InterestCredit, error) {
	rows, err := q.db.Query(`
		SELECT CREDIT_ID, MBR_ID, CREDIT_DT,
		       COALESCE(BAL_BEFORE,0), COALESCE(INTEREST_RT,0),
		       COALESCE(INTEREST_AMT,0), COALESCE(BAL_AFTER,0),
		       COALESCE(FISCAL_YR,0)
		FROM INTEREST_CREDIT
		WHERE MBR_ID = $1
		ORDER BY CREDIT_DT ASC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query interest credits %s: %w", memberID, err)
	}
	defer rows.Close()

	var credits []models.InterestCredit
	for rows.Next() {
		c := models.InterestCredit{}
		err := rows.Scan(
			&c.CreditID, &c.MemberID, &c.CreditDate,
			&c.BalBefore, &c.InterestRate,
			&c.InterestAmt, &c.BalAfter,
			&c.FiscalYear,
		)
		if err != nil {
			return nil, fmt.Errorf("scan interest credit row: %w", err)
		}
		credits = append(credits, c)
	}
	return credits, rows.Err()
}

// GetRefundApplication retrieves the most recent refund application for a member.
func (q *Queries) GetRefundApplication(memberID string) (*models.RefundApplication, error) {
	row := q.db.QueryRow(`
		SELECT REFUND_ID, MBR_ID, APP_DT, TERM_DT, WAIT_EXPIRE_DT,
		       STATUS_CD, COALESCE(DENY_REASON,''),
		       COALESCE(TOTAL_CONTRIB,0), COALESCE(TOTAL_INTEREST,0),
		       COALESCE(GROSS_REFUND,0), COALESCE(TAX_WITHHOLD,0), COALESCE(NET_REFUND,0),
		       COALESCE(ELECT_TYPE,''), COALESCE(ROLLOVER_AMT,0), COALESCE(ROLLOVER_INST,''),
		       COALESCE(VESTED_FLG,'N'), COALESCE(SVC_YEARS,0), COALESCE(FORFEIT_FLG,'N'),
		       FORFEIT_ACK_DT, CALC_DT, APPROVED_DT, PAID_DT,
		       COALESCE(NOTES,'')
		FROM REFUND_APPLICATION
		WHERE MBR_ID = $1
		ORDER BY APP_DT DESC
		LIMIT 1
	`, memberID)

	app := &models.RefundApplication{}
	var vestedFlag, forfeitFlag string
	err := row.Scan(
		&app.RefundID, &app.MemberID, &app.ApplicationDt,
		&app.TerminationDt, &app.WaitExpireDt,
		&app.StatusCode, &app.DenyReason,
		&app.TotalContrib, &app.TotalInterest,
		&app.GrossRefund, &app.TaxWithhold, &app.NetRefund,
		&app.ElectionType, &app.RolloverAmt, &app.RolloverInst,
		&vestedFlag, &app.ServiceYears, &forfeitFlag,
		&app.ForfeitureAckDt, &app.CalcDate, &app.ApprovedDt, &app.PaidDt,
		&app.Notes,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query refund application %s: %w", memberID, err)
	}
	app.Vested = vestedFlag == "Y"
	app.ForfeitureReq = forfeitFlag == "Y"
	return app, nil
}

// SaveRefundApplication inserts or updates a refund application.
func (q *Queries) SaveRefundApplication(app *models.RefundApplication) (int, error) {
	now := time.Now().UTC()

	vestedFlg := "N"
	if app.Vested {
		vestedFlg = "Y"
	}
	forfeitFlg := "N"
	if app.ForfeitureReq {
		forfeitFlg = "Y"
	}

	var refundID int
	err := q.db.QueryRow(`
		INSERT INTO REFUND_APPLICATION (
			MBR_ID, APP_DT, TERM_DT, WAIT_EXPIRE_DT, STATUS_CD,
			TOTAL_CONTRIB, TOTAL_INTEREST, GROSS_REFUND, TAX_WITHHOLD, NET_REFUND,
			ELECT_TYPE, ROLLOVER_AMT, ROLLOVER_INST,
			VESTED_FLG, SVC_YEARS, FORFEIT_FLG,
			CALC_DT, CALC_USER,
			CREATE_DT, CREATE_USER
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10,
			$11, $12, $13,
			$14, $15, $16,
			$17, $18,
			$19, $20
		) RETURNING REFUND_ID
	`,
		app.MemberID, app.ApplicationDt, app.TerminationDt, app.WaitExpireDt, app.StatusCode,
		app.TotalContrib, app.TotalInterest, app.GrossRefund, app.TaxWithhold, app.NetRefund,
		app.ElectionType, app.RolloverAmt, app.RolloverInst,
		vestedFlg, app.ServiceYears, forfeitFlg,
		now, "NOUI_SYSTEM",
		now, "NOUI_SYSTEM",
	).Scan(&refundID)
	if err != nil {
		return 0, fmt.Errorf("insert refund application: %w", err)
	}
	return refundID, nil
}
