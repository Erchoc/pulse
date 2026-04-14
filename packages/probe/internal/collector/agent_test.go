package collector

import (
	"sync/atomic"
	"testing"
	"time"

	"github.com/pulsemonitor/pulse-probe/internal/transport"
)

type mockSender struct {
	count atomic.Int32
}

func (m *mockSender) Send(_ transport.Payload) error {
	m.count.Add(1)
	return nil
}

func TestAgentSendsHeartbeat(t *testing.T) {
	sender := &mockSender{}
	agent := NewAgent(sender, 1)
	agent.Start()

	time.Sleep(1500 * time.Millisecond)
	agent.Stop()

	count := sender.count.Load()
	if count < 2 {
		t.Errorf("expected at least 2 heartbeats, got %d", count)
	}
}
