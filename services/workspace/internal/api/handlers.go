// Package api provides HTTP handlers for the workspace composition service.
//
// Handlers receive composition requests, fetch member data from the connector
// service, pass it to the composition engine, and return the result. The handler
// is the bridge between the HTTP layer and the composition logic.
//
// Consumed by: router.go (registers handlers on routes)
// Depends on: internal/composition (engine), internal/connector (client), internal/models
package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/noui/workspace/internal/composition"
	"github.com/noui/workspace/internal/connector"
	"github.com/noui/workspace/internal/models"
)

// Handlers provides HTTP handlers backed by the composition engine and connector client.
type Handlers struct {
	engine *composition.Engine
	conn   *connector.Client
}

// NewHandlers creates a new Handlers instance.
func NewHandlers(engine *composition.Engine, conn *connector.Client) *Handlers {
	return &Handlers{
		engine: engine,
		conn:   conn,
	}
}

// Health handles GET /healthz
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "workspace",
		"version": "0.1.0",
	})
}

// Ready handles GET /readyz — pings the connector to verify upstream connectivity.
func (h *Handlers) Ready(w http.ResponseWriter, r *http.Request) {
	if err := h.conn.Ping(); err != nil {
		log.Printf("READYZ: connector unreachable: %v", err)
		WriteError(w, http.StatusServiceUnavailable, "NOT_READY",
			"Connector service unreachable: "+err.Error())
		return
	}
	WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "workspace",
		"version": "0.1.0",
	})
}

// EvaluateComposition handles POST /api/v1/composition/evaluate
//
// Fetches member data from the connector, builds the MemberContext, and passes
// it to the composition engine. Returns the full workspace composition with
// stages, components, and conditional flags.
func (h *Handlers) EvaluateComposition(w http.ResponseWriter, r *http.Request) {
	var req models.CompositionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body: "+err.Error())
		return
	}

	if req.MemberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}
	if req.ProcessType == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "process_type is required")
		return
	}

	// Fetch member data from connector
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data: "+err.Error())
		return
	}

	// Fetch service credit
	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit: "+err.Error())
		return
	}

	// Fetch DRO data
	droData, err := h.conn.GetDRO(req.MemberID)
	if err != nil {
		log.Printf("WARN: GetDRO(%s): %v (defaulting to no DRO)", req.MemberID, err)
		// DRO fetch failure is non-fatal — default to no DRO
		droData = &models.DROData{HasDRO: false}
	}

	// Fetch salary/leave data
	salaryData, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("WARN: GetSalary(%s): %v (defaulting to no leave)", req.MemberID, err)
		// Salary fetch failure is non-fatal — default to no leave eligibility
		salaryData = &models.SalaryData{LeaveEligible: false}
	}

	// Build member context and evaluate composition
	ctx := models.MemberContext{
		Member:        *member,
		ServiceCredit: *svcCredit,
		DRO:           *droData,
		Salary:        *salaryData,
	}

	result, err := h.engine.Evaluate(req, ctx)
	if err != nil {
		log.Printf("ERROR: Evaluate(%s, %s): %v", req.MemberID, req.ProcessType, err)
		WriteError(w, http.StatusBadRequest, "COMPOSITION_ERROR", err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, result)
}
