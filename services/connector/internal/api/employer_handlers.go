// Package api — employer HTTP handlers for the DERP connector service.
// Provides endpoints for department listings, employee rosters, contribution reports,
// pending retirements, and dashboard statistics.
// Consumed by: router.go (endpoint registration), intelligence service (via HTTP)
// Depends on: db/employer_queries.go, models/employer.go, response.go (envelope)
package api

import (
	"log"
	"net/http"
	"strings"
)

// extractDeptCode extracts the department code from the URL path.
// Expected path format: /api/v1/employer/departments/{deptCode}/...
func extractDeptCode(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	// /api/v1/employer/departments/{deptCode}... → parts: [api, v1, employer, departments, {deptCode}, ...]
	if len(parts) >= 5 && parts[3] == "departments" {
		return parts[4]
	}
	return ""
}

// GetDepartments handles GET /api/v1/employer/departments
// Returns all departments with employee counts and payroll aggregates.
func (h *Handlers) GetDepartments(w http.ResponseWriter, r *http.Request) {
	depts, err := h.q.GetDepartments()
	if err != nil {
		log.Printf("ERROR: GetDepartments: %v", err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve departments")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"departments": depts,
		"count":       len(depts),
	})
}

// GetDepartmentEmployees handles GET /api/v1/employer/departments/{deptCode}/employees
// Returns the employee roster for a specific department.
func (h *Handlers) GetDepartmentEmployees(w http.ResponseWriter, r *http.Request) {
	deptCode := extractDeptCode(r.URL.Path)
	if deptCode == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Department code is required")
		return
	}

	employees, err := h.q.GetEmployeesByDepartment(deptCode)
	if err != nil {
		log.Printf("ERROR: GetEmployeesByDepartment(%s): %v", deptCode, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve employees")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"department": deptCode,
		"employees":  employees,
		"count":      len(employees),
	})
}

// GetDepartmentStats handles GET /api/v1/employer/departments/{deptCode}/stats
// Returns dashboard statistics for a specific department.
func (h *Handlers) GetDepartmentStats(w http.ResponseWriter, r *http.Request) {
	deptCode := extractDeptCode(r.URL.Path)
	if deptCode == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Department code is required")
		return
	}

	stats, err := h.q.GetEmployerDashboardStats(deptCode)
	if err != nil {
		log.Printf("ERROR: GetEmployerDashboardStats(%s): %v", deptCode, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve stats")
		return
	}

	WriteJSON(w, r, http.StatusOK, stats)
}

// GetContributionReports handles GET /api/v1/employer/contributions?dept={deptCode}
// Returns aggregate contribution reports for a department, grouped by fiscal period.
func (h *Handlers) GetContributionReports(w http.ResponseWriter, r *http.Request) {
	deptCode := r.URL.Query().Get("dept")
	if deptCode == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "dept query parameter is required")
		return
	}

	reports, err := h.q.GetContributionReports(deptCode)
	if err != nil {
		log.Printf("ERROR: GetContributionReports(%s): %v", deptCode, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve contribution reports")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"department": deptCode,
		"reports":    reports,
		"count":      len(reports),
	})
}

// GetPendingRetirements handles GET /api/v1/employer/retirements?dept={deptCode}
// Returns employees with pending retirement applications for a department.
func (h *Handlers) GetPendingRetirements(w http.ResponseWriter, r *http.Request) {
	deptCode := r.URL.Query().Get("dept")
	if deptCode == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "dept query parameter is required")
		return
	}

	retirements, err := h.q.GetPendingRetirements(deptCode)
	if err != nil {
		log.Printf("ERROR: GetPendingRetirements(%s): %v", deptCode, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve pending retirements")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"department":  deptCode,
		"retirements": retirements,
		"count":       len(retirements),
	})
}
