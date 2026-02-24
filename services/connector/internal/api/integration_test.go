//go:build integration

// Integration tests for the DERP Data Connector service.
// Run with: go test -tags integration -v ./internal/api/
//
// Prerequisites:
//   - PostgreSQL running with DERP legacy schema
//   - Seed data loaded (database/seed/)
//   - Environment variables set (or defaults: localhost:5432/derp_legacy)
//
// Covers test contracts IT-DC-001 through IT-DC-010 from integration-test-contracts.md.
package api

import (
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"

	dbpkg "github.com/noui-derp-poc/connector/internal/db"
)

func setupIntegrationRouter(t *testing.T) http.Handler {
	t.Helper()
	database, err := dbpkg.Connect()
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}
	t.Cleanup(func() { database.Close() })

	queries := dbpkg.NewQueries(database)
	handlers := NewHandlers(queries)
	return NewRouter(handlers)
}

// IT-DC-001: Member profile mapping — all fields match seeded data
func TestIntegrationCase1MartinezMember(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100001", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET member status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	if data["memberId"] != "M-100001" {
		t.Errorf("memberId = %v, want M-100001", data["memberId"])
	}
	if data["firstName"] != "Robert" {
		t.Errorf("firstName = %v, want Robert", data["firstName"])
	}
	if data["lastName"] != "Martinez" {
		t.Errorf("lastName = %v, want Martinez", data["lastName"])
	}
	if data["status"] != "active" {
		t.Errorf("status = %v, want active (lowercase)", data["status"])
	}

	// IT-DC-009: Response envelope verification
	if resp.DataQualityFlags == nil {
		t.Error("dataQualityFlags is nil, expected empty array")
	}
	if resp.Meta.Service != "connector" {
		t.Errorf("meta.service = %q, want connector", resp.Meta.Service)
	}
	if resp.Meta.Source != "legacy-direct" {
		t.Errorf("meta.source = %q, want legacy-direct", resp.Meta.Source)
	}
}

// IT-DC-002: Tier determination — computed from hireDate, not stored TIER_CD
func TestIntegrationTierDetermination(t *testing.T) {
	router := setupIntegrationRouter(t)

	cases := []struct {
		memberID    string
		expectedTier float64
		name        string
	}{
		{"M-100001", 1, "Case 1 Martinez — Tier 1"},
		{"M-100002", 2, "Case 2 Kim — Tier 2"},
		{"M-100003", 3, "Case 3 Washington — Tier 3"},
		{"M-100004", 1, "Case 4 DRO Martinez — Tier 1"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/members/"+tc.memberID, nil)
			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("status = %d, body: %s", rr.Code, rr.Body.String())
			}

			var resp SuccessResponse
			json.NewDecoder(rr.Body).Decode(&resp)
			data := resp.Data.(map[string]interface{})

			tier := data["tier"].(float64)
			if tier != tc.expectedTier {
				t.Errorf("tier = %v, want %v", tier, tc.expectedTier)
			}

			// Demo cases should be clean — no DQ flags
			if len(resp.DataQualityFlags) > 0 {
				t.Errorf("expected 0 DQ flags for demo case, got %d: %v",
					len(resp.DataQualityFlags), resp.DataQualityFlags)
			}
		})
	}
}

// IT-DC-003: AMS window size — 36 for Cases 1,2; 60 for Case 3
// IT-DC-004: AMS exact value — matches test fixture oracle to the penny
func TestIntegrationCase1MartinezSalary(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100001/salary", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET salary status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	amsData := data["ams"].(map[string]interface{})

	// AMS amount is now a string per CRITICAL-002
	amsStr := amsData["amount"].(string)
	if amsStr == "" {
		t.Fatal("ams.amount is empty")
	}

	// Parse for numeric comparison
	var amsVal float64
	json.Unmarshal([]byte(amsStr), &amsVal)

	// IT-DC-004: Fixture: AMS = $10,639.45
	if math.Abs(amsVal-10639.45) > 0.05 {
		t.Errorf("AMS = %s (%.2f), want 10639.45 (diff=%.2f)", amsStr, amsVal, math.Abs(amsVal-10639.45))
	}

	// IT-DC-003: Window should be 36 months for Tier 1
	windowMonths := amsData["windowMonths"].(float64)
	if windowMonths != 36 {
		t.Errorf("windowMonths = %v, want 36", windowMonths)
	}

	// IT-DC-006: Leave payout inclusion
	if data["leavePayoutEligible"] != true {
		t.Errorf("leavePayoutEligible = %v, want true (Case 1 hired before 2010)", data["leavePayoutEligible"])
	}
	if amsData["leavePayoutIncluded"] != true {
		t.Errorf("leavePayoutIncluded = %v, want true", amsData["leavePayoutIncluded"])
	}
}

func TestIntegrationCase2KimSalary(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100002/salary", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET salary status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	amsData := data["ams"].(map[string]interface{})
	amsStr := amsData["amount"].(string)

	var amsVal float64
	json.Unmarshal([]byte(amsStr), &amsVal)

	// Fixture: AMS = $7,347.62
	if math.Abs(amsVal-7347.62) > 0.05 {
		t.Errorf("AMS = %s (%.2f), want 7347.62", amsStr, amsVal)
	}

	// Window should be 36 months for Tier 2
	windowMonths := amsData["windowMonths"].(float64)
	if windowMonths != 36 {
		t.Errorf("windowMonths = %v, want 36", windowMonths)
	}
}

func TestIntegrationCase3WashingtonSalary(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100003/salary", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET salary status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	amsData := data["ams"].(map[string]interface{})
	amsStr := amsData["amount"].(string)

	var amsVal float64
	json.Unmarshal([]byte(amsStr), &amsVal)

	// Fixture: AMS = $6,684.52
	if math.Abs(amsVal-6684.52) > 0.05 {
		t.Errorf("AMS = %s (%.2f), want 6684.52", amsStr, amsVal)
	}

	// IT-DC-003: Window should be 60 months for Tier 3
	windowMonths := amsData["windowMonths"].(float64)
	if windowMonths != 60 {
		t.Errorf("windowMonths = %v, want 60", windowMonths)
	}

	// IT-DC-006: Case 3 — leave payout NOT included (hired after 2010)
	if data["leavePayoutEligible"] != false {
		t.Errorf("leavePayoutEligible = %v, want false (Case 3 hired after 2010)", data["leavePayoutEligible"])
	}
}

// IT-DC-005: Service credit separation — earned vs purchased
func TestIntegrationCase2KimServiceCredit(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100002/service-credit", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET service-credit status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	summary := data["summary"].(map[string]interface{})

	// CRITICAL: Purchased service excluded from eligibility and IPR
	totalBenefit := summary["total_for_benefit"].(float64)
	totalElig := summary["total_for_eligibility"].(float64)
	totalIPR := summary["total_for_ipr"].(float64)

	// Fixture: total_for_benefit = 21.17, total_for_eligibility = 18.17
	if math.Abs(totalBenefit-21.17) > 0.05 {
		t.Errorf("total_for_benefit = %.2f, want 21.17", totalBenefit)
	}
	if math.Abs(totalElig-18.17) > 0.05 {
		t.Errorf("total_for_eligibility = %.2f, want 18.17 (purchased excluded)", totalElig)
	}
	if math.Abs(totalIPR-18.17) > 0.05 {
		t.Errorf("total_for_ipr = %.2f, want 18.17 (purchased excluded)", totalIPR)
	}
}

// IT-DC-007: DRO record retrieval
// Case 4 uses M-100001 (Robert Martinez with DRO — same member, DRO scenario)
func TestIntegrationCase4DRORecords(t *testing.T) {
	router := setupIntegrationRouter(t)

	// M-100001 has DRO data (Case 4 uses the same member ID)
	req := httptest.NewRequest("GET", "/api/v1/members/M-100001/dro", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET dro status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	if data["hasDro"] != true {
		t.Errorf("hasDro = %v, want true (Case 4/M-100001 has DRO)", data["hasDro"])
	}

	// Cases 2 and 3 should have no DRO
	for _, mid := range []string{"M-100002", "M-100003"} {
		req2 := httptest.NewRequest("GET", "/api/v1/members/"+mid+"/dro", nil)
		rr2 := httptest.NewRecorder()
		router.ServeHTTP(rr2, req2)

		var resp2 SuccessResponse
		json.NewDecoder(rr2.Body).Decode(&resp2)
		data2 := resp2.Data.(map[string]interface{})

		if data2["hasDro"] != false {
			t.Errorf("%s hasDro = %v, want false", mid, data2["hasDro"])
		}
	}
}

// IT-DC-009: Response envelope — every response has data, dataQualityFlags, meta
func TestIntegrationResponseEnvelope(t *testing.T) {
	router := setupIntegrationRouter(t)

	endpoints := []string{
		"/healthz",
		"/api/v1/members/M-100001",
		"/api/v1/members/M-100001/employment",
		"/api/v1/members/M-100001/salary",
		"/api/v1/members/M-100001/beneficiaries",
		"/api/v1/members/M-100001/dro",
		"/api/v1/members/M-100001/contributions",
		"/api/v1/members/M-100001/service-credit",
	}

	for _, ep := range endpoints {
		t.Run(ep, func(t *testing.T) {
			req := httptest.NewRequest("GET", ep, nil)
			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Fatalf("GET %s status = %d, body: %s", ep, rr.Code, rr.Body.String())
			}

			// Parse as raw JSON to verify envelope structure
			var raw map[string]json.RawMessage
			if err := json.NewDecoder(rr.Body).Decode(&raw); err != nil {
				t.Fatalf("decode %s: %v", ep, err)
			}

			if _, ok := raw["data"]; !ok {
				t.Errorf("%s: missing 'data' field", ep)
			}
			if _, ok := raw["dataQualityFlags"]; !ok {
				t.Errorf("%s: missing 'dataQualityFlags' field", ep)
			}
			if _, ok := raw["meta"]; !ok {
				t.Errorf("%s: missing 'meta' field", ep)
			}

			// Verify meta has required fields
			var meta ResponseMeta
			if err := json.Unmarshal(raw["meta"], &meta); err != nil {
				t.Fatalf("%s: decode meta: %v", ep, err)
			}
			if meta.RequestID == "" {
				t.Errorf("%s: meta.requestId is empty", ep)
			}
			if meta.Service != "connector" {
				t.Errorf("%s: meta.service = %q, want connector", ep, meta.Service)
			}
		})
	}
}

// IT-DC-010: Health endpoints
func TestIntegrationHealthEndpoints(t *testing.T) {
	router := setupIntegrationRouter(t)

	t.Run("healthz returns 200", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/healthz", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("/healthz status = %d", rr.Code)
		}
	})

	t.Run("readyz returns 200 when DB connected", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/readyz", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("/readyz status = %d, body: %s", rr.Code, rr.Body.String())
		}
	})
}

// IT-DC: Member search
func TestIntegrationMemberSearch(t *testing.T) {
	router := setupIntegrationRouter(t)

	t.Run("search by member ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/members/search?q=M-100001", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("search status = %d, body: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("search by last name", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/members/search?q=Martinez", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("search status = %d, body: %s", rr.Code, rr.Body.String())
		}
	})

	t.Run("search missing query", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/members/search", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("search without q status = %d, want 400", rr.Code)
		}
	})
}

// IT-DC: Data quality endpoint
func TestIntegrationDataQuality(t *testing.T) {
	router := setupIntegrationRouter(t)

	t.Run("clean demo case — no flags", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/data-quality/member/M-100001", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("data-quality status = %d, body: %s", rr.Code, rr.Body.String())
		}

		var resp SuccessResponse
		json.NewDecoder(rr.Body).Decode(&resp)
		data := resp.Data.(map[string]interface{})

		flagCount := data["flagCount"].(float64)
		if flagCount != 0 {
			t.Errorf("expected 0 DQ flags for demo case M-100001, got %.0f", flagCount)
		}
	})

	t.Run("non-existent member", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/data-quality/member/M-999999", nil)
		rr := httptest.NewRecorder()
		router.ServeHTTP(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rr.Code)
		}
	})
}

func TestIntegrationMemberNotFound(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-999999", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("non-existent member status = %d, want %d", rr.Code, http.StatusNotFound)
	}
}
