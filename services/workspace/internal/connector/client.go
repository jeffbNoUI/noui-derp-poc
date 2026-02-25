// Package connector provides an HTTP client for the Data Connector service.
//
// The workspace service fetches member data through the connector to determine
// which UI components should be rendered. No direct database access — the
// connector is the sole interface to the legacy database.
//
// Consumed by: internal/api (handlers fetch member data before calling engine)
// Depends on: Data Connector service at CONNECTOR_URL, internal/models
package connector

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/noui/workspace/internal/models"
)

// Client communicates with the connector service.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new connector client with the given base URL.
func NewClient(baseURL string) *Client {
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

// connectorError is the error envelope from the connector service.
type connectorError struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// get performs a GET request and decodes the CRITICAL-002 envelope response data.
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

// GetMember fetches member profile data by ID.
func (c *Client) GetMember(id string) (*models.MemberData, error) {
	var member models.MemberData
	err := c.get(fmt.Sprintf("/api/v1/members/%s", id), &member)
	if err != nil {
		return nil, err
	}
	return &member, nil
}

// ServiceCreditResponse wraps the connector service-credit endpoint response.
type ServiceCreditResponse struct {
	MemberID string                  `json:"member_id"`
	Summary  models.ServiceCreditData `json:"summary"`
}

// GetServiceCredit fetches service credit summary for a member.
func (c *Client) GetServiceCredit(id string) (*models.ServiceCreditData, error) {
	var resp ServiceCreditResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/service-credit", id), &resp)
	if err != nil {
		return nil, err
	}
	return &resp.Summary, nil
}

// DROResponse wraps the connector DRO endpoint response.
type DROResponse struct {
	MemberID string `json:"member_id"`
	HasDRO   bool   `json:"has_dro"`
	DROCount int    `json:"dro_count"`
}

// GetDRO fetches DRO presence data for a member.
func (c *Client) GetDRO(id string) (*models.DROData, error) {
	var resp DROResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/dro", id), &resp)
	if err != nil {
		return nil, err
	}
	return &models.DROData{
		HasDRO:   resp.HasDRO,
		DROCount: resp.DROCount,
	}, nil
}

// SalaryResponse wraps the connector salary endpoint response.
type SalaryResponse struct {
	MemberID      string `json:"member_id"`
	LeaveEligible bool   `json:"leave_payout_eligible"`
	LeaveNote     string `json:"leave_payout_note"`
}

// GetSalary fetches salary/leave payout data for a member.
func (c *Client) GetSalary(id string) (*models.SalaryData, error) {
	var resp SalaryResponse
	err := c.get(fmt.Sprintf("/api/v1/members/%s/salary", id), &resp)
	if err != nil {
		return nil, err
	}
	return &models.SalaryData{
		LeaveEligible: resp.LeaveEligible,
		LeaveNote:     resp.LeaveNote,
	}, nil
}

// Ping checks if the connector service is reachable by hitting /healthz.
func (c *Client) Ping() error {
	resp, err := c.httpClient.Get(c.baseURL + "/healthz")
	if err != nil {
		return fmt.Errorf("connector ping: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("connector healthz returned %d", resp.StatusCode)
	}
	return nil
}
