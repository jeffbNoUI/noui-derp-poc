package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// RunScheduled runs the monitor on a fixed interval, writing each report to
// both the latest output path and a timestamped file in historyDir.
// It blocks until interrupted by SIGINT/SIGTERM.
func RunScheduled(db *sql.DB, driver, database, outputPath, historyDir string, interval time.Duration, baselineOnly, checksOnly bool) {
	// Ensure history directory exists
	if historyDir != "" {
		if err := os.MkdirAll(historyDir, 0755); err != nil {
			log.Fatalf("Failed to create history directory %s: %v", historyDir, err)
		}
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	runCount := 0
	log.Printf("Scheduled monitoring: interval=%s, output=%s, history=%s", interval, outputPath, historyDir)

	for {
		runCount++
		log.Printf("--- Scheduled run #%d ---", runCount)

		report, err := RunMonitor(db, driver, database, baselineOnly, checksOnly)
		if err != nil {
			log.Printf("Monitor run #%d failed: %v", runCount, err)
		} else {
			if writeErr := writeReport(report, outputPath, historyDir); writeErr != nil {
				log.Printf("Failed to write report: %v", writeErr)
			} else {
				log.Printf("Run #%d complete: %d checks (%d pass, %d warn, %d fail)",
					runCount, report.Summary.TotalChecks, report.Summary.Passed,
					report.Summary.Warnings, report.Summary.Failed)
			}
		}

		// Wait for next interval or shutdown signal
		select {
		case sig := <-sigCh:
			log.Printf("Received %v, shutting down after %d runs", sig, runCount)
			return
		case <-time.After(interval):
			// continue to next run
		}
	}
}

// writeReport writes the monitor report to the output path and optionally
// to a timestamped file in the history directory.
func writeReport(report *MonitorReport, outputPath, historyDir string) error {
	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling report: %w", err)
	}

	// Write latest report
	if err := os.WriteFile(outputPath, data, 0644); err != nil {
		return fmt.Errorf("writing latest report to %s: %w", outputPath, err)
	}

	// Write timestamped copy to history directory
	if historyDir != "" {
		if err := os.MkdirAll(historyDir, 0755); err != nil {
			return fmt.Errorf("creating history directory %s: %w", historyDir, err)
		}
		ts := strings.ReplaceAll(report.RunAt, ":", "-") // filesystem-safe timestamp
		historyFile := filepath.Join(historyDir, fmt.Sprintf("report-%s.json", ts))
		if err := os.WriteFile(historyFile, data, 0644); err != nil {
			return fmt.Errorf("writing history report to %s: %w", historyFile, err)
		}
		log.Printf("History report written to %s", historyFile)
	}

	return nil
}
