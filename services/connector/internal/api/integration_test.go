//go:build integration

// Package api integration tests exercise the connector against the seeded PostgreSQL database.
//
// Run with: go test -tags integration -v ./internal/api/
//
// Prerequisites:
//   - PostgreSQL running with DERP legacy schema
//   - Seed data loaded (database/seed/)
//   - Environment variables set (or defaults: localhost:5432/derp_legacy)
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

	if data["member_id"] != "M-100001" {
		t.Errorf("member_id = %v, want M-100001", data["member_id"])
	}
	if data["first_name"] != "Robert" {
		t.Errorf("first_name = %v, want Robert", data["first_name"])
	}
	if tier := data["tier"].(float64); tier != 1 {
		t.Errorf("tier = %v, want 1", tier)
	}
}

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

	amsCalc := data["ams_calculation"].(map[string]interface{})
	ams := amsCalc["ams"].(float64)

	// Fixture: AMS = $10,639.45
	if math.Abs(ams-10639.45) > 0.05 {
		t.Errorf("AMS = %.2f, want 10639.45 (diff=%.2f)", ams, math.Abs(ams-10639.45))
	}

	if data["leave_payout_eligible"] != true {
		t.Errorf("leave_payout_eligible = %v, want true", data["leave_payout_eligible"])
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

	amsCalc := data["ams_calculation"].(map[string]interface{})
	ams := amsCalc["ams"].(float64)

	// Fixture: AMS = $7,347.62
	if math.Abs(ams-7347.62) > 0.05 {
		t.Errorf("AMS = %.2f, want 7347.62", ams)
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

	amsCalc := data["ams_calculation"].(map[string]interface{})
	ams := amsCalc["ams"].(float64)

	// Fixture: AMS = $6,684.52
	if math.Abs(ams-6684.52) > 0.05 {
		t.Errorf("AMS = %.2f, want 6684.52", ams)
	}
}

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

	// Fixture: total_for_benefit = 21.17, total_for_rule_of_75 = 18.17
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

func TestIntegrationCase4DRORecords(t *testing.T) {
	router := setupIntegrationRouter(t)

	req := httptest.NewRequest("GET", "/api/v1/members/M-100004/dro", nil)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GET dro status = %d, body: %s", rr.Code, rr.Body.String())
	}

	var resp SuccessResponse
	json.NewDecoder(rr.Body).Decode(&resp)
	data := resp.Data.(map[string]interface{})

	if data["has_dro"] != true {
		t.Errorf("has_dro = %v, want true (Case 4 has DRO)", data["has_dro"])
	}
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
