package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/pulsemonitor/pulse/internal/api"
)

func main() {
	port := flag.Int("port", 8080, "server port")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	srv := api.NewServer()
	listenAddr := fmt.Sprintf("127.0.0.1:%d", *port)
	slog.Info("starting pulse server", "addr", fmt.Sprintf("http://localhost:%d", *port))

	// Graceful shutdown on SIGINT / SIGTERM
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		sig := <-quit
		slog.Info("shutting down", "signal", sig.String())
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			slog.Error("shutdown error", "error", err)
		}
	}()

	if err := srv.Start(listenAddr); err != nil {
		// ErrServerClosed is expected after graceful shutdown
		if err.Error() != "http: Server closed" {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}
	slog.Info("server stopped")
}
