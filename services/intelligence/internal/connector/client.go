// Package connector provides an HTTP client for the Data Connector service.
// Consumed by: api/handlers.go
// Depends on: models (domain types)
//
// The intelligence service fetches all member data through the connector.
// No direct database access — connector is the sole interface to the legacy database.
package connector

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
)

// Client communicates with the connector service.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new connector client.
func NewClient() *Client {
	baseURL := os.Getenv("CONNECTOR_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8081"
	}
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// connectorResponse is the CRITICAL-002 response envelope from the connector service.
type connectorResponse struct {
	Data             json.RawMessage `json:"data"`
	DataQualityFlags json.RawMessage `json:"dataQualityFlags"`
	Meta             struct {
		RequestID string `json:"requestId"`
		Timestamp string `json:"timestamp"`
	} `json:"meta"`
}

type connectorError struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// Ping checks if the connector service is reachable (for /readyz).
func (c *Client) Ping() error {
	resp, err := c.httpClient.Get(c.baseURL + "/healthz")
	if err != nil {
		return fmt.Errorf("connector healthz: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("connector healthz returned %d", resp.StatusCode)
	}
	return nil
}

// get performs a GET request and decodes the response data.
func (c *Client) get(path string, result interface{}) error {
	resp, err := c.httpClient.Get(c.baseURL + path)
	if err != nil {
		return fmt.Errorf("connector request %s: %w", path, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp connectorError
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("connector %s returned %d: %s", path, resp.StatusCode, errResp.Error.Message)
	}

	var envelope connectorResponse
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return fmt.Errorf("decode connector response: %w", err)
	}

	return json.Unmarshal(envelope.Data, result)
}

// GetMember fetches member data by ID.
// Connector returns camelCase JSON with string dates; this method parses them.
func (c *Client) GetMember(memberID string) (*models.MemberData, error) {
	var member models.MemberData
	err := c.get(fmt.Sprintf("/api/v1/members/%s", memberID), &member)
	if err != nil {
		return nil, err
	}
	member.ParseDates()
	return &member, nil
}

// SalaryResponse is the response from the connector salary endpoint.
// Uses camelCase JSON tags per Session 2 CRITICAL-002 update.
type SalaryResponse struct {
	MemberID            string            `json:"memberId"`
	Tier                int               `json:"tier"`
	AMS                 *models.AMSResult `json:"ams"`
	LeavePayoutEligible bool              `json:"leavePayoutEligible"`
	LeavePayoutNote     string            `json:"leavePayoutNote"`
	SalaryRecordCount   int               `json:"salaryRecordCount"`
}

// GetSalary fetches salary data and AMS calculation for a member.
// Parses the string AMS amount to float64 for downstream calculations.
func (c *Client) GetSalary(memberID string) (*SalaryResponse, error) {
	var salary SalaryResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/salary", memberID), &salary)
	if err != nil {
		return nil, err
	}
	// Parse string AMS amount to float64 for calculation use
	if salary.AMS != nil && salary.AMS.Amount != "" {
		if v, err := strconv.ParseFloat(salary.AMS.Amount, 64); err == nil {
			salary.AMS.AMS = v
		}
	}
	return &salary, nil
}

// ServiceCreditResponse is the response from the connector service-credit endpoint.
// Note: "summary" nested object uses snake_case JSON tags (connector internal model).
type ServiceCreditResponse struct {
	MemberID string                      `json:"memberId"`
	Summary  models.ServiceCreditSummary `json:"summary"`
}

// GetServiceCredit fetches service credit summary for a member.
func (c *Client) GetServiceCredit(memberID string) (*models.ServiceCreditSummary, error) {
	var resp ServiceCreditResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/service-credit", memberID), &resp)
	if err != nil {
		return nil, err
	}
	return &resp.Summary, nil
}

// DROResponse is the response from the connector DRO endpoint.
// Top-level keys are camelCase; nested DRO records use snake_case.
type DROResponse struct {
	MemberID string             `json:"memberId"`
	HasDRO   bool               `json:"hasDro"`
	DROCount int                `json:"droCount"`
	DROs     []models.DRORecord `json:"dros"`
}

// GetDROs fetches DRO records for a member.
func (c *Client) GetDROs(memberID string) (*DROResponse, error) {
	var resp DROResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/dro", memberID), &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Department represents a city department with aggregate employee/payroll data.
// Mirrors the connector's employer model for pass-through aggregation.
type Department struct {
	DeptID         string  `json:"dept_id"`
	Name           string  `json:"name"`
	Code           string  `json:"code"`
	EmployeeCount  int     `json:"employee_count"`
	MonthlyPayroll float64 `json:"monthly_payroll"`
	ContactName    string  `json:"contact_name"`
	ContactEmail   string  `json:"contact_email"`
}

// GetDepartments fetches all department data from the connector employer endpoint.
func (c *Client) GetDepartments() ([]Department, error) {
	var depts []Department
	err := c.get("/api/v1/employer/departments", &depts)
	if err != nil {
		return nil, err
	}
	return depts, nil
}
