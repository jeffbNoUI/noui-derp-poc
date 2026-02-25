// HTTP handlers for the DERP Data Connector service.
// Consumed by: router.go
// Depends on: db.Queries (database access), ams (AMS calculator), models (domain types)
//
// Each handler validates the request, queries the database, applies domain logic
// (tier computation, DQ detection), and returns a CRITICAL-002 envelope response.
package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/noui-derp-poc/connector/internal/ams"
	"github.com/noui-derp-poc/connector/internal/db"
	"github.com/noui-derp-poc/connector/internal/models"
)

// Handlers provides HTTP handlers backed by database queries.
type Handlers struct {
	q *db.Queries
}

// NewHandlers creates a new Handlers instance.
func NewHandlers(q *db.Queries) *Handlers {
	return &Handlers{q: q}
}

// extractMemberID extracts the member ID from the URL path.
// Expected path format: /api/v1/members/{id} or /api/v1/members/{id}/resource
func extractMemberID(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	// /api/v1/members/{id}...  → parts: [api, v1, members, {id}, ...]
	if len(parts) >= 4 && parts[0] == "api" && parts[1] == "v1" && parts[2] == "members" {
		return parts[3]
	}
	return ""
}

// ComputeTier determines member tier from hire date per RULE-TIER-DETERMINATION.
// Source: RMC §18-391
//   - hired before 2004-09-01 → tier 1
//   - hired 2004-09-01 through 2011-06-30 → tier 2
//   - hired 2011-07-01 or later → tier 3
func ComputeTier(hireDate time.Time) int {
	tier2Start := time.Date(2004, 9, 1, 0, 0, 0, 0, time.UTC)
	tier3Start := time.Date(2011, 7, 1, 0, 0, 0, 0, time.UTC)

	if hireDate.Before(tier2Start) {
		return 1
	}
	if hireDate.Before(tier3Start) {
		return 2
	}
	return 3
}

// checkMemberDQ runs inline DQ checks on a member record.
// Returns DQ flags detected for this member.
func checkMemberDQ(m *models.Member, computedTier int) []DataQualityFlag {
	var flags []DataQualityFlag

	// DQ-001: Active status with termination date
	if m.StatusCode == "A" && m.TermDate != nil {
		flags = append(flags, DataQualityFlag{
			Code:          "DQ-001",
			Severity:      "high",
			Entity:        "member",
			Field:         "status",
			Message:       "Active member has a termination date populated",
			StoredValue:   "active with termination date " + m.TermDate.Format("2006-01-02"),
			ExpectedValue: "No termination date for active members",
			Rule:          "RULE-TIER-DETERMINATION",
		})
	}

	// DQ-006: Tier misclassification (stored vs computed from hireDate)
	if m.Tier != computedTier {
		flags = append(flags, DataQualityFlag{
			Code:          "DQ-006",
			Severity:      "critical",
			Entity:        "member",
			Field:         "tier",
			Message:       "Stored tier does not match tier computed from hire date",
			StoredValue:   m.Tier,
			ExpectedValue: computedTier,
			Rule:          "RULE-TIER-DETERMINATION",
		})
	}

	return flags
}

// Health handles GET /healthz
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, r, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "connector",
		"version": "0.1.0",
	})
}

// Ready handles GET /readyz — checks DB connectivity
func (h *Handlers) Ready(w http.ResponseWriter, r *http.Request) {
	if err := h.q.Ping(); err != nil {
		log.Printf("ERROR: readyz DB ping failed: %v", err)
		WriteError(w, r, http.StatusServiceUnavailable, "DB_UNAVAILABLE",
			"Database connection check failed")
		return
	}
	WriteJSON(w, r, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "connector",
		"version": "0.1.0",
		"db":      "connected",
	})
}

// SearchMembers handles GET /api/v1/members/search?q={query}
// Searches by last name, first name, member ID, or last 4 SSN digits.
func (h *Handlers) SearchMembers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Search query 'q' parameter is required")
		return
	}

	results, err := h.q.SearchMembers(query)
	if err != nil {
		log.Printf("ERROR: SearchMembers(%s): %v", query, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to search members")
		return
	}

	WriteJSON(w, r, http.StatusOK, results)
}

// memberResponse is the JSON shape for GET /api/v1/members/{id}.
// Uses camelCase per shared-types.go contract; monetary values as strings per CRITICAL-002.
type memberResponse struct {
	MemberID      string  `json:"memberId"`
	FirstName     string  `json:"firstName"`
	LastName      string  `json:"lastName"`
	MiddleName    string  `json:"middleName,omitempty"`
	DateOfBirth   string  `json:"dateOfBirth"`
	Gender        string  `json:"gender,omitempty"`
	HireDate      string  `json:"hireDate"`
	TermDate      *string `json:"terminationDate"`
	Tier          int     `json:"tier"`
	Status        string  `json:"status"`
	Department    string  `json:"department,omitempty"`
	Position      string  `json:"position,omitempty"`
	AnnualSalary  string  `json:"annualSalary,omitempty"`
	MaritalStatus string  `json:"maritalStatus,omitempty"`
}

// statusToLowercase maps legacy uppercase status codes to lowercase per CRITICAL-002.
func statusToLowercase(code string) string {
	switch code {
	case "A":
		return "active"
	case "R":
		return "retired"
	case "T":
		return "terminated"
	case "D":
		return "deferred"
	case "X":
		return "deceased"
	default:
		return strings.ToLower(code)
	}
}

// GetMember handles GET /api/v1/members/{id}
func (h *Handlers) GetMember(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	// Compute tier from hireDate per RULE-TIER-DETERMINATION
	computedTier := member.Tier // fallback if no hire date
	if member.HireDate != nil {
		computedTier = ComputeTier(*member.HireDate)
	}

	// Run DQ checks
	dqFlags := checkMemberDQ(member, computedTier)

	// Build response with computed tier and camelCase/string monetary values
	resp := memberResponse{
		MemberID:      member.MemberID,
		FirstName:     member.FirstName,
		LastName:      member.LastName,
		MiddleName:    member.MiddleName,
		DateOfBirth:   formatDate(member.DateOfBirth),
		Gender:        strings.ToLower(member.Gender),
		HireDate:      formatDate(member.HireDate),
		Tier:          computedTier, // computed, not stored
		Status:        statusToLowercase(member.StatusCode),
		Department:    member.Department,
		Position:      member.Position,
		AnnualSalary:  FormatMoney(member.AnnualSalary),
		MaritalStatus: strings.ToLower(member.MaritalStatus),
	}
	if member.TermDate != nil {
		td := member.TermDate.Format("2006-01-02")
		resp.TermDate = &td
	}

	WriteJSON(w, r, http.StatusOK, resp, dqFlags...)
}

// GetEmployment handles GET /api/v1/members/{id}/employment
func (h *Handlers) GetEmployment(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	events, err := h.q.GetEmploymentHistory(memberID)
	if err != nil {
		log.Printf("ERROR: GetEmploymentHistory(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve employment history")
		return
	}

	credits, err := h.q.GetServiceCredits(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredits(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve service credits")
		return
	}

	summary := buildServiceCreditSummary(credits)

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId":      memberID,
		"events":        events,
		"serviceCredit": summary,
	})
}

// salaryResponse wraps the salary history and AMS calculation for JSON serialization.
// Monetary values are strings per CRITICAL-002.
type salaryResponse struct {
	MemberID            string              `json:"memberId"`
	Tier                int                 `json:"tier"`
	AMS                 *amsResponse        `json:"ams"`
	LeavePayoutEligible bool                `json:"leavePayoutEligible"`
	LeavePayoutNote     string              `json:"leavePayoutNote,omitempty"`
	SalaryRecordCount   int                 `json:"salaryRecordCount"`
}

// amsResponse is the AMS calculation result with string monetary values.
type amsResponse struct {
	Amount              string `json:"amount"`
	WindowMonths        int    `json:"windowMonths"`
	WindowStart         string `json:"windowStart"`
	WindowEnd           string `json:"windowEnd"`
	TotalCompensation   string `json:"totalCompensationInWindow"`
	BaseCompensation    string `json:"baseCompensation"`
	LeavePayoutIncluded bool   `json:"leavePayoutIncluded"`
	LeavePayoutAmount   string `json:"leavePayoutAmount,omitempty"`
}

// GetSalary handles GET /api/v1/members/{id}/salary
func (h *Handlers) GetSalary(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	records, err := h.q.GetSalaryHistory(memberID, nil, nil)
	if err != nil {
		log.Printf("ERROR: GetSalaryHistory(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve salary history")
		return
	}

	monthlies := ams.AggregateBiweeklyToMonthly(records)

	// Determine tier: compute from hireDate, accept ?tier= override for DQ-006 cases
	computedTier := member.Tier
	if member.HireDate != nil {
		computedTier = ComputeTier(*member.HireDate)
	}
	if tierOverride := r.URL.Query().Get("tier"); tierOverride != "" {
		switch tierOverride {
		case "1":
			computedTier = 1
		case "2":
			computedTier = 2
		case "3":
			computedTier = 3
		}
	}

	// RULE-LEAVE-PAYOUT: hired before Jan 1, 2010 AND sick/vacation leave
	leaveEligible := false
	leaveNote := ""
	if member.HireDate != nil {
		cutoff := time.Date(2010, 1, 1, 0, 0, 0, 0, time.UTC)
		if member.HireDate.Before(cutoff) {
			for _, rec := range records {
				if rec.LeavePayoutAmt != nil && *rec.LeavePayoutAmt > 0 &&
					(rec.LeavePayoutTyp == "SICK_VAC" || rec.LeavePayoutTyp == "sick_vacation") {
					leaveEligible = true
					leaveNote = "Hired before 2010-01-01 with sick/vacation leave"
					break
				}
			}
			if !leaveEligible {
				leaveNote = "Hired before 2010-01-01 but no sick/vacation leave payout found"
			}
		} else {
			leaveNote = "Not eligible — hired on or after 2010-01-01"
		}
	}

	windowSize := ams.WindowSize(computedTier)
	amsResult := ams.Calculate(monthlies, windowSize, leaveEligible)

	resp := salaryResponse{
		MemberID:            memberID,
		Tier:                computedTier,
		LeavePayoutEligible: leaveEligible,
		LeavePayoutNote:     leaveNote,
		SalaryRecordCount:   len(records),
	}

	if amsResult != nil {
		resp.AMS = &amsResponse{
			Amount:              FormatMoney(amsResult.AMS),
			WindowMonths:        amsResult.WindowMonths,
			WindowStart:         amsResult.WindowStart,
			WindowEnd:           amsResult.WindowEnd,
			TotalCompensation:   FormatMoney(amsResult.TotalCompensation),
			BaseCompensation:    FormatMoney(amsResult.BaseCompensation),
			LeavePayoutIncluded: leaveEligible,
			LeavePayoutAmount:   FormatMoney(amsResult.LeavePayoutAdded),
		}
	}

	WriteJSON(w, r, http.StatusOK, resp)
}

// GetBeneficiaries handles GET /api/v1/members/{id}/beneficiaries
func (h *Handlers) GetBeneficiaries(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	benes, err := h.q.GetBeneficiaries(memberID)
	if err != nil {
		log.Printf("ERROR: GetBeneficiaries(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve beneficiaries")
		return
	}

	// DQ-004: Check if active beneficiary allocations sum > 100%
	var dqFlags []DataQualityFlag
	var totalAlloc float64
	for _, b := range benes {
		if b.StatusCode == "A" {
			totalAlloc += b.AllocationPct
		}
	}
	if totalAlloc > 100.0 {
		dqFlags = append(dqFlags, DataQualityFlag{
			Code:          "DQ-004",
			Severity:      "medium",
			Entity:        "beneficiary",
			Field:         "allocationPercentage",
			Message:       "Active beneficiary allocations sum exceeds 100%",
			StoredValue:   FormatMoney(totalAlloc),
			ExpectedValue: "100.00 or less",
		})
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId":      memberID,
		"beneficiaries": benes,
	}, dqFlags...)
}

// GetDRO handles GET /api/v1/members/{id}/dro
func (h *Handlers) GetDRO(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	dros, err := h.q.GetDROs(memberID)
	if err != nil {
		log.Printf("ERROR: GetDROs(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve DRO records")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId": memberID,
		"hasDro":   len(dros) > 0,
		"droCount": len(dros),
		"dros":     dros,
	})
}

// GetContributions handles GET /api/v1/members/{id}/contributions
func (h *Handlers) GetContributions(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	summary, err := h.q.GetContributionSummary(memberID)
	if err != nil {
		log.Printf("ERROR: GetContributionSummary(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve contributions")
		return
	}

	// DQ-003: Check contribution balance mismatch
	var dqFlags []DataQualityFlag
	if summary != nil {
		mismatch := summary.CurrentEmplBal - summary.TotalEmplContrib
		if mismatch < -1.0 || mismatch > 1.0 {
			dqFlags = append(dqFlags, DataQualityFlag{
				Code:          "DQ-003",
				Severity:      "medium",
				Entity:        "contribution",
				Field:         "employeeBalance",
				Message:       "Cumulative contribution balance does not match sum of individual contributions",
				StoredValue:   FormatMoney(summary.CurrentEmplBal),
				ExpectedValue: FormatMoney(summary.TotalEmplContrib),
			})
		}
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId": memberID,
		"summary":  summary,
	}, dqFlags...)
}

// GetServiceCredit handles GET /api/v1/members/{id}/service-credit
func (h *Handlers) GetServiceCredit(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	credits, err := h.q.GetServiceCredits(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredits(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve service credits")
		return
	}

	summary := buildServiceCreditSummary(credits)

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId": memberID,
		"records":  credits,
		"summary":  summary,
	})
}

// SaveElection handles POST /api/v1/members/{id}/retirement-election
func (h *Handlers) SaveElection(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB limit
	var election models.RetirementElection
	if err := json.NewDecoder(r.Body).Decode(&election); err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}
	election.MemberID = memberID

	if election.RetirementDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "retirement_date is required")
		return
	}
	if election.PaymentOption == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "payment_option is required")
		return
	}

	caseID, err := h.q.SaveRetirementElection(&election)
	if err != nil {
		log.Printf("ERROR: SaveRetirementElection(%s): %v", memberID, err)
		log.Printf("ERROR: SaveRetirementElection(%s): internal: %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save election")
		return
	}

	result := models.RetirementElectionResult{
		MemberID:       memberID,
		CaseID:         caseID,
		Status:         "in_review",
		Message:        "Retirement application submitted successfully. Case created for review.",
		RetirementDate: election.RetirementDate,
		PaymentOption:  election.PaymentOption,
	}

	WriteJSON(w, r, http.StatusCreated, result)
}

// GetDataQuality handles GET /api/v1/data-quality/member/{id}
// Runs all DQ checks for a member and returns consolidated findings.
func (h *Handlers) GetDataQuality(w http.ResponseWriter, r *http.Request) {
	// Extract member ID from /api/v1/data-quality/member/{id}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/"), "/")
	if len(parts) < 5 || parts[3] != "member" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}
	memberID := parts[4]

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	var allFlags []DataQualityFlag

	// DQ-001 and DQ-006: member-level checks
	computedTier := member.Tier
	if member.HireDate != nil {
		computedTier = ComputeTier(*member.HireDate)
	}
	allFlags = append(allFlags, checkMemberDQ(member, computedTier)...)

	// DQ-002: Salary history gaps
	salaryGapFlags := h.checkSalaryGaps(memberID)
	allFlags = append(allFlags, salaryGapFlags...)

	// DQ-003: Contribution balance mismatch
	contribFlags := h.checkContributionMismatch(memberID)
	allFlags = append(allFlags, contribFlags...)

	// DQ-004: Beneficiary allocation > 100%
	beneFlags := h.checkBeneficiaryAllocation(memberID)
	allFlags = append(allFlags, beneFlags...)

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"memberId":   memberID,
		"flagCount":  len(allFlags),
		"flags":      allFlags,
	}, allFlags...)
}

// checkSalaryGaps checks for DQ-002: missing pay periods in salary history.
func (h *Handlers) checkSalaryGaps(memberID string) []DataQualityFlag {
	records, err := h.q.GetSalaryHistory(memberID, nil, nil)
	if err != nil || len(records) < 2 {
		return nil
	}

	// Check for gaps > 45 days between consecutive pay period end dates
	var flags []DataQualityFlag
	for i := 1; i < len(records); i++ {
		gap := records[i].PayPeriodEnd.Sub(records[i-1].PayPeriodEnd)
		if gap.Hours() > 45*24 { // More than 45 days between records = missing pay period(s)
			flags = append(flags, DataQualityFlag{
				Code:     "DQ-002",
				Severity: "high",
				Entity:   "salary",
				Field:    "payPeriodDate",
				Message:  "Missing pay period(s) — gap of " + formatDays(gap) + " between records",
				StoredValue:   records[i-1].PayPeriodEnd.Format("2006-01-02"),
				ExpectedValue: "Next record within ~14-31 days",
				Rule:          "RULE-AMS-WINDOW",
			})
		}
	}
	return flags
}

// checkContributionMismatch checks for DQ-003: cumulative balance doesn't match sum.
func (h *Handlers) checkContributionMismatch(memberID string) []DataQualityFlag {
	summary, err := h.q.GetContributionSummary(memberID)
	if err != nil || summary == nil {
		return nil
	}

	mismatch := summary.CurrentEmplBal - summary.TotalEmplContrib
	if mismatch < -1.0 || mismatch > 1.0 {
		return []DataQualityFlag{{
			Code:          "DQ-003",
			Severity:      "medium",
			Entity:        "contribution",
			Field:         "employeeBalance",
			Message:       "Cumulative contribution balance does not match sum of individual contributions",
			StoredValue:   FormatMoney(summary.CurrentEmplBal),
			ExpectedValue: FormatMoney(summary.TotalEmplContrib),
		}}
	}
	return nil
}

// checkBeneficiaryAllocation checks for DQ-004: active allocations > 100%.
func (h *Handlers) checkBeneficiaryAllocation(memberID string) []DataQualityFlag {
	benes, err := h.q.GetBeneficiaries(memberID)
	if err != nil {
		return nil
	}

	var totalAlloc float64
	for _, b := range benes {
		if b.StatusCode == "A" {
			totalAlloc += b.AllocationPct
		}
	}
	if totalAlloc > 100.0 {
		return []DataQualityFlag{{
			Code:          "DQ-004",
			Severity:      "medium",
			Entity:        "beneficiary",
			Field:         "allocationPercentage",
			Message:       "Active beneficiary allocations sum exceeds 100%",
			StoredValue:   FormatMoney(totalAlloc),
			ExpectedValue: "100.00 or less",
		}}
	}
	return nil
}

// buildServiceCreditSummary computes the separated service totals from credit records.
// CRITICAL: This correctly separates earned vs purchased service for different rule contexts.
// - BENEFIT CALCULATION uses total (earned + purchased)
// - RULE OF 75/85 and IPR use earned only
func buildServiceCreditSummary(credits []models.ServiceCredit) models.ServiceCreditSummary {
	var s models.ServiceCreditSummary
	for _, c := range credits {
		switch c.ServiceType {
		case "EMPL":
			s.EarnedYears += c.YearsCredit
		case "PURCH":
			s.PurchasedYears += c.YearsCredit
		case "MILITARY":
			s.MilitaryYears += c.YearsCredit
		case "LEAVE":
			s.LeaveYears += c.YearsCredit
		}

		if c.InclBenefit {
			s.TotalForBenefit += c.YearsCredit
		}
		if c.InclElig {
			s.TotalForElig += c.YearsCredit
		}
		if c.InclIPR {
			s.TotalForIPR += c.YearsCredit
		}
	}
	return s
}

// formatDate formats a *time.Time as ISO 8601 date string, or empty string if nil.
func formatDate(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02")
}

// formatDays formats a duration as a human-readable day count.
func formatDays(d time.Duration) string {
	days := int(d.Hours() / 24)
	return fmt.Sprintf("%d days", days)
}
