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
	id := "a0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/kb/articles/%s", baseURL(kbPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["articleId"] != id {
		t.Errorf("articleId = %v, want %s", data["articleId"], id)
	}
	if data["stageId"] != "intake" {
		t.Errorf("stageId = %v, want intake", data["stageId"])
	}
}

func TestKB_GetArticle_NotFound(t *testing.T) {
	// Use a valid UUID format that does not exist (service requires UUID syntax)
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/articles/a0000000-0000-0000-0000-ffffffffffff")
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
	if data["stageId"] != "intake" {
		t.Errorf("stageId = %v, want intake", data["stageId"])
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
	if len(rules) != 21 {
		t.Errorf("rule count = %d, want 21", len(rules))
	}
}

func TestKB_ListRules_FilterByDomain(t *testing.T) {
	status, body := getJSON(t, baseURL(kbPort)+"/api/v1/kb/rules?domain=intake")
	assertStatus(t, status, http.StatusOK)
	rules := extractDataArray(t, body)
	if len(rules) != 2 {
		t.Errorf("intake rule count = %d, want 2", len(rules))
	}
}

func TestKB_GetRule(t *testing.T) {
	ruleID := "RMC-18-201"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/kb/rules/%s", baseURL(kbPort), ruleID))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	rule, ok := data["rule"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing 'rule' object in data")
	}
	if rule["ruleId"] != ruleID {
		t.Errorf("ruleId = %v, want %s", rule["ruleId"], ruleID)
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
