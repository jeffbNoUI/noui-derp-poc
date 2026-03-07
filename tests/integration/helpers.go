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
