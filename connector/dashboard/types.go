package main

import "time"

// DashboardState holds the current monitoring state.
type DashboardState struct {
	LastRun    time.Time      `json:"last_run"`
	Report     *MonitorReport `json:"report,omitempty"`
	RunHistory []RunSummary   `json:"run_history"`
}

// RunSummary is a lightweight record of a past monitoring run.
type RunSummary struct {
	RunAt       string `json:"run_at"`
	TotalChecks int    `json:"total_checks"`
	Passed      int    `json:"passed"`
	Warnings    int    `json:"warnings"`
	Failed      int    `json:"failed"`
}

// MonitorReport mirrors the monitor's output types so we can deserialize them.
type MonitorReport struct {
	Source    string        `json:"source"`
	Database string        `json:"database"`
	RunAt    string        `json:"run_at"`
	Baselines []Baseline   `json:"baselines"`
	Checks   []CheckResult `json:"checks"`
	Summary  ReportSummary `json:"summary"`
}

// Baseline holds statistical baseline metrics for a single measurement.
type Baseline struct {
	MetricName string  `json:"metric_name"`
	Mean       float64 `json:"mean"`
	StdDev     float64 `json:"std_dev"`
	Min        float64 `json:"min"`
	Max        float64 `json:"max"`
	SampleSize int     `json:"sample_size"`
}

// CheckResult holds the outcome of a single monitoring check.
type CheckResult struct {
	CheckName string   `json:"check_name"`
	Category  string   `json:"category"`
	Status    string   `json:"status"`
	Message   string   `json:"message"`
	Expected  float64  `json:"expected"`
	Actual    float64  `json:"actual"`
	Deviation float64  `json:"deviation_pct"`
	Details   []string `json:"details,omitempty"`
	Timestamp string   `json:"timestamp"`
}

// ReportSummary holds aggregate counts from a monitoring run.
type ReportSummary struct {
	TotalChecks int `json:"total_checks"`
	Passed      int `json:"passed"`
	Warnings    int `json:"warnings"`
	Failed      int `json:"failed"`
}
