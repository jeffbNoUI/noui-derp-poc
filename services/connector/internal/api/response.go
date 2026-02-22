// Package api provides HTTP routing and response formatting for the connector service.
package api

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// SuccessResponse is the standard success response envelope.
type SuccessResponse struct {
	Data interface{} `json:"data"`
	Meta Meta        `json:"meta"`
}

// ErrorResponse is the standard error response envelope.
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// Meta contains request metadata.
type Meta struct {
	RequestID string `json:"request_id"`
	Timestamp string `json:"timestamp"`
}

// ErrorDetail contains error information.
type ErrorDetail struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"request_id"`
}

// WriteJSON writes a success response with the given data and status code.
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	resp := SuccessResponse{
		Data: data,
		Meta: Meta{
			RequestID: newRequestID(),
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		},
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// WriteError writes an error response.
func WriteError(w http.ResponseWriter, status int, code, message string) {
	resp := ErrorResponse{
		Error: ErrorDetail{
			Code:      code,
			Message:   message,
			RequestID: newRequestID(),
		},
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// newRequestID generates a random request ID (UUID v4 format).
func newRequestID() string {
	b := make([]byte, 16)
	rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
