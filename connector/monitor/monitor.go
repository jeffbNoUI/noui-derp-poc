package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

// RunMonitor connects to the database, computes baselines, runs all checks,
// and returns a complete MonitorReport.
func RunMonitor(db *sql.DB, source, database string, baselineOnly, checksOnly bool) (*MonitorReport, error) {
	report := &MonitorReport{
		Source:   source,
		Database: database,
		RunAt:    time.Now().UTC().Format(time.RFC3339),
	}

	// Compute baselines (unless --checks-only)
	if !checksOnly {
		log.Println("Computing statistical baselines...")
		baselines, err := ComputeBaselines(db)
		if err != nil {
			return nil, fmt.Errorf("computing baselines: %w", err)
		}
		report.Baselines = baselines
		log.Printf("Computed %d baseline metrics", len(baselines))
		for _, b := range baselines {
			log.Printf("  %s: mean=%.2f stddev=%.2f min=%.2f max=%.2f (n=%d)",
				b.MetricName, b.Mean, b.StdDev, b.Min, b.Max, b.SampleSize)
		}
	}

	// Stop here if --baseline-only
	if baselineOnly {
		report.Summary = ReportSummary{}
		return report, nil
	}

	// Run all checks
	log.Println("Running monitoring checks...")
	checks := AllChecks()
	var results []CheckResult
	for _, check := range checks {
		r := check(db)
		results = append(results, r)
		statusLabel := r.Status
		switch r.Status {
		case "pass":
			statusLabel = "PASS"
		case "warn":
			statusLabel = "WARN"
		case "fail":
			statusLabel = "FAIL"
		}
		log.Printf("  [%s] %s: %s", statusLabel, r.CheckName, r.Message)
	}
	report.Checks = results

	// Build summary
	summary := ReportSummary{
		TotalChecks: len(results),
	}
	for _, r := range results {
		switch r.Status {
		case "pass":
			summary.Passed++
		case "warn":
			summary.Warnings++
		case "fail":
			summary.Failed++
		}
	}
	report.Summary = summary
	log.Printf("Summary: %d total, %d passed, %d warnings, %d failed",
		summary.TotalChecks, summary.Passed, summary.Warnings, summary.Failed)

	return report, nil
}
