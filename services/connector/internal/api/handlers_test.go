package api

import (
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/noui-derp-poc/connector/internal/db"
	"github.com/noui-derp-poc/connector/internal/models"
)

// mockDB implements a test double for db.Queries using an embedded Queries
// with overridable functions. Since db.Queries methods use a *sql.DB,
// we test via the HTTP layer using the router and a mock data source.

// For these handler tests, we use the testQueries helper which creates
// a Handlers with a real db.Queries pointed at a mock *sql.DB.
// However, since we can't create a real sql.DB without postgres,
// we test the handlers at the HTTP level by directly calling them
// with crafted requests and verifying the JSON response shape.

// Since Handlers is tightly coupled to db.Queries (which needs a real *sql.DB),
// these tests verify the routing, response envelope, and business logic
// in buildServiceCreditSummary and extractMemberID.

func TestExtractMemberID(t *testing.T) {
	tests := []struct {
		path     string
		expected string
	}{
		{"/api/v1/members/M-100001", "M-100001"},
		{"/api/v1/members/M-100001/salary", "M-100001"},
		{"/api/v1/members/M-100001/employment", "M-100001"},
		{"/api/v1/members/M-100002/beneficiaries", "M-100002"},
		{"/api/v1/members/", ""},
		{"/api/v1/", ""},
		{"/healthz", ""},
		{"", ""},
	}
	for _, tt := range tests {
		got := extractMemberID(tt.path)
		if got != tt.expected {
			t.Errorf("extractMemberID(%q) = %q, want %q", tt.path, got, tt.expected)
		}
	}
}

func TestBuildServiceCreditSummary(t *testing.T) {
	// Case 2 (Jennifer Kim): Purchased service excluded from Rule of 75/IPR
	credits := []models.ServiceCredit{
		{ServiceType: "EMPL", YearsCredit: 18.17, InclBenefit: true, InclElig: true, InclIPR: true},
		{ServiceType: "PURCH", YearsCredit: 3.00, InclBenefit: true, InclElig: false, InclIPR: false},
	}

	summary := buildServiceCreditSummary(credits)

	assertFloat(t, "earned_years", summary.EarnedYears, 18.17, 0.01)
	assertFloat(t, "purchased_years", summary.PurchasedYears, 3.00, 0.01)
	assertFloat(t, "total_for_benefit", summary.TotalForBenefit, 21.17, 0.01)
	assertFloat(t, "total_for_elig", summary.TotalForElig, 18.17, 0.01)
	assertFloat(t, "total_for_ipr", summary.TotalForIPR, 18.17, 0.01)
}

func TestBuildServiceCreditSummaryCase1(t *testing.T) {
	// Case 1 (Robert Martinez): All earned, no purchased
	credits := []models.ServiceCredit{
		{ServiceType: "EMPL", YearsCredit: 28.75, InclBenefit: true, InclElig: true, InclIPR: true},
	}

	summary := buildServiceCreditSummary(credits)

	assertFloat(t, "earned_years", summary.EarnedYears, 28.75, 0.01)
	assertFloat(t, "purchased_years", summary.PurchasedYears, 0.0, 0.01)
	assertFloat(t, "total_for_benefit", summary.TotalForBenefit, 28.75, 0.01)
	assertFloat(t, "total_for_elig", summary.TotalForElig, 28.75, 0.01)
	assertFloat(t, "total_for_ipr", summary.TotalForIPR, 28.75, 0.01)
}

func TestBuildServiceCreditSummaryMilitary(t *testing.T) {
	// Hypothetical: member with military and leave credit
	credits := []models.ServiceCredit{
		{ServiceType: "EMPL", YearsCredit: 20.00, InclBenefit: true, InclElig: true, InclIPR: true},
		{ServiceType: "MILITARY", YearsCredit: 4.00, InclBenefit: true, InclElig: true, InclIPR: true},
		{ServiceType: "LEAVE", YearsCredit: 0.50, InclBenefit: true, InclElig: true, InclIPR: false},
	}

	summary := buildServiceCreditSummary(credits)

	assertFloat(t, "earned", summary.EarnedYears, 20.0, 0.01)
	assertFloat(t, "military", summary.MilitaryYears, 4.0, 0.01)
	assertFloat(t, "leave", summary.LeaveYears, 0.5, 0.01)
	assertFloat(t, "total_benefit", summary.TotalForBenefit, 24.5, 0.01)
	assertFloat(t, "total_elig", summary.TotalForElig, 24.5, 0.01)
	assertFloat(t, "total_ipr", summary.TotalForIPR, 24.0, 0.01) // Leave excluded from IPR
}

func TestHealthEndpoint(t *testing.T) {
	// Health endpoint doesn't need db.Queries
	h := &Handlers{q: &db.Queries{}}
	router := NewRouter(h)

	req := httptest.NewRequest("GET", "/healthz", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("health check status = %d, want %d", rr.Code, http.StatusOK)
	}

	var resp SuccessResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		t.Fatal("data is not a map")
	}
	if data["status"] != "ok" {
		t.Errorf("status = %q, want %q", data["status"], "ok")
	}
	if data["service"] != "connector" {
		t.Errorf("service = %q, want %q", data["service"], "connector")
	}
	if resp.Meta.RequestID == "" {
		t.Error("request_id is empty")
	}
	if resp.Meta.Timestamp == "" {
		t.Error("timestamp is empty")
	}
}

func TestMethodNotAllowed(t *testing.T) {
	h := &Handlers{q: &db.Queries{}}
	router := NewRouter(h)

	req := httptest.NewRequest("POST", "/api/v1/members/M-100001", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("POST status = %d, want %d", rr.Code, http.StatusMethodNotAllowed)
	}
}

func TestUnknownResource(t *testing.T) {
	h := &Handlers{q: &db.Queries{}}
	router := NewRouter(h)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100001/unknown", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("unknown resource status = %d, want %d", rr.Code, http.StatusNotFound)
	}
}

func TestResponseEnvelope(t *testing.T) {
	// Verify the success response envelope structure
	rr := httptest.NewRecorder()
	testData := map[string]string{"key": "value"}
	WriteJSON(rr, http.StatusOK, testData)

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want %q", ct, "application/json")
	}

	var resp SuccessResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Meta.RequestID == "" {
		t.Error("missing request_id")
	}
}

func TestErrorEnvelope(t *testing.T) {
	rr := httptest.NewRecorder()
	WriteError(rr, http.StatusNotFound, "MEMBER_NOT_FOUND", "No member found")

	if rr.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusNotFound)
	}

	var resp ErrorResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Error.Code != "MEMBER_NOT_FOUND" {
		t.Errorf("error code = %q, want %q", resp.Error.Code, "MEMBER_NOT_FOUND")
	}
	if resp.Error.RequestID == "" {
		t.Error("missing request_id in error")
	}
}

// assertFloat checks two floats are equal within a tolerance.
func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.2f, want %.2f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

// Unused import guard
var _ = time.Now
