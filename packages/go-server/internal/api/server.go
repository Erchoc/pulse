package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// NewServer creates and configures the Echo HTTP server with all API routes.
func NewServer() *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
	}))

	// Health check
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// API v1 routes
	v1 := e.Group("/api/v1")

	// Probes
	v1.GET("/probes", listProbes)
	v1.POST("/probes", createProbe)

	// Push endpoint (client heartbeat)
	v1.POST("/push/:token", receivePush)

	// Services
	v1.GET("/services", listServices)

	// Settings
	v1.GET("/settings", getSettings)

	return e
}

// Stub handlers — to be implemented with real storage layer

func listProbes(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func createProbe(c echo.Context) error {
	return c.JSON(http.StatusCreated, map[string]any{"data": nil})
}

func receivePush(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

func listServices(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func getSettings(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": map[string]string{
		"project_name": "Pulse",
	}})
}
