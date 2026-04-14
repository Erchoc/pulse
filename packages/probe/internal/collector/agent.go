package collector

import (
	"log/slog"
	"time"

	"github.com/pulsemonitor/pulse-probe/internal/transport"
)

// Agent periodically collects system metrics and sends heartbeats.
type Agent struct {
	sender   transport.Sender
	interval time.Duration
	stopCh   chan struct{}
}

func NewAgent(sender transport.Sender, intervalSec int) *Agent {
	return &Agent{
		sender:   sender,
		interval: time.Duration(intervalSec) * time.Second,
		stopCh:   make(chan struct{}),
	}
}

func (a *Agent) Start() {
	go a.loop()
}

func (a *Agent) Stop() {
	close(a.stopCh)
}

func (a *Agent) loop() {
	ticker := time.NewTicker(a.interval)
	defer ticker.Stop()

	// Send initial heartbeat immediately
	a.beat()

	for {
		select {
		case <-ticker.C:
			a.beat()
		case <-a.stopCh:
			return
		}
	}
}

func (a *Agent) beat() {
	start := time.Now()
	payload := transport.Payload{
		Status:  "up",
		Message: "heartbeat",
	}
	payload.LatencyMs = time.Since(start).Milliseconds()

	if err := a.sender.Send(payload); err != nil {
		slog.Error("heartbeat failed", "error", err)
		return
	}
	slog.Debug("heartbeat sent")
}
