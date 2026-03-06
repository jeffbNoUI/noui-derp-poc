package main

import "testing"

func TestNewAdapterMySQL(t *testing.T) {
	adapter := NewAdapter("mysql")
	if _, ok := adapter.(*MySQLAdapter); !ok {
		t.Errorf("Expected *MySQLAdapter, got %T", adapter)
	}
}

func TestNewAdapterPostgres(t *testing.T) {
	adapter := NewAdapter("postgres")
	if _, ok := adapter.(*PostgresAdapter); !ok {
		t.Errorf("Expected *PostgresAdapter, got %T", adapter)
	}
}

func TestNewAdapterDefault(t *testing.T) {
	adapter := NewAdapter("unknown")
	if _, ok := adapter.(*MySQLAdapter); !ok {
		t.Errorf("Unknown driver should default to *MySQLAdapter, got %T", adapter)
	}
}
