// Legacy adapter wrapping db.Queries to satisfy repository interfaces.
// Consumed by: main.go (factory wiring), api.Handlers (via interfaces)
// Depends on: db.Queries (current SQL implementations)
//
// This adapter forwards all calls to the existing db.Queries struct.
// Context parameters are accepted but not passed through (legacy SQL doesn't use context).
// Future: replace with repository/modern/ implementations that use context-aware queries.
package repository

import (
	"context"
	"time"

	"github.com/noui-derp-poc/connector/internal/db"
	"github.com/noui-derp-poc/connector/internal/models"
)

// LegacyAdapter wraps db.Queries to implement all repository interfaces.
type LegacyAdapter struct {
	q *db.Queries
}

// NewLegacyAdapter creates a LegacyAdapter from an existing db.Queries instance.
func NewLegacyAdapter(q *db.Queries) *LegacyAdapter {
	return &LegacyAdapter{q: q}
}

// --- HealthRepository ---

func (a *LegacyAdapter) Ping() error {
	return a.q.Ping()
}

// --- MemberRepository ---

func (a *LegacyAdapter) GetMember(_ context.Context, memberID string) (*models.Member, error) {
	return a.q.GetMember(memberID)
}

func (a *LegacyAdapter) SearchMembers(_ context.Context, query string) ([]db.MemberSearchResult, error) {
	return a.q.SearchMembers(query)
}

// --- EmploymentRepository ---

func (a *LegacyAdapter) GetEmploymentHistory(_ context.Context, memberID string) ([]models.EmploymentEvent, error) {
	return a.q.GetEmploymentHistory(memberID)
}

// --- SalaryRepository ---

func (a *LegacyAdapter) GetSalaryHistory(_ context.Context, memberID string, startDate, endDate *time.Time) ([]models.SalaryRecord, error) {
	return a.q.GetSalaryHistory(memberID, startDate, endDate)
}

// --- ServiceCreditRepository ---

func (a *LegacyAdapter) GetServiceCredits(_ context.Context, memberID string) ([]models.ServiceCredit, error) {
	return a.q.GetServiceCredits(memberID)
}

// --- BeneficiaryRepository ---

func (a *LegacyAdapter) GetBeneficiaries(_ context.Context, memberID string) ([]models.Beneficiary, error) {
	return a.q.GetBeneficiaries(memberID)
}

// --- DRORepository ---

func (a *LegacyAdapter) GetDROs(_ context.Context, memberID string) ([]models.DRO, error) {
	return a.q.GetDROs(memberID)
}

// --- ContributionRepository ---

func (a *LegacyAdapter) GetContributions(_ context.Context, memberID string) ([]models.ContributionRecord, error) {
	return a.q.GetContributions(memberID)
}

func (a *LegacyAdapter) GetContributionSummary(_ context.Context, memberID string) (*models.ContributionSummary, error) {
	return a.q.GetContributionSummary(memberID)
}

func (a *LegacyAdapter) GetContributionLedger(_ context.Context, memberID string) ([]models.ContributionLedgerEntry, error) {
	return a.q.GetContributionLedger(memberID)
}

func (a *LegacyAdapter) GetInterestCredits(_ context.Context, memberID string) ([]models.InterestCredit, error) {
	return a.q.GetInterestCredits(memberID)
}

// --- CaseRepository ---

func (a *LegacyAdapter) SaveRetirementElection(_ context.Context, e *models.RetirementElection) (int, error) {
	return a.q.SaveRetirementElection(e)
}

func (a *LegacyAdapter) SaveRefundApplication(_ context.Context, app *models.RefundApplication) (int, error) {
	return a.q.SaveRefundApplication(app)
}

func (a *LegacyAdapter) GetRefundApplication(_ context.Context, memberID string) (*models.RefundApplication, error) {
	return a.q.GetRefundApplication(memberID)
}

// SaveDeathNotification — the legacy version internally calls GetMember,
// but the repository interface receives prevStatus as a parameter to keep repositories isolated.
func (a *LegacyAdapter) SaveDeathNotification(_ context.Context, req *models.DeathNotificationRequest, prevStatus string) (int, error) {
	// The legacy implementation calls GetMember internally; we keep using it for now
	// but pass prevStatus for future domain-isolated implementation
	return a.q.SaveDeathNotification(req)
}

func (a *LegacyAdapter) SaveSurvivorClaim(_ context.Context, req *models.SurvivorClaimRequest, deathRecID int) (int, error) {
	return a.q.SaveSurvivorClaim(req, deathRecID)
}

// --- DeathRecordRepository ---

func (a *LegacyAdapter) GetDeathRecord(_ context.Context, memberID string) (*models.DeathRecord, error) {
	return a.q.GetDeathRecord(memberID)
}

func (a *LegacyAdapter) GetSurvivorClaims(_ context.Context, memberID string) ([]models.SurvivorClaim, error) {
	return a.q.GetSurvivorClaims(memberID)
}

func (a *LegacyAdapter) GetDeathBenefitElection(_ context.Context, memberID string) (*models.DeathBenefitElection, error) {
	return a.q.GetDeathBenefitElection(memberID)
}

func (a *LegacyAdapter) GetOverpaymentRecords(_ context.Context, memberID string) ([]models.OverpaymentRecord, error) {
	return a.q.GetOverpaymentRecords(memberID)
}

// --- EmployerRepository ---

func (a *LegacyAdapter) GetDepartments(_ context.Context) ([]models.Department, error) {
	return a.q.GetDepartments()
}

func (a *LegacyAdapter) GetEmployeesByDepartment(_ context.Context, deptCode string) ([]models.EmployerEmployee, error) {
	return a.q.GetEmployeesByDepartment(deptCode)
}

func (a *LegacyAdapter) GetContributionReports(_ context.Context, deptCode string) ([]models.ContributionReport, error) {
	return a.q.GetContributionReports(deptCode)
}

func (a *LegacyAdapter) GetPendingRetirements(_ context.Context, deptCode string) ([]models.EmployerEmployee, error) {
	return a.q.GetPendingRetirements(deptCode)
}

func (a *LegacyAdapter) GetEmployerDashboardStats(_ context.Context, deptCode string) (*models.EmployerDashboardStats, error) {
	return a.q.GetEmployerDashboardStats(deptCode)
}

// --- VendorRepository ---

func (a *LegacyAdapter) GetEnrollmentQueue(_ context.Context) ([]models.EnrollmentQueueItem, error) {
	return a.q.GetEnrollmentQueue()
}

func (a *LegacyAdapter) GetVendorStats(_ context.Context) (*models.VendorDashboardStats, error) {
	return a.q.GetVendorStats()
}

func (a *LegacyAdapter) GetRecentRetireeServiceCredit(_ context.Context, memberID string) (float64, error) {
	return a.q.GetRecentRetireeServiceCredit(memberID)
}

// Compile-time interface verification
var _ HealthRepository = (*LegacyAdapter)(nil)
var _ MemberRepository = (*LegacyAdapter)(nil)
var _ EmploymentRepository = (*LegacyAdapter)(nil)
var _ SalaryRepository = (*LegacyAdapter)(nil)
var _ ServiceCreditRepository = (*LegacyAdapter)(nil)
var _ BeneficiaryRepository = (*LegacyAdapter)(nil)
var _ DRORepository = (*LegacyAdapter)(nil)
var _ ContributionRepository = (*LegacyAdapter)(nil)
var _ CaseRepository = (*LegacyAdapter)(nil)
var _ DeathRecordRepository = (*LegacyAdapter)(nil)
var _ EmployerRepository = (*LegacyAdapter)(nil)
var _ VendorRepository = (*LegacyAdapter)(nil)
