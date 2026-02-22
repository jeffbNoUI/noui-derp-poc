package db

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// Queries provides database query methods for the connector service.
type Queries struct {
	db *sql.DB
}

// NewQueries creates a new Queries instance.
func NewQueries(db *sql.DB) *Queries {
	return &Queries{db: db}
}

// GetMember retrieves a member by ID from MEMBER_MASTER.
func (q *Queries) GetMember(memberID string) (*models.Member, error) {
	row := q.db.QueryRow(`
		SELECT MBR_ID, FIRST_NM, LAST_NM, COALESCE(MIDDLE_NM,''), COALESCE(SUFFIX,''),
		       DOB, COALESCE(GENDER_CD,''), HIRE_DT, TERM_DT, REHIRE_DT, ORIG_HIRE_DT,
		       COALESCE(TIER_CD,0), STATUS_CD, COALESCE(DEPT_CD,''), COALESCE(POS_CD,''),
		       COALESCE(ANNUAL_SALARY,0), COALESCE(MARITAL_STATUS,'')
		FROM MEMBER_MASTER
		WHERE MBR_ID = $1
	`, memberID)

	m := &models.Member{}
	err := row.Scan(
		&m.MemberID, &m.FirstName, &m.LastName, &m.MiddleName, &m.Suffix,
		&m.DateOfBirth, &m.Gender, &m.HireDate, &m.TermDate, &m.RehireDate, &m.OrigHireDate,
		&m.Tier, &m.StatusCode, &m.Department, &m.Position,
		&m.AnnualSalary, &m.MaritalStatus,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query member %s: %w", memberID, err)
	}
	return m, nil
}

// GetEmploymentHistory retrieves employment events for a member, ordered by date.
func (q *Queries) GetEmploymentHistory(memberID string) ([]models.EmploymentEvent, error) {
	rows, err := q.db.Query(`
		SELECT MBR_ID, EVENT_TYPE, EVENT_DT,
		       COALESCE(FROM_DEPT,''), COALESCE(TO_DEPT,''),
		       COALESCE(FROM_POS,''), COALESCE(TO_POS,''),
		       FROM_SALARY, TO_SALARY,
		       COALESCE(SEP_REASON,''), COALESCE(NOTES,'')
		FROM EMPLOYMENT_HIST
		WHERE MBR_ID = $1
		ORDER BY EVENT_DT ASC, EVENT_TYPE ASC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query employment history %s: %w", memberID, err)
	}
	defer rows.Close()

	var events []models.EmploymentEvent
	for rows.Next() {
		e := models.EmploymentEvent{}
		err := rows.Scan(
			&e.MemberID, &e.EventType, &e.EventDate,
			&e.FromDept, &e.ToDept, &e.FromPos, &e.ToPos,
			&e.FromSalary, &e.ToSalary,
			&e.SepReason, &e.Notes,
		)
		if err != nil {
			return nil, fmt.Errorf("scan employment row: %w", err)
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// GetSalaryHistory retrieves salary records for a member within an optional date range.
func (q *Queries) GetSalaryHistory(memberID string, startDate, endDate *time.Time) ([]models.SalaryRecord, error) {
	query := `
		SELECT MBR_ID, PAY_PRD_END_DT, PAY_PRD_NBR,
		       COALESCE(BASE_PAY,0), COALESCE(OT_PAY,0), COALESCE(PENS_PAY,0),
		       COALESCE(SUPPL_PAY,0), LV_PAYOUT_AMT, COALESCE(LV_PAYOUT_TYPE,''),
		       FURLOUGH_HRS, FURLOUGH_DEDUCT,
		       ANNL_SALARY, PROC_DT
		FROM SALARY_HIST
		WHERE MBR_ID = $1
	`
	args := []interface{}{memberID}

	if startDate != nil {
		query += " AND PAY_PRD_END_DT >= $2"
		args = append(args, *startDate)
	}
	if endDate != nil {
		paramNum := len(args) + 1
		query += fmt.Sprintf(" AND PAY_PRD_END_DT <= $%d", paramNum)
		args = append(args, *endDate)
	}
	query += " ORDER BY PAY_PRD_END_DT ASC"

	rows, err := q.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query salary history %s: %w", memberID, err)
	}
	defer rows.Close()

	var records []models.SalaryRecord
	for rows.Next() {
		r := models.SalaryRecord{}
		err := rows.Scan(
			&r.MemberID, &r.PayPeriodEnd, &r.PayPeriodNum,
			&r.BasePay, &r.OvertimePay, &r.PensionablePay,
			&r.SupplPay, &r.LeavePayoutAmt, &r.LeavePayoutTyp,
			&r.FurloughHrs, &r.FurloughDeduct,
			&r.AnnualSalary, &r.ProcessDate,
		)
		if err != nil {
			return nil, fmt.Errorf("scan salary row: %w", err)
		}
		records = append(records, r)
	}
	return records, rows.Err()
}

// GetServiceCredits retrieves service credit records for a member.
func (q *Queries) GetServiceCredits(memberID string) ([]models.ServiceCredit, error) {
	rows, err := q.db.Query(`
		SELECT MBR_ID, SVC_TYPE, SVC_START_DT, SVC_END_DT,
		       COALESCE(YEARS_CREDIT,0), COALESCE(MONTHS_CREDIT,0),
		       PURCH_COST, PURCH_DT, COALESCE(PURCH_STATUS,''), COALESCE(PURCH_TYPE,''),
		       COALESCE(INCL_BENEFIT,'Y'), COALESCE(INCL_ELIG,'Y'), COALESCE(INCL_IPR,'Y')
		FROM SVC_CREDIT
		WHERE MBR_ID = $1
		ORDER BY SVC_TYPE, SVC_START_DT
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query service credits %s: %w", memberID, err)
	}
	defer rows.Close()

	var credits []models.ServiceCredit
	for rows.Next() {
		sc := models.ServiceCredit{}
		var inclB, inclE, inclI string
		err := rows.Scan(
			&sc.MemberID, &sc.ServiceType, &sc.StartDate, &sc.EndDate,
			&sc.YearsCredit, &sc.MonthsCredit,
			&sc.PurchaseCost, &sc.PurchaseDate, &sc.PurchaseStatus, &sc.PurchaseType,
			&inclB, &inclE, &inclI,
		)
		if err != nil {
			return nil, fmt.Errorf("scan service credit row: %w", err)
		}
		sc.InclBenefit = inclB == "Y"
		sc.InclElig = inclE == "Y"
		sc.InclIPR = inclI == "Y"
		credits = append(credits, sc)
	}
	return credits, rows.Err()
}

// GetBeneficiaries retrieves active beneficiary records for a member.
func (q *Queries) GetBeneficiaries(memberID string) ([]models.Beneficiary, error) {
	rows, err := q.db.Query(`
		SELECT BENE_ID, MBR_ID,
		       COALESCE(BENE_FIRST_NM,''), COALESCE(BENE_LAST_NM,''),
		       BENE_DOB, COALESCE(BENE_RELATION,''),
		       COALESCE(ALLOC_PCT,0), COALESCE(BENE_TYPE,'P'),
		       EFF_DT, COALESCE(STATUS_CD,'A'),
		       COALESCE(SPOUSE_CONSENT,''), CONSENT_DT
		FROM BENEFICIARY
		WHERE MBR_ID = $1
		ORDER BY STATUS_CD ASC, EFF_DT DESC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query beneficiaries %s: %w", memberID, err)
	}
	defer rows.Close()

	var benes []models.Beneficiary
	for rows.Next() {
		b := models.Beneficiary{}
		err := rows.Scan(
			&b.BeneficiaryID, &b.MemberID,
			&b.FirstName, &b.LastName,
			&b.DateOfBirth, &b.Relationship,
			&b.AllocationPct, &b.BeneficiaryTyp,
			&b.EffectiveDate, &b.StatusCode,
			&b.SpouseConsent, &b.ConsentDate,
		)
		if err != nil {
			return nil, fmt.Errorf("scan beneficiary row: %w", err)
		}
		benes = append(benes, b)
	}
	return benes, rows.Err()
}

// GetDROs retrieves DRO records for a member.
func (q *Queries) GetDROs(memberID string) ([]models.DRO, error) {
	rows, err := q.db.Query(`
		SELECT DRO_ID, MBR_ID, COURT_ORDER_DT,
		       COALESCE(COURT_NAME,''), COALESCE(CASE_NBR,''),
		       COALESCE(ALT_PAYEE_NM,''), ALT_PAYEE_DOB, COALESCE(ALT_PAYEE_RELATION,''),
		       MARRIAGE_DT, DIVORCE_DT,
		       COALESCE(DIV_METHOD,''), DIV_PCT, DIV_AMT,
		       COALESCE(DIV_DESC,''), COALESCE(STATUS_CD,''),
		       APPROVED_DT, CALC_MARITAL_SVC, CALC_MARITAL_FRAC
		FROM DRO_MASTER
		WHERE MBR_ID = $1
		ORDER BY RECV_DT DESC
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query DROs %s: %w", memberID, err)
	}
	defer rows.Close()

	var dros []models.DRO
	for rows.Next() {
		d := models.DRO{}
		err := rows.Scan(
			&d.DROID, &d.MemberID, &d.CourtOrderDate,
			&d.CourtName, &d.CaseNumber,
			&d.AltPayeeName, &d.AltPayeeDOB, &d.AltPayeeRelation,
			&d.MarriageDate, &d.DivorceDate,
			&d.DivisionMethod, &d.DivisionPct, &d.DivisionAmt,
			&d.DivisionDesc, &d.StatusCode,
			&d.ApprovedDate, &d.MaritalService, &d.MaritalFraction,
		)
		if err != nil {
			return nil, fmt.Errorf("scan DRO row: %w", err)
		}
		dros = append(dros, d)
	}
	return dros, rows.Err()
}

// GetContributions retrieves contribution records for a member.
func (q *Queries) GetContributions(memberID string) ([]models.ContributionRecord, error) {
	rows, err := q.db.Query(`
		SELECT MBR_ID, CONTRIB_DT,
		       COALESCE(EMPL_CONTRIB,0), COALESCE(EMPR_CONTRIB,0),
		       COALESCE(PENS_SALARY,0),
		       COALESCE(EMPL_BAL,0), COALESCE(EMPR_BAL,0), COALESCE(INTEREST_BAL,0),
		       COALESCE(FISCAL_YR,0), COALESCE(QTR,0)
		FROM CONTRIBUTION_HIST
		WHERE MBR_ID = $1
		ORDER BY CONTRIB_DT DESC
		LIMIT 100
	`, memberID)
	if err != nil {
		return nil, fmt.Errorf("query contributions %s: %w", memberID, err)
	}
	defer rows.Close()

	var contribs []models.ContributionRecord
	for rows.Next() {
		c := models.ContributionRecord{}
		err := rows.Scan(
			&c.MemberID, &c.ContribDate,
			&c.EmplContrib, &c.EmprContrib,
			&c.PensSalary,
			&c.EmplBalance, &c.EmprBalance, &c.InterestBal,
			&c.FiscalYear, &c.Quarter,
		)
		if err != nil {
			return nil, fmt.Errorf("scan contribution row: %w", err)
		}
		contribs = append(contribs, c)
	}
	return contribs, rows.Err()
}

// GetContributionSummary retrieves aggregate contribution totals for a member.
func (q *Queries) GetContributionSummary(memberID string) (*models.ContributionSummary, error) {
	row := q.db.QueryRow(`
		SELECT COALESCE(SUM(EMPL_CONTRIB),0), COALESCE(SUM(EMPR_CONTRIB),0), COUNT(*)
		FROM CONTRIBUTION_HIST
		WHERE MBR_ID = $1
	`, memberID)

	s := &models.ContributionSummary{}
	if err := row.Scan(&s.TotalEmplContrib, &s.TotalEmprContrib, &s.RecordCount); err != nil {
		return nil, fmt.Errorf("query contribution summary %s: %w", memberID, err)
	}

	// Get most recent balances
	row2 := q.db.QueryRow(`
		SELECT COALESCE(EMPL_BAL,0), COALESCE(EMPR_BAL,0), COALESCE(INTEREST_BAL,0)
		FROM CONTRIBUTION_HIST
		WHERE MBR_ID = $1
		ORDER BY CONTRIB_DT DESC
		LIMIT 1
	`, memberID)
	row2.Scan(&s.CurrentEmplBal, &s.CurrentEmprBal, &s.InterestBalance)

	return s, nil
}
