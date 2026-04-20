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
	webRoot := flag.String(
		"web-root",
		envOr("PULSE_WEB_ROOT", "/srv/web"),
		"directory serving frontend static files (empty = API-only mode)",
	)
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	srv := api.NewServer()
	api.AttachWebRoot(srv, *webRoot)
	// Fly / 其他代理要求监听所有接口，而非 127.0.0.1 (回环)
	listenAddr := fmt.Sprintf(":%d", *port)
	slog.Info("starting pulse server",
		"addr", listenAddr,
		"web_root", *webRoot,
	)

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

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
