package main

import (
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/pulsemonitor/pulse-probe/internal/collector"
	"github.com/pulsemonitor/pulse-probe/internal/transport"
)

func main() {
	serverURL := flag.String("server", "http://localhost:8080", "pulse server URL")
	token := flag.String("token", "", "push token assigned by server")
	interval := flag.Int("interval", 30, "heartbeat interval in seconds")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	if *token == "" {
		slog.Error("--token is required")
		os.Exit(1)
	}

	sender := transport.NewHTTPSender(*serverURL, *token)
	agent := collector.NewAgent(sender, *interval)

	slog.Info("starting pulse-probe", "server", *serverURL, "interval", *interval)
	agent.Start()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	slog.Info("shutting down pulse-probe")
	agent.Stop()
}
