// Package api — employer HTTP handlers for the DERP intelligence service.
// Pass-through handler that fetches employer data from the connector service
// and adds intelligence-layer enrichment (aggregated overview).
// Consumed by: router.go (endpoint registration), frontend employer portal
// Depends on: connector/client.go (upstream data), response.go (envelope)
package api

import (
	"log"
	"net/http"
)

// GetEmployerOverview handles GET /api/v1/employer/overview
// Fetches department data from the connector and returns an aggregated dashboard overview.
// This endpoint adds the intelligence layer over raw connector data — in the future,
// this could include trend analysis, anomaly detection, and workforce projections.
func (h *Handlers) GetEmployerOverview(w http.ResponseWriter, r *http.Request) {
	depts, err := h.conn.GetDepartments()
	if err != nil {
		log.Printf("ERROR: GetDepartments: %v", err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch department data")
		return
	}

	// Aggregate totals from departments
	var totalEmployees int
	var totalPayroll float64
	for _, d := range depts {
		totalEmployees += d.EmployeeCount
		totalPayroll += d.MonthlyPayroll
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"departments":     depts,
		"department_count": len(depts),
		"total_employees": totalEmployees,
		"total_monthly_payroll": totalPayroll,
		// Statutory contribution rates — RMC §18-401, DERP Handbook Jan 2024
		"contribution_rate_employee": 8.45,
		"contribution_rate_employer": 17.95,
	})
}
