// Persistent audit writer that records data access and mutation events to AUDIT_LOG.
// Consumed by: handlers.go, refund_handlers.go, death_handlers.go (replaces log.Printf AUDIT calls)
// Depends on: database/sql (DB connection), auth.go (Identity from context)
//
// Fire-and-forget: audit write failures are logged but never block the API response.
package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

// AuditEntry represents a single audit event.
type AuditEntry struct {
	Action     string                 // READ, CREATE, UPDATE, CALCULATE, DELETE
	EntityType string                 // member, case, refund, death_record, survivor_claim
	EntityID   string                 // The specific entity ID
	MemberID   string                 // The member this action pertains to
	Details    map[string]interface{} // Structured details about the action
	Status     string                 // OK or ERROR
}

// AuditWriter persists audit entries to the AUDIT_LOG table.
type AuditWriter struct {
	db *sql.DB
}

// NewAuditWriter creates an AuditWriter. If db is nil, writes are silently skipped (test mode).
func NewAuditWriter(db *sql.DB) *AuditWriter {
	return &AuditWriter{db: db}
}

// WriteAudit persists an audit entry. Runs fire-and-forget — errors are logged, never returned.
func (a *AuditWriter) WriteAudit(r *http.Request, entry AuditEntry) {
	if a.db == nil {
		return
	}

	go a.writeAsync(r.Context(), r.RemoteAddr, entry)
}

func (a *AuditWriter) writeAsync(ctx context.Context, remoteAddr string, entry AuditEntry) {
	reqID := RequestIDFromContext(ctx)

	userID := "UNKNOWN"
	if identity := IdentityFromContext(ctx); identity != nil {
		userID = identity.UserID
	}

	status := entry.Status
	if status == "" {
		status = "OK"
	}

	var detailsJSON []byte
	if entry.Details != nil {
		var err error
		detailsJSON, err = json.Marshal(entry.Details)
		if err != nil {
			log.Printf("AUDIT-WRITER: failed to marshal details: %v", err)
			detailsJSON = []byte("{}")
		}
	}

	_, err := a.db.Exec(`
		INSERT INTO AUDIT_LOG (REQUEST_ID, USER_ID, ACTION, ENTITY_TYPE, ENTITY_ID, MEMBER_ID, DETAILS, IP_ADDRESS, STATUS)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, reqID, userID, entry.Action, entry.EntityType, entry.EntityID, entry.MemberID, detailsJSON, remoteAddr, status)

	if err != nil {
		// Audit failure must never block API response — log and move on
		log.Printf("AUDIT-WRITER: failed to write audit entry: %v (action=%s entity=%s member=%s)",
			err, entry.Action, entry.EntityType, entry.MemberID)
	}
}
