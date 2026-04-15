package main

import (
	"flag"
	"fmt"
	"log/slog"
	"os"

	"github.com/pulsemonitor/pulse/internal/api"
)

func main() {
	port := flag.Int("port", 8080, "server port")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	srv := api.NewServer()
	addr := fmt.Sprintf("127.0.0.1:%d", *port)
	slog.Info("starting pulse server", "addr", addr)
	if err := srv.Start(addr); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
