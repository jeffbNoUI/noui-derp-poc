//go:build integration

package integration

import (
	"fmt"
	"net/http"
	"testing"
)

const dqPort = 8086

func TestDQ_HealthCheck(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/healthz")
	assertStatus(t, status, http.StatusOK)
	if body["status"] != "ok" {
		t.Errorf("status = %q, want ok", body["status"])
	}
	if body["service"] != "dataquality" {
		t.Errorf("service = %q, want dataquality", body["service"])
	}
}

func TestDQ_ListChecks(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/checks")
	assertStatus(t, status, http.StatusOK)
	checks := extractDataArray(t, body)
	if len(checks) != 6 {
		t.Errorf("check count = %d, want 6", len(checks))
	}
	total, _ := extractPagination(t, body)
	if total != 6 {
		t.Errorf("pagination.total = %d, want 6", total)
	}
}

func TestDQ_ListChecks_FilterCategory(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/checks?category=completeness")
	assertStatus(t, status, http.StatusOK)
	checks := extractDataArray(t, body)
	if len(checks) != 2 {
		t.Errorf("completeness check count = %d, want 2", len(checks))
	}
}

func TestDQ_GetCheck(t *testing.T) {
	id := "d0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/dq/checks/%s", baseURL(dqPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["checkId"] != id {
		t.Errorf("checkId = %v, want %s", data["checkId"], id)
	}
	if data["checkName"] != "SSN Completeness" {
		t.Errorf("checkName = %v, want 'SSN Completeness'", data["checkName"])
	}
}

func TestDQ_GetCheck_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/checks/d0000000-0000-0000-0000-000000000099")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestDQ_ListResults(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/results")
	assertStatus(t, status, http.StatusOK)
	data := extractData(t, body)
	results, ok := data.([]interface{})
	if !ok {
		t.Fatal("results data is not an array")
	}
	if len(results) < 12 {
		t.Errorf("result count = %d, want >= 12", len(results))
	}
}

func TestDQ_GetScore(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/score")
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if _, ok := data["overallScore"]; !ok {
		t.Error("score missing 'overallScore' field")
	}
	if _, ok := data["totalChecks"]; !ok {
		t.Error("score missing 'totalChecks' field")
	}
	if _, ok := data["categoryScores"]; !ok {
		t.Error("score missing 'categoryScores' field")
	}
}

func TestDQ_GetScoreTrend(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/score/trend?days=7")
	assertStatus(t, status, http.StatusOK)
	data := extractData(t, body)
	trend, ok := data.([]interface{})
	if !ok {
		t.Fatal("trend data is not an array")
	}
	if len(trend) == 0 {
		t.Error("trend should have at least 1 data point")
	}
}

func TestDQ_ListIssues(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/issues")
	assertStatus(t, status, http.StatusOK)
	issues := extractDataArray(t, body)
	if len(issues) != 4 {
		t.Errorf("issue count = %d, want 4", len(issues))
	}
}

func TestDQ_ListIssues_FilterSeverity(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/issues?severity=critical")
	assertStatus(t, status, http.StatusOK)
	issues := extractDataArray(t, body)
	if len(issues) != 2 {
		t.Errorf("critical issue count = %d, want 2", len(issues))
	}
}

func TestDQ_UpdateIssue(t *testing.T) {
	id := "b0000000-0000-0000-0000-000000000001"
	payload := map[string]interface{}{
		"status":         "resolved",
		"resolutionNote": "Fixed via integration test",
	}
	status, body := putJSON(t, fmt.Sprintf("%s/api/v1/dq/issues/%s", baseURL(dqPort), id), payload)
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["status"] != "resolved" {
		t.Errorf("status = %v, want 'resolved'", data["status"])
	}
	if data["resolvedAt"] == nil {
		t.Error("resolvedAt should be set after resolving")
	}
}
