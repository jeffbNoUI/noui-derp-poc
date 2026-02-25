// Package api provides HTTP routing, response formatting, and request context
// for the intelligence service.
// Consumed by: handlers.go, router.go
// Depends on: nothing (uses stdlib only)
//
// Implements CRITICAL-002 response envelope: { data, dataQualityFlags, meta }
// with camelCase field names and full ResponseMeta.
package api

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// DataQualityFlag represents a data quality issue detected during processing.
type DataQualityFlag struct {
	Code     string `json:"code"`
	Severity string `json:"severity"`
	Entity   string `json:"entity,omitempty"`
	Field    string `json:"field"`
	Message  string `json:"message"`
}

// ResponseMeta contains request metadata per CRITICAL-002.
type ResponseMeta struct {
	RequestID        string `json:"requestId"`
	Timestamp        string `json:"timestamp"`
	Service          string `json:"service"`
	Version          string `json:"version"`
	DegradationLevel int    `json:"degradationLevel"`
	Source           string `json:"source"`
}

// SuccessResponse is the CRITICAL-002 success response envelope.
type SuccessResponse struct {
	Data             interface{}       `json:"data"`
	DataQualityFlags []DataQualityFlag `json:"dataQualityFlags"`
	Meta             ResponseMeta      `json:"meta"`
}

// ErrorDetail contains error information.
type ErrorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// ErrorResponse is the CRITICAL-002 error response envelope.
type ErrorResponse struct {
	Error ErrorDetail  `json:"error"`
	Meta  ResponseMeta `json:"meta"`
}

// WriteJSON writes a CRITICAL-002 success response with data and optional DQ flags.
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

// WriteError writes a CRITICAL-002 error response.
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

// FormatMoney formats a float64 as a 2-decimal string per CRITICAL-002.
func FormatMoney(v float64) string {
	return fmt.Sprintf("%.2f", v)
}

// buildMeta creates the ResponseMeta for a response.
func buildMeta(ctx context.Context) ResponseMeta {
	reqID := RequestIDFromContext(ctx)
	if reqID == "" {
		reqID = newRequestID()
	}
	return ResponseMeta{
		RequestID:        reqID,
		Timestamp:        time.Now().UTC().Format(time.RFC3339),
		Service:          "intelligence",
		Version:          "v1",
		DegradationLevel: 0,
		Source:           "rules-engine",
	}
}

// --- Request ID context ---

type contextKey string

const requestIDKey contextKey = "requestID"

// ContextWithRequestID adds a request ID to the context.
func ContextWithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey, id)
}

// RequestIDFromContext retrieves the request ID from the context.
func RequestIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

// newRequestID generates a UUID v4.
func newRequestID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
