package api

import (
	"encoding/json"
	"io"
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
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status=ok, got %q", body["status"])
	}
}

func TestListProbes(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/probes", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if _, ok := body["data"]; !ok {
		t.Error("response missing 'data' field")
	}
	if _, ok := body["total"]; !ok {
		t.Error("response missing 'total' field")
	}
}

func TestCreateProbe(t *testing.T) {
	srv := NewServer()

	payload := `{"name":"test-probe","type":"http","mode":"server","target":"https://example.com"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/probes", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if _, ok := body["data"]; !ok {
		t.Error("response missing 'data' field")
	}
}

func TestPushEndpoint(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/push/test-token", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if body["ok"] != true {
		t.Errorf("expected ok=true, got %v", body["ok"])
	}
}

func TestPushEndpointWithBody(t *testing.T) {
	srv := NewServer()

	payload := `{"status":"up","latency_ms":42,"message":"all good"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/push/test-token", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if body["ok"] != true {
		t.Errorf("expected ok=true, got %v", body["ok"])
	}
}

func TestListServices(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/services", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if _, ok := body["data"]; !ok {
		t.Error("response missing 'data' field")
	}
	if _, ok := body["total"]; !ok {
		t.Error("response missing 'total' field")
	}
}

func TestGetSettings(t *testing.T) {
	srv := NewServer()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/settings", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	data, ok := body["data"].(map[string]any)
	if !ok {
		t.Fatal("response missing 'data' object")
	}
	if data["project_name"] != "Pulse" {
		t.Errorf("expected project_name=Pulse, got %v", data["project_name"])
	}
}

func TestStartMaintenance(t *testing.T) {
	srv := NewServer()
	payload := `{"reason":"DB migration","end_at":"2026-04-15T18:00:00Z","notify_users":["user-1"]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/services/svc-1/maintenance", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	data, ok := body["data"].(map[string]any)
	if !ok {
		t.Fatal("response missing 'data' object")
	}
	if data["service_id"] != "svc-1" {
		t.Errorf("expected service_id=svc-1, got %v", data["service_id"])
	}
	if data["maintenance"] != true {
		t.Errorf("expected maintenance=true, got %v", data["maintenance"])
	}
	if data["reason"] != "DB migration" {
		t.Errorf("expected reason='DB migration', got %v", data["reason"])
	}
	if data["start_at"] == nil || data["start_at"] == "" {
		t.Error("start_at should not be empty")
	}
}

func TestStartMaintenanceInvalidBody(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/services/svc-1/maintenance", strings.NewReader("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	errObj, ok := body["error"].(map[string]any)
	if !ok {
		t.Fatal("response missing 'error' object")
	}
	if errObj["code"] != "INVALID_REQUEST" {
		t.Errorf("expected code=INVALID_REQUEST, got %v", errObj["code"])
	}
}

func TestEndMaintenance(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/services/svc-1/maintenance", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	data, ok := body["data"].(map[string]any)
	if !ok {
		t.Fatal("response missing 'data' object")
	}
	if data["service_id"] != "svc-1" {
		t.Errorf("expected service_id=svc-1, got %v", data["service_id"])
	}
	if data["maintenance"] != false {
		t.Errorf("expected maintenance=false, got %v", data["maintenance"])
	}
	if data["ended_at"] == nil || data["ended_at"] == "" {
		t.Error("ended_at should not be empty")
	}
}

func TestGetMaintenanceHistory(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/services/svc-1/maintenance/history", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if _, ok := body["data"]; !ok {
		t.Error("response missing 'data' field")
	}
	if _, ok := body["total"]; !ok {
		t.Error("response missing 'total' field")
	}
}

func TestWebhookTestMissingURL(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/settings/webhook/test",
		strings.NewReader(`{"url":"","body":""}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	errObj, ok := body["error"].(map[string]any)
	if !ok {
		t.Fatal("response missing 'error' object")
	}
	if errObj["code"] != "INVALID_REQUEST" {
		t.Errorf("expected code=INVALID_REQUEST, got %v", errObj["code"])
	}
	if errObj["message"] != "url is required" {
		t.Errorf("expected message='url is required', got %v", errObj["message"])
	}
}

func TestStatusPageRoutes(t *testing.T) {
	e := NewServer()

	tests := []struct {
		name   string
		method string
		path   string
		body   string
		status int
	}{
		{"list status pages", http.MethodGet, "/api/v1/status-pages", "", http.StatusOK},
		{"create status page", http.MethodPost, "/api/v1/status-pages", `{"name":"Public","slug":"public","service_ids":["svc-1"]}`, http.StatusCreated},
		{"create status page missing fields", http.MethodPost, "/api/v1/status-pages", `{"name":""}`, http.StatusBadRequest},
		{"update status page", http.MethodPut, "/api/v1/status-pages/sp-1", `{"name":"Updated","slug":"updated"}`, http.StatusOK},
		{"delete status page", http.MethodDelete, "/api/v1/status-pages/sp-1", "", http.StatusOK},
		{"get public status", http.MethodGet, "/api/v1/status/services", "", http.StatusOK},
		{"get status by slug", http.MethodGet, "/api/v1/status/my-page", "", http.StatusOK},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := httptest.NewRequest(tc.method, tc.path, body)
			if tc.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if rec.Code != tc.status {
				t.Errorf("expected %d, got %d, body: %s", tc.status, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestWebhookTestInvalidHost(t *testing.T) {
	srv := NewServer()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/settings/webhook/test",
		strings.NewReader(`{"url":"https://this-host-does-not-exist-12345.invalid/hook"}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	// Should return 200 with success=false (not a server error)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON response: %v", err)
	}
	if body["success"] != false {
		t.Errorf("expected success=false, got %v", body["success"])
	}
	if body["error"] == nil || body["error"] == "" {
		t.Error("expected error message for invalid host")
	}
}
