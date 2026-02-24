// Package api provides HTTP routing and response formatting for the connector service.
// Consumed by: handlers, router, middleware
// Depends on: net/http, encoding/json
//
// CRITICAL-002: All responses use unified envelope { data, dataQualityFlags, meta }
package api

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// DataQualityFlag surfaces data quality issues discovered during data retrieval.
// Included at the top level of every API response per CRITICAL-002 (CON-03).
type DataQualityFlag struct {
	Code          string      `json:"code"`                    // e.g., "DQ-001", "DQ-006"
	Severity      string      `json:"severity"`                // "critical", "high", "medium", "low"
	Entity        string      `json:"entity,omitempty"`        // "member", "salary", "service_credit"
	Field         string      `json:"field"`                   // Affected field name
	Message       string      `json:"message"`                 // Human-readable description
	StoredValue   interface{} `json:"storedValue,omitempty"`   // What the database says
	ExpectedValue interface{} `json:"expectedValue,omitempty"` // What it should be
	Rule          string      `json:"rule,omitempty"`          // Business rule reference
}

// ResponseMeta is included in every API response for tracing and system health
// awareness. Per CRITICAL-002 (CON-03) merged S1 + S3 format.
type ResponseMeta struct {
	RequestID        string `json:"requestId"`
	Timestamp        string `json:"timestamp"`
	Service          string `json:"service"`
	Version          string `json:"version"`
	DegradationLevel int    `json:"degradationLevel"`
	Source           string `json:"source"`
}

// SuccessResponse is the standard success response envelope per CRITICAL-002.
// Every response includes data, dataQualityFlags (empty array if none), and meta.
type SuccessResponse struct {
	Data             interface{}       `json:"data"`
	DataQualityFlags []DataQualityFlag `json:"dataQualityFlags"`
	Meta             ResponseMeta      `json:"meta"`
}

// ErrorResponse is the standard error response envelope.
type ErrorResponse struct {
	Error ErrorDetail  `json:"error"`
	Meta  ResponseMeta `json:"meta"`
}

// ErrorDetail contains error information.
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// contextKey is an unexported type for context keys in this package.
type contextKey string

const requestIDKey contextKey = "requestID"

// RequestIDFromContext retrieves the request ID from context. Falls back to generating one.
func RequestIDFromContext(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey).(string); ok && id != "" {
		return id
	}
	return newRequestID()
}

// ContextWithRequestID returns a new context with the request ID.
func ContextWithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey, id)
}

// buildMeta creates a ResponseMeta with the request's context.
func buildMeta(ctx context.Context) ResponseMeta {
	return ResponseMeta{
		RequestID:        RequestIDFromContext(ctx),
		Timestamp:        time.Now().UTC().Format(time.RFC3339),
		Service:          "connector",
		Version:          "v1",
		DegradationLevel: 0,
		Source:           "legacy-direct",
	}
}

// WriteJSON writes a success response with the given data and optional DQ flags.
func WriteJSON(w http.ResponseWriter, r *http.Request, status int, data interface{}, flags ...DataQualityFlag) {
	dqFlags := make([]DataQualityFlag, 0)
	if len(flags) > 0 {
		dqFlags = flags
	}
	resp := SuccessResponse{
		Data:             data,
		DataQualityFlags: dqFlags,
		Meta:             buildMeta(r.Context()),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// WriteError writes an error response.
func WriteError(w http.ResponseWriter, r *http.Request, status int, code, message string) {
	resp := ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
		},
		Meta: buildMeta(r.Context()),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// FormatMoney formats a float64 as a string with exactly 2 decimal places.
// CRITICAL-002: All monetary values are JSON strings.
func FormatMoney(v float64) string {
	return fmt.Sprintf("%.2f", v)
}

// newRequestID generates a random request ID (UUID v4 format).
func newRequestID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
