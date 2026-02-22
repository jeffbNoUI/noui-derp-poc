// Package connector provides an HTTP client for the Data Connector service.
//
// The intelligence service fetches all member data through the connector.
// No direct database access — connector is the sole interface to the legacy database.
package connector

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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

// connectorResponse is the standard response envelope from the connector service.
type connectorResponse struct {
	Data json.RawMessage `json:"data"`
	Meta struct {
		RequestID string `json:"request_id"`
		Timestamp string `json:"timestamp"`
	} `json:"meta"`
}

type connectorError struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
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
func (c *Client) GetMember(memberID string) (*models.MemberData, error) {
	var member models.MemberData
	err := c.get(fmt.Sprintf("/api/v1/members/%s", memberID), &member)
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// SalaryResponse is the response from the connector salary endpoint.
type SalaryResponse struct {
	MemberID       string             `json:"member_id"`
	Tier           int                `json:"tier"`
	AMS            *models.AMSResult  `json:"ams_calculation"`
	LeaveEligible  bool               `json:"leave_payout_eligible"`
	LeaveNote      string             `json:"leave_payout_note"`
	RecordCount    int                `json:"salary_record_count"`
}

// GetSalary fetches salary data and AMS calculation for a member.
func (c *Client) GetSalary(memberID string) (*SalaryResponse, error) {
	var salary SalaryResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/salary", memberID), &salary)
	if err != nil {
		return nil, err
	}
	return &salary, nil
}

// ServiceCreditResponse is the response from the connector service-credit endpoint.
type ServiceCreditResponse struct {
	MemberID string                      `json:"member_id"`
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
type DROResponse struct {
	MemberID string             `json:"member_id"`
	HasDRO   bool               `json:"has_dro"`
	DROCount int                `json:"dro_count"`
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
