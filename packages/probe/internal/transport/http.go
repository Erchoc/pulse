package transport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Sender sends heartbeat data to the Pulse server.
type Sender interface {
	Send(payload Payload) error
}

// Payload represents a single heartbeat push to the server.
type Payload struct {
	Status    string `json:"status"`
	LatencyMs int64  `json:"latency_ms,omitempty"`
	Message   string `json:"message,omitempty"`
}

// HTTPSender implements Sender via HTTP POST to /api/v1/push/:token.
type HTTPSender struct {
	endpoint string
	client   *http.Client
}

func NewHTTPSender(serverURL, token string) *HTTPSender {
	return &HTTPSender{
		endpoint: fmt.Sprintf("%s/api/v1/push/%s", serverURL, token),
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *HTTPSender) Send(payload Payload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	resp, err := s.client.Post(s.endpoint, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned status %d", resp.StatusCode)
	}
	return nil
}
