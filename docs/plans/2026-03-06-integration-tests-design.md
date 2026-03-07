# Integration Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Write HTTP integration tests against live Docker services for Knowledge Base, Data Quality, and Correspondence, plus fix error response inconsistencies across all 6 services.

**Architecture:** Single Go module `tests/integration/` with shared HTTP helpers and one test file per service. Tests call `localhost:<port>` endpoints and assert against known seed data. Build-tagged `//go:build integration` so standard `go test` skips them.

**Tech Stack:** Go stdlib (`net/http`, `encoding/json`, `testing`), no external dependencies.

---

## Pre-flight

Before starting, verify the stack is running:

```bash
docker compose up -d
curl -s localhost:8087/healthz | jq .status  # knowledgebase
curl -s localhost:8086/healthz | jq .status  # dataquality
curl -s localhost:8085/healthz | jq .status  # correspondence
```

All should return `"ok"`.

---

### Task 1: Create test module and shared helpers

**Files:**
- Create: `tests/integration/go.mod`
- Create: `tests/integration/helpers.go`

**Step 1: Create go.mod**

```
module github.com/noui/derp-poc/tests/integration

go 1.22.0
```

**Step 2: Create helpers.go**

```go
//go:build integration

package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
)

func baseURL(port int) string {
	return fmt.Sprintf("http://localhost:%d", port)
}

// getJSON performs GET and returns status code + parsed body.
func getJSON(t *testing.T, url string) (int, map[string]interface{}) {
	t.Helper()
	resp, err := http.Get(url)
	if err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("parse JSON from %s: %v\nbody: %s", url, err, string(body))
	}
	return resp.StatusCode, result
}

// postJSON performs POST with JSON body and returns status code + parsed body.
func postJSON(t *testing.T, url string, payload interface{}) (int, map[string]interface{}) {
	t.Helper()
	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal POST body: %v", err)
	}
	resp, err := http.Post(url, "application/json", bytes.NewReader(data))
	if err != nil {
		t.Fatalf("POST %s: %v", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("parse JSON from %s: %v\nbody: %s", url, err, string(body))
	}
	return resp.StatusCode, result
}

// putJSON performs PUT with JSON body and returns status code + parsed body.
func putJSON(t *testing.T, url string, payload interface{}) (int, map[string]interface{}) {
	t.Helper()
	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal PUT body: %v", err)
	}
	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(data))
	if err != nil {
		t.Fatalf("create PUT request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT %s: %v", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("parse JSON from %s: %v\nbody: %s", url, err, string(body))
	}
	return resp.StatusCode, result
}

// assertStatus fails the test if got != want.
func assertStatus(t *testing.T, got, want int) {
	t.Helper()
	if got != want {
		t.Errorf("status = %d, want %d", got, want)
	}
}

// extractData pulls .data from the response body and returns it.
func extractData(t *testing.T, body map[string]interface{}) interface{} {
	t.Helper()
	data, ok := body["data"]
	if !ok {
		t.Fatal("response missing 'data' field")
	}
	return data
}

// extractDataArray pulls .data as []interface{} from the response body.
func extractDataArray(t *testing.T, body map[string]interface{}) []interface{} {
	t.Helper()
	data := extractData(t, body)
	arr, ok := data.([]interface{})
	if !ok {
		t.Fatalf("data is not an array: %T", data)
	}
	return arr
}

// extractDataMap pulls .data as map[string]interface{} from the response body.
func extractDataMap(t *testing.T, body map[string]interface{}) map[string]interface{} {
	t.Helper()
	data := extractData(t, body)
	m, ok := data.(map[string]interface{})
	if !ok {
		t.Fatalf("data is not an object: %T", data)
	}
	return m
}

// extractError pulls .error.code and .error.message from the response body.
func extractError(t *testing.T, body map[string]interface{}) (code, message string) {
	t.Helper()
	errObj, ok := body["error"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing 'error' object")
	}
	code, _ = errObj["code"].(string)
	message, _ = errObj["message"].(string)
	return
}

// extractPagination pulls pagination.total and pagination.hasMore from the response.
func extractPagination(t *testing.T, body map[string]interface{}) (total int, hasMore bool) {
	t.Helper()
	pag, ok := body["pagination"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing 'pagination' object")
	}
	if v, ok := pag["total"].(float64); ok {
		total = int(v)
	}
	hasMore, _ = pag["hasMore"].(bool)
	return
}
```

**Step 3: Verify it compiles**

Run: `cd tests/integration && go vet -tags integration ./...`
Expected: no errors

**Step 4: Commit**

```bash
git add tests/integration/go.mod tests/integration/helpers.go
git commit -m "[derp/tests] Add integration test module with shared HTTP helpers"
```

---

### Task 2: Knowledge Base integration tests

**Files:**
- Create: `tests/integration/kb_test.go`

**Step 1: Write all KB tests**

```go
//go:build integration

package integration

import (
	"fmt"
	"net/http"
	"testing"
)

const kbPort = 8087

func TestKB_HealthCheck(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/healthz")
	assertStatus(t, status, http.StatusOK)
	if body["status"] != "ok" {
		t.Errorf("status = %q, want ok", body["status"])
	}
	if body["service"] != "knowledgebase" {
		t.Errorf("service = %q, want knowledgebase", body["service"])
	}
}

func TestKB_ListArticles(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/articles")
	assertStatus(t, status, http.StatusOK)
	articles := extractDataArray(t, body)
	// Seed has 8 articles (one per workflow stage)
	if len(articles) != 8 {
		t.Errorf("article count = %d, want 8", len(articles))
	}
	total, _ := extractPagination(t, body)
	if total != 8 {
		t.Errorf("pagination.total = %d, want 8", total)
	}
}

func TestKB_ListArticles_FilterByStage(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/articles?stage_id=intake")
	assertStatus(t, status, http.StatusOK)
	articles := extractDataArray(t, body)
	if len(articles) != 1 {
		t.Fatalf("article count for stage=intake = %d, want 1", len(articles))
	}
	article := articles[0].(map[string]interface{})
	if article["title"] != "Application Intake" {
		t.Errorf("title = %q, want 'Application Intake'", article["title"])
	}
}

func TestKB_GetArticle(t *testing.T) {
	// Known seed article ID for intake
	id := "a0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/kb/articles/%s", baseURL(kbPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["article_id"] != id {
		t.Errorf("article_id = %v, want %s", data["article_id"], id)
	}
	if data["stage_id"] != "intake" {
		t.Errorf("stage_id = %v, want intake", data["stage_id"])
	}
}

func TestKB_GetArticle_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/articles/nonexistent-id")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestKB_GetStageHelp(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/stages/intake")
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["stage_id"] != "intake" {
		t.Errorf("stage_id = %v, want intake", data["stage_id"])
	}
	if data["title"] != "Application Intake" {
		t.Errorf("title = %v, want Application Intake", data["title"])
	}
}

func TestKB_GetStageHelp_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/stages/nonexistent-stage")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestKB_SearchArticles(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/search?q=salary")
	assertStatus(t, status, http.StatusOK)
	articles := extractDataArray(t, body)
	if len(articles) == 0 {
		t.Error("search for 'salary' returned 0 results, expected at least 1")
	}
}

func TestKB_SearchArticles_MissingQuery(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/search")
	assertStatus(t, status, http.StatusBadRequest)
	code, _ := extractError(t, body)
	if code != "INVALID_REQUEST" {
		t.Errorf("error.code = %q, want INVALID_REQUEST", code)
	}
}

func TestKB_ListRules(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/rules")
	assertStatus(t, status, http.StatusOK)
	rules := extractDataArray(t, body)
	// Seed has 20 rule references
	if len(rules) != 20 {
		t.Errorf("rule count = %d, want 20", len(rules))
	}
}

func TestKB_ListRules_FilterByDomain(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/rules?domain=intake")
	assertStatus(t, status, http.StatusOK)
	rules := extractDataArray(t, body)
	// Seed has 2 intake rules
	if len(rules) != 2 {
		t.Errorf("intake rule count = %d, want 2", len(rules))
	}
}

func TestKB_GetRule(t *testing.T) {
	// Known seed rule ID
	ruleID := "RMC-18-201"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/kb/rules/%s", baseURL(kbPort), ruleID))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	rule, ok := data["rule"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing 'rule' object in data")
	}
	if rule["rule_id"] != ruleID {
		t.Errorf("rule_id = %v, want %s", rule["rule_id"], ruleID)
	}
	articles, ok := data["articles"].([]interface{})
	if !ok {
		t.Fatal("response missing 'articles' array in data")
	}
	if len(articles) == 0 {
		t.Error("rule should have at least 1 linked article")
	}
}

func TestKB_GetRule_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/rules/FAKE-RULE-999")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}
```

**Step 2: Run tests**

Run: `cd tests/integration && go test -tags integration -v -run TestKB`
Expected: all 12 tests PASS

**Step 3: Commit**

```bash
git add tests/integration/kb_test.go
git commit -m "[derp/tests] Add KB integration tests (12 tests against live service)"
```

---

### Task 3: Data Quality integration tests

**Files:**
- Create: `tests/integration/dq_test.go`

**Step 1: Write all DQ tests**

```go
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
	// Seed has 6 check definitions
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
	// Seed has 2 completeness checks
	if len(checks) != 2 {
		t.Errorf("completeness check count = %d, want 2", len(checks))
	}
}

func TestDQ_GetCheck(t *testing.T) {
	// Known seed check ID: SSN Completeness
	id := "d0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/dq/checks/%s", baseURL(dqPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["check_id"] != id {
		t.Errorf("check_id = %v, want %s", data["check_id"], id)
	}
	if data["check_name"] != "SSN Completeness" {
		t.Errorf("check_name = %v, want 'SSN Completeness'", data["check_name"])
	}
}

func TestDQ_GetCheck_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/checks/bad-check-id")
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
	// Seed has 12 results (2 runs x 6 checks)
	if len(results) < 12 {
		t.Errorf("result count = %d, want >= 12", len(results))
	}
}

func TestDQ_GetScore(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/score")
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	// Score should have key fields
	if _, ok := data["overall_score"]; !ok {
		t.Error("score missing 'overall_score' field")
	}
	if _, ok := data["total_checks"]; !ok {
		t.Error("score missing 'total_checks' field")
	}
	if _, ok := data["category_scores"]; !ok {
		t.Error("score missing 'category_scores' field")
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
	// Should have at least 1 data point from seed results
	if len(trend) == 0 {
		t.Error("trend should have at least 1 data point")
	}
}

func TestDQ_ListIssues(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/issues")
	assertStatus(t, status, http.StatusOK)
	issues := extractDataArray(t, body)
	// Seed has 4 open issues
	if len(issues) != 4 {
		t.Errorf("issue count = %d, want 4", len(issues))
	}
}

func TestDQ_ListIssues_FilterSeverity(t *testing.T) {
	status, body := getJSON(t, baseURL(dqPort)+"/api/v1/dq/issues?severity=critical")
	assertStatus(t, status, http.StatusOK)
	issues := extractDataArray(t, body)
	// Seed has 2 critical issues
	if len(issues) != 2 {
		t.Errorf("critical issue count = %d, want 2", len(issues))
	}
}

func TestDQ_UpdateIssue(t *testing.T) {
	// Use seed issue ID
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
	if data["resolved_at"] == nil {
		t.Error("resolved_at should be set after resolving")
	}
}
```

**Step 2: Run tests**

Run: `cd tests/integration && go test -tags integration -v -run TestDQ`
Expected: all 11 tests PASS

**Step 3: Commit**

```bash
git add tests/integration/dq_test.go
git commit -m "[derp/tests] Add DQ integration tests (11 tests against live service)"
```

---

### Task 4: Correspondence integration tests

**Files:**
- Create: `tests/integration/corr_test.go`

**Step 1: Write all Correspondence tests**

```go
//go:build integration

package integration

import (
	"fmt"
	"net/http"
	"testing"
)

const corrPort = 8085

func TestCorr_HealthCheck(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/healthz")
	assertStatus(t, status, http.StatusOK)
	if body["status"] != "ok" {
		t.Errorf("status = %q, want ok", body["status"])
	}
	if body["service"] != "correspondence" {
		t.Errorf("service = %q, want correspondence", body["service"])
	}
}

func TestCorr_ListTemplates(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/templates")
	assertStatus(t, status, http.StatusOK)
	templates := extractDataArray(t, body)
	// Seed has 5 templates
	if len(templates) != 5 {
		t.Errorf("template count = %d, want 5", len(templates))
	}
	total, _ := extractPagination(t, body)
	if total != 5 {
		t.Errorf("pagination.total = %d, want 5", total)
	}
}

func TestCorr_ListTemplates_FilterCategory(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/templates?category=retirement")
	assertStatus(t, status, http.StatusOK)
	templates := extractDataArray(t, body)
	// Seed has 2 retirement templates
	if len(templates) != 2 {
		t.Errorf("retirement template count = %d, want 2", len(templates))
	}
}

func TestCorr_GetTemplate(t *testing.T) {
	// Known seed template ID: Retirement Benefit Confirmation
	id := "c0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/correspondence/templates/%s", baseURL(corrPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["template_id"] != id {
		t.Errorf("template_id = %v, want %s", data["template_id"], id)
	}
	if data["template_name"] != "Retirement Benefit Confirmation" {
		t.Errorf("template_name = %v, want 'Retirement Benefit Confirmation'", data["template_name"])
	}
}

func TestCorr_GetTemplate_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/templates/nonexistent")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestCorr_Generate(t *testing.T) {
	// Generate a letter from the General Acknowledgment template
	templateID := "c0000000-0000-0000-0000-000000000004"
	payload := map[string]interface{}{
		"templateId": templateID,
		"memberId":   1001,
		"caseId":     "RET-2026-TEST",
		"mergeData": map[string]string{
			"member_name":   "Test Member",
			"document_type": "Retirement Application",
			"received_date": "2026-03-06",
		},
	}
	status, body := postJSON(t, baseURL(corrPort)+"/api/v1/correspondence/generate", payload)
	assertStatus(t, status, http.StatusCreated)
	data := extractDataMap(t, body)

	// Verify the generated correspondence
	corrID, ok := data["correspondence_id"].(string)
	if !ok || corrID == "" {
		t.Fatal("generated correspondence missing correspondence_id")
	}
	if data["status"] != "draft" {
		t.Errorf("status = %v, want 'draft'", data["status"])
	}
	rendered, ok := data["body_rendered"].(string)
	if !ok || rendered == "" {
		t.Error("body_rendered should not be empty")
	}

	// Save corrID for subsequent tests
	t.Setenv("CORR_TEST_ID", corrID)

	// Verify we can fetch it back
	getStatus, getBody := getJSON(t, fmt.Sprintf("%s/api/v1/correspondence/history/%s", baseURL(corrPort), corrID))
	assertStatus(t, getStatus, http.StatusOK)
	getData := extractDataMap(t, getBody)
	if getData["correspondence_id"] != corrID {
		t.Errorf("fetched correspondence_id = %v, want %s", getData["correspondence_id"], corrID)
	}
}

func TestCorr_Generate_MissingTemplate(t *testing.T) {
	payload := map[string]interface{}{
		"templateId": "nonexistent-template",
		"mergeData":  map[string]string{"member_name": "Test"},
	}
	status, body := postJSON(t, baseURL(corrPort)+"/api/v1/correspondence/generate", payload)
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestCorr_Generate_MissingRequiredField(t *testing.T) {
	// General Acknowledgment requires member_name, document_type, received_date
	templateID := "c0000000-0000-0000-0000-000000000004"
	payload := map[string]interface{}{
		"templateId": templateID,
		"mergeData": map[string]string{
			// Missing required member_name
			"document_type": "Test",
		},
	}
	status, body := postJSON(t, baseURL(corrPort)+"/api/v1/correspondence/generate", payload)
	assertStatus(t, status, http.StatusBadRequest)
	code, _ := extractError(t, body)
	if code != "MERGE_ERROR" {
		t.Errorf("error.code = %q, want MERGE_ERROR", code)
	}
}

func TestCorr_ListHistory(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/history")
	assertStatus(t, status, http.StatusOK)
	// Should have pagination
	_, ok := body["pagination"]
	if !ok {
		t.Error("history response missing pagination")
	}
}

func TestCorr_GetCorrespondence_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/history/nonexistent")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestCorr_UpdateCorrespondence(t *testing.T) {
	// First generate a letter to update
	templateID := "c0000000-0000-0000-0000-000000000004"
	genPayload := map[string]interface{}{
		"templateId": templateID,
		"mergeData": map[string]string{
			"member_name":   "Update Test",
			"document_type": "Test Doc",
			"received_date": "2026-03-06",
		},
	}
	genStatus, genBody := postJSON(t, baseURL(corrPort)+"/api/v1/correspondence/generate", genPayload)
	assertStatus(t, genStatus, http.StatusCreated)
	genData := extractDataMap(t, genBody)
	corrID := genData["correspondence_id"].(string)

	// Update status to "sent"
	updatePayload := map[string]interface{}{
		"status":  "sent",
		"sentVia": "email",
	}
	status, body := putJSON(t, fmt.Sprintf("%s/api/v1/correspondence/history/%s", baseURL(corrPort), corrID), updatePayload)
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["status"] != "sent" {
		t.Errorf("status = %v, want 'sent'", data["status"])
	}
	if data["sent_at"] == nil {
		t.Error("sent_at should be set after marking as sent")
	}
}

func TestCorr_UpdateCorrespondence_NotFound(t *testing.T) {
	payload := map[string]interface{}{"status": "sent"}
	status, body := putJSON(t, baseURL(corrPort)+"/api/v1/correspondence/history/nonexistent", payload)
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}
```

**Step 2: Run tests**

Run: `cd tests/integration && go test -tags integration -v -run TestCorr`
Expected: all 12 tests PASS

**Step 3: Commit**

```bash
git add tests/integration/corr_test.go
git commit -m "[derp/tests] Add Correspondence integration tests (12 tests against live service)"
```

---

### Task 5: Fix error response inconsistency

**Problem:** Connector and Intelligence use `request_id` (snake_case), while CRM/KB/DQ/Correspondence use `requestId` (camelCase). Standardize on `requestId` (camelCase) to match the majority.

**Files:**
- Modify: `services/connector/models/response.go:20` — change JSON tag from `request_id` to `requestId`
- Modify: `services/intelligence/api/handlers.go:409` — change map key from `request_id` to `requestId`

**Step 1: Fix connector**

In `services/connector/models/response.go`, line 20:
Change: `RequestID string \`json:"request_id"\``
To: `RequestID string \`json:"requestId"\``

**Step 2: Fix intelligence**

In `services/intelligence/api/handlers.go`, line 409:
Change: `"request_id": uuid.New().String(),`
To: `"requestId": uuid.New().String(),`

**Step 3: Verify unit tests still pass**

Run: `cd services/connector && go test ./...`
Run: `cd services/intelligence && go test ./...`
Expected: all pass (existing unit tests for writeError check the structure but not the JSON key name)

**Step 4: Verify services rebuild in Docker**

Run: `docker compose build connector intelligence`
Run: `docker compose up -d connector intelligence`

**Step 5: Verify live error responses**

Run: `curl -s localhost:8081/api/v1/members/999999 | jq '.error'`
Expected: `{ "code": "...", "message": "...", "requestId": "..." }`

Run: `curl -s localhost:8088/api/v1/nonexistent | jq '.error'`
Expected: `{ "code": "...", "message": "...", "requestId": "..." }`

**Step 6: Commit**

```bash
git add services/connector/models/response.go services/intelligence/api/handlers.go
git commit -m "[derp/all] Standardize error response requestId field (snake_case -> camelCase)"
```

---

### Task 6: Run full integration test suite and update BUILD_HISTORY.md

**Step 1: Run all integration tests**

Run: `cd tests/integration && go test -tags integration -v ./...`
Expected: 35 tests PASS (12 KB + 11 DQ + 12 Corr)

**Step 2: Update BUILD_HISTORY.md**

Add session 5 entry with:
- Integration test counts per service
- Error handling fix summary
- Updated test inventory

**Step 3: Update SESSION_BRIEF.md**

Update test inventory and next session scope.

**Step 4: Final commit**

```bash
git add BUILD_HISTORY.md SESSION_BRIEF.md
git commit -m "[derp/docs] Session 5: integration tests + error handling fix"
```
