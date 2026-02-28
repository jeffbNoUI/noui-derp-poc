// Repository interfaces for the DERP connector service.
// Consumed by: api.Handlers (decoupled from concrete SQL implementations)
// Depends on: models (domain types)
//
// These interfaces decouple the handler layer from raw SQL queries, enabling:
//   - Future migration from legacy to domain schema
//   - Unit testing with mock implementations
//   - Dual-write support during migration
//
// Current implementation: db.Queries (legacy SQL). Future: repository/modern/ (domain schema).
package repository

import (
	"context"
	"time"

	"github.com/noui-derp-poc/connector/internal/db"
	"github.com/noui-derp-poc/connector/internal/models"
)

// HealthRepository checks database connectivity.
type HealthRepository interface {
	Ping() error
}

// MemberRepository provides member lookup and search.
type MemberRepository interface {
	GetMember(ctx context.Context, memberID string) (*models.Member, error)
	SearchMembers(ctx context.Context, query string) ([]db.MemberSearchResult, error)
}

// EmploymentRepository provides employment history access.
type EmploymentRepository interface {
	GetEmploymentHistory(ctx context.Context, memberID string) ([]models.EmploymentEvent, error)
}

// SalaryRepository provides salary history and AMS window access.
type SalaryRepository interface {
	GetSalaryHistory(ctx context.Context, memberID string, startDate, endDate *time.Time) ([]models.SalaryRecord, error)
}

// ServiceCreditRepository provides service credit access.
type ServiceCreditRepository interface {
	GetServiceCredits(ctx context.Context, memberID string) ([]models.ServiceCredit, error)
}

// BeneficiaryRepository provides beneficiary designation access.
type BeneficiaryRepository interface {
	GetBeneficiaries(ctx context.Context, memberID string) ([]models.Beneficiary, error)
}

// DRORepository provides Domestic Relations Order access.
type DRORepository interface {
	GetDROs(ctx context.Context, memberID string) ([]models.DRO, error)
}

// ContributionRepository provides contribution records and ledger access.
type ContributionRepository interface {
	GetContributions(ctx context.Context, memberID string) ([]models.ContributionRecord, error)
	GetContributionSummary(ctx context.Context, memberID string) (*models.ContributionSummary, error)
	GetContributionLedger(ctx context.Context, memberID string) ([]models.ContributionLedgerEntry, error)
	GetInterestCredits(ctx context.Context, memberID string) ([]models.InterestCredit, error)
}

// CaseRepository provides case and application persistence.
type CaseRepository interface {
	SaveRetirementElection(ctx context.Context, e *models.RetirementElection) (int, error)
	SaveRefundApplication(ctx context.Context, app *models.RefundApplication) (int, error)
	GetRefundApplication(ctx context.Context, memberID string) (*models.RefundApplication, error)
	SaveDeathNotification(ctx context.Context, req *models.DeathNotificationRequest, prevStatus string) (int, error)
	SaveSurvivorClaim(ctx context.Context, req *models.SurvivorClaimRequest, deathRecID int) (int, error)
}

// DeathRecordRepository provides death record and survivor claim access.
type DeathRecordRepository interface {
	GetDeathRecord(ctx context.Context, memberID string) (*models.DeathRecord, error)
	GetSurvivorClaims(ctx context.Context, memberID string) ([]models.SurvivorClaim, error)
	GetDeathBenefitElection(ctx context.Context, memberID string) (*models.DeathBenefitElection, error)
	GetOverpaymentRecords(ctx context.Context, memberID string) ([]models.OverpaymentRecord, error)
}

// EmployerRepository provides employer portal aggregation queries.
type EmployerRepository interface {
	GetDepartments(ctx context.Context) ([]models.Department, error)
	GetEmployeesByDepartment(ctx context.Context, deptCode string) ([]models.EmployerEmployee, error)
	GetContributionReports(ctx context.Context, deptCode string) ([]models.ContributionReport, error)
	GetPendingRetirements(ctx context.Context, deptCode string) ([]models.EmployerEmployee, error)
	GetEmployerDashboardStats(ctx context.Context, deptCode string) (*models.EmployerDashboardStats, error)
}

// VendorRepository provides vendor portal aggregation queries.
type VendorRepository interface {
	GetEnrollmentQueue(ctx context.Context) ([]models.EnrollmentQueueItem, error)
	GetVendorStats(ctx context.Context) (*models.VendorDashboardStats, error)
	GetRecentRetireeServiceCredit(ctx context.Context, memberID string) (float64, error)
}
