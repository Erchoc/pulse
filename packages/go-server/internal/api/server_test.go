package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthEndpoint(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
}

func TestListProbes(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/probes", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
}

func TestPushEndpoint(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/push/test-token", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}
}

func TestStartMaintenance(t *testing.T) {
	srv := NewServer()
	body := `{"reason":"DB migration","end_at":"2026-04-15T18:00:00Z","notify_users":["user-1"]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/services/svc-1/maintenance", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestEndMaintenance(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/services/svc-1/maintenance", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestGetMaintenanceHistory(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/services/svc-1/maintenance/history", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}
