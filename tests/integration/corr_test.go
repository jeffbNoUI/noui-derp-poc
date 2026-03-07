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
	if len(templates) != 2 {
		t.Errorf("retirement template count = %d, want 2", len(templates))
	}
}

func TestCorr_GetTemplate(t *testing.T) {
	id := "c0000000-0000-0000-0000-000000000001"
	status, body := getJSON(t, fmt.Sprintf("%s/api/v1/correspondence/templates/%s", baseURL(corrPort), id))
	assertStatus(t, status, http.StatusOK)
	data := extractDataMap(t, body)
	if data["templateId"] != id {
		t.Errorf("templateId = %v, want %s", data["templateId"], id)
	}
	if data["templateName"] != "Retirement Benefit Confirmation" {
		t.Errorf("templateName = %v, want 'Retirement Benefit Confirmation'", data["templateName"])
	}
}

func TestCorr_GetTemplate_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/templates/c0000000-0000-0000-0000-000000000099")
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}

func TestCorr_Generate(t *testing.T) {
	templateID := "c0000000-0000-0000-0000-000000000004"
	payload := map[string]interface{}{
		"templateId": templateID,
		"memberId":   1001,
		"caseId":     100,
		"mergeData": map[string]string{
			"member_name":   "Test Member",
			"document_type": "Retirement Application",
			"received_date": "2026-03-06",
		},
	}
	status, body := postJSON(t, baseURL(corrPort)+"/api/v1/correspondence/generate", payload)
	assertStatus(t, status, http.StatusCreated)
	data := extractDataMap(t, body)

	corrID, ok := data["correspondenceId"].(string)
	if !ok || corrID == "" {
		t.Fatal("generated correspondence missing correspondenceId")
	}
	if data["status"] != "draft" {
		t.Errorf("status = %v, want 'draft'", data["status"])
	}
	rendered, ok := data["bodyRendered"].(string)
	if !ok || rendered == "" {
		t.Error("bodyRendered should not be empty")
	}

	// Verify we can fetch it back
	getStatus, getBody := getJSON(t, fmt.Sprintf("%s/api/v1/correspondence/history/%s", baseURL(corrPort), corrID))
	assertStatus(t, getStatus, http.StatusOK)
	getData := extractDataMap(t, getBody)
	if getData["correspondenceId"] != corrID {
		t.Errorf("fetched correspondenceId = %v, want %s", getData["correspondenceId"], corrID)
	}
}

func TestCorr_Generate_MissingTemplate(t *testing.T) {
	payload := map[string]interface{}{
		"templateId": "c0000000-0000-0000-0000-000000000099",
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
	templateID := "c0000000-0000-0000-0000-000000000004"
	payload := map[string]interface{}{
		"templateId": templateID,
		"mergeData": map[string]string{
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
	_, ok := body["pagination"]
	if !ok {
		t.Error("history response missing pagination")
	}
}

func TestCorr_GetCorrespondence_NotFound(t *testing.T) {
	status, body := getJSON(t, baseURL(corrPort)+"/api/v1/correspondence/history/c0000000-0000-0000-0000-000000000099")
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
	corrID := genData["correspondenceId"].(string)

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
	if data["sentAt"] == nil {
		t.Error("sentAt should be set after marking as sent")
	}
}

func TestCorr_UpdateCorrespondence_NotFound(t *testing.T) {
	payload := map[string]interface{}{"status": "sent"}
	status, body := putJSON(t, baseURL(corrPort)+"/api/v1/correspondence/history/c0000000-0000-0000-0000-000000000099", payload)
	assertStatus(t, status, http.StatusNotFound)
	code, _ := extractError(t, body)
	if code != "NOT_FOUND" {
		t.Errorf("error.code = %q, want NOT_FOUND", code)
	}
}
