// Unit tests for connector HTTP handlers and business logic.
// Consumed by: go test
// Depends on: api package (handlers, response), db.Queries, models
//
// Tests routing, response envelope, service credit separation, tier computation,
// and status code mapping. Database-dependent handlers are tested via integration tests.
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

// assertFloat checks two floats are equal within a tolerance.
func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.2f, want %.2f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

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

func TestComputeTier(t *testing.T) {
	tests := []struct {
		name     string
		hireDate time.Time
		expected int
	}{
		// Tier 1: before Sept 1, 2004
		{"Tier 1 — well before boundary", time.Date(1998, 3, 15, 0, 0, 0, 0, time.UTC), 1},
		{"Tier 1 — day before boundary", time.Date(2004, 8, 31, 0, 0, 0, 0, time.UTC), 1},
		// Tier 2: Sept 1, 2004 through June 30, 2011
		{"Tier 2 — boundary start", time.Date(2004, 9, 1, 0, 0, 0, 0, time.UTC), 2},
		{"Tier 2 — mid-range", time.Date(2007, 6, 15, 0, 0, 0, 0, time.UTC), 2},
		{"Tier 2 — boundary end", time.Date(2011, 6, 30, 0, 0, 0, 0, time.UTC), 2},
		// Tier 3: July 1, 2011 or later
		{"Tier 3 — boundary start", time.Date(2011, 7, 1, 0, 0, 0, 0, time.UTC), 3},
		{"Tier 3 — well after boundary", time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC), 3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ComputeTier(tt.hireDate)
			if got != tt.expected {
				t.Errorf("ComputeTier(%s) = %d, want %d", tt.hireDate.Format("2006-01-02"), got, tt.expected)
			}
		})
	}
}

func TestStatusToLowercase(t *testing.T) {
	tests := []struct {
		code     string
		expected string
	}{
		{"A", "active"},
		{"R", "retired"},
		{"T", "terminated"},
		{"D", "deferred"},
		{"X", "deceased"},
		{"ACTIVE", "active"},
	}
	for _, tt := range tests {
		got := statusToLowercase(tt.code)
		if got != tt.expected {
			t.Errorf("statusToLowercase(%q) = %q, want %q", tt.code, got, tt.expected)
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
	assertFloat(t, "total_ipr", summary.TotalForIPR, 24.0, 0.01)
}

func TestFormatMoney(t *testing.T) {
	tests := []struct {
		input    float64
		expected string
	}{
		{10639.45, "10639.45"},
		{0, "0.00"},
		{52000.0, "52000.00"},
		{7347.62, "7347.62"},
		{100.1, "100.10"},
	}
	for _, tt := range tests {
		got := FormatMoney(tt.input)
		if got != tt.expected {
			t.Errorf("FormatMoney(%v) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestHealthEndpoint(t *testing.T) {
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

	// Verify CRITICAL-002 envelope fields
	if resp.Meta.RequestID == "" {
		t.Error("meta.requestId is empty")
	}
	if resp.Meta.Timestamp == "" {
		t.Error("meta.timestamp is empty")
	}
	if resp.Meta.Service != "connector" {
		t.Errorf("meta.service = %q, want %q", resp.Meta.Service, "connector")
	}
	if resp.Meta.Version != "v1" {
		t.Errorf("meta.version = %q, want %q", resp.Meta.Version, "v1")
	}
	if resp.Meta.Source != "legacy-direct" {
		t.Errorf("meta.source = %q, want %q", resp.Meta.Source, "legacy-direct")
	}
	if resp.DataQualityFlags == nil {
		t.Error("dataQualityFlags is nil, expected empty array")
	}
}

func TestResponseEnvelope(t *testing.T) {
	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	testData := map[string]string{"key": "value"}
	WriteJSON(rr, req, http.StatusOK, testData)

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusOK)
	}
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("Content-Type = %q, want %q", ct, "application/json")
	}

	// Verify full CRITICAL-002 envelope
	var raw map[string]json.RawMessage
	if err := json.NewDecoder(rr.Body).Decode(&raw); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// Must have data, dataQualityFlags, meta
	if _, ok := raw["data"]; !ok {
		t.Error("response missing 'data' field")
	}
	if _, ok := raw["dataQualityFlags"]; !ok {
		t.Error("response missing 'dataQualityFlags' field")
	}
	if _, ok := raw["meta"]; !ok {
		t.Error("response missing 'meta' field")
	}
}

func TestResponseEnvelopeWithDQFlags(t *testing.T) {
	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	testData := map[string]string{"key": "value"}
	flags := DataQualityFlag{
		Code:     "DQ-006",
		Severity: "critical",
		Entity:   "member",
		Field:    "tier",
		Message:  "Tier mismatch",
	}
	WriteJSON(rr, req, http.StatusOK, testData, flags)

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)

	if len(resp.DataQualityFlags) != 1 {
		t.Fatalf("expected 1 DQ flag, got %d", len(resp.DataQualityFlags))
	}
	if resp.DataQualityFlags[0].Code != "DQ-006" {
		t.Errorf("DQ flag code = %q, want %q", resp.DataQualityFlags[0].Code, "DQ-006")
	}
}

func TestErrorEnvelope(t *testing.T) {
	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	WriteError(rr, req, http.StatusNotFound, "MEMBER_NOT_FOUND", "No member found")

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
	if resp.Meta.RequestID == "" {
		t.Error("missing requestId in error")
	}
	if resp.Meta.Service != "connector" {
		t.Errorf("meta.service = %q, want %q", resp.Meta.Service, "connector")
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

func TestCORSHeaders(t *testing.T) {
	h := &Handlers{q: &db.Queries{}}
	router := NewRouter(h)

	// Test preflight OPTIONS request with allowed origin
	req := httptest.NewRequest("OPTIONS", "/api/v1/members/M-100001", nil)
	req.Header.Set("Origin", "http://localhost:5175")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Fatalf("OPTIONS status = %d, want %d", rr.Code, http.StatusNoContent)
	}
	if origin := rr.Header().Get("Access-Control-Allow-Origin"); origin != "http://localhost:5175" {
		t.Errorf("CORS origin = %q, want %q", origin, "http://localhost:5175")
	}

	// Test CORS on regular GET with allowed origin
	req2 := httptest.NewRequest("GET", "/healthz", nil)
	req2.Header.Set("Origin", "http://localhost:5175")
	rr2 := httptest.NewRecorder()
	router.ServeHTTP(rr2, req2)

	if origin := rr2.Header().Get("Access-Control-Allow-Origin"); origin != "http://localhost:5175" {
		t.Errorf("CORS origin on GET = %q, want %q", origin, "http://localhost:5175")
	}

	// Test CORS blocks disallowed origin
	req3 := httptest.NewRequest("GET", "/healthz", nil)
	req3.Header.Set("Origin", "http://evil.example.com")
	rr3 := httptest.NewRecorder()
	router.ServeHTTP(rr3, req3)

	if origin := rr3.Header().Get("Access-Control-Allow-Origin"); origin != "" {
		t.Errorf("CORS should block disallowed origin, got %q", origin)
	}
}

func TestCheckMemberDQ(t *testing.T) {
	t.Run("clean member — no flags", func(t *testing.T) {
		m := &models.Member{
			MemberID:   "M-100001",
			StatusCode: "A",
			Tier:       1,
		}
		flags := checkMemberDQ(m, 1)
		if len(flags) != 0 {
			t.Errorf("expected 0 DQ flags for clean member, got %d", len(flags))
		}
	})

	t.Run("DQ-001 — active with termination date", func(t *testing.T) {
		termDate := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
		m := &models.Member{
			MemberID:   "M-999001",
			StatusCode: "A",
			Tier:       1,
			TermDate:   &termDate,
		}
		flags := checkMemberDQ(m, 1)
		found := false
		for _, f := range flags {
			if f.Code == "DQ-001" {
				found = true
			}
		}
		if !found {
			t.Error("expected DQ-001 flag for active member with termination date")
		}
	})

	t.Run("DQ-006 — tier mismatch", func(t *testing.T) {
		m := &models.Member{
			MemberID:   "M-999002",
			StatusCode: "A",
			Tier:       2, // stored as 2
		}
		// Computed tier = 1 (different from stored)
		flags := checkMemberDQ(m, 1)
		found := false
		for _, f := range flags {
			if f.Code == "DQ-006" {
				found = true
			}
		}
		if !found {
			t.Error("expected DQ-006 flag for tier mismatch")
		}
	})
}

func TestPanicRecovery(t *testing.T) {
	// Create a handler that panics
	mux := http.NewServeMux()
	mux.HandleFunc("/panic", func(w http.ResponseWriter, r *http.Request) {
		panic("test panic")
	})
	handler := recoverMiddleware(requestIDMiddleware(mux))

	req := httptest.NewRequest("GET", "/panic", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("panic recovery status = %d, want %d", rr.Code, http.StatusInternalServerError)
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse panic response JSON: %v", err)
	}
	errObj, ok := resp["error"].(map[string]interface{})
	if !ok {
		t.Fatal("expected error object in panic response")
	}
	if errObj["code"] != "INTERNAL_ERROR" {
		t.Errorf("error code = %q, want %q", errObj["code"], "INTERNAL_ERROR")
	}
}

func TestAuthMiddleware(t *testing.T) {
	auth := DefaultAuthenticator()

	mux := http.NewServeMux()
	mux.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		id := IdentityFromContext(r.Context())
		if id == nil {
			t.Error("expected identity in context")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(id)
	})
	handler := authMiddleware(auth)(mux)

	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("auth middleware status = %d, want %d", rr.Code, http.StatusOK)
	}

	var id Identity
	if err := json.Unmarshal(rr.Body.Bytes(), &id); err != nil {
		t.Fatalf("failed to parse identity response: %v", err)
	}
	if id.UserID != "NOUI_SYSTEM" {
		t.Errorf("identity userId = %q, want %q", id.UserID, "NOUI_SYSTEM")
	}
}

// Unused import guard
var _ = time.Now
var _ = math.Abs
