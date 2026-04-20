package api

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// NewServer creates and configures the Echo HTTP server with all API routes.
func NewServer() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

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

	// Maintenance
	v1.POST("/services/:id/maintenance", startMaintenance)
	v1.DELETE("/services/:id/maintenance", endMaintenance)
	v1.GET("/services/:id/maintenance/history", getMaintenanceHistory)

	// Settings
	v1.GET("/settings", getSettings)
	v1.POST("/settings/webhook/test", testWebhook)

	// Status Pages (management)
	v1.GET("/status-pages", listStatusPages)
	v1.POST("/status-pages", createStatusPage)
	v1.PUT("/status-pages/:id", updateStatusPage)
	v1.DELETE("/status-pages/:id", deleteStatusPage)

	// Public status (no auth)
	v1.GET("/status/services", getPublicStatus)
	v1.GET("/status/:slug", getStatusBySlug)

	return e
}

// AttachWebRoot 挂载前端静态产物到根路径 /，并为 SPA 路由（client-side router）
// 提供 fallback：任何非 API、非 /healthz 的 404 都回到 index.html。
// 传入目录不存在则静默跳过（纯 API 部署场景）。
func AttachWebRoot(e *echo.Echo, dir string) {
	if dir == "" {
		return
	}
	abs, err := filepath.Abs(dir)
	if err != nil {
		return
	}
	if info, err := os.Stat(abs); err != nil || !info.IsDir() {
		return
	}
	indexPath := filepath.Join(abs, "index.html")

	// 把 Static 作为 middleware 挂到根，命中磁盘文件直接服务
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   abs,
		Index:  "index.html",
		HTML5:  false, // 我们自己处理 fallback，避免吞掉 API 404
		Browse: false,
	}))

	// SPA fallback: 非 API / 非 /healthz 的路径没有对应文件时返回 index.html
	e.Any("/*", func(c echo.Context) error {
		p := c.Request().URL.Path
		if strings.HasPrefix(p, "/api/") || p == "/healthz" || p == "/metrics" {
			return echo.ErrNotFound
		}
		return c.File(indexPath)
	})
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

func startMaintenance(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Reason      string   `json:"reason"`
		EndAt       *string  `json:"end_at"`
		NotifyUsers []string `json:"notify_users"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "invalid request body"},
		})
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"service_id":   id,
			"maintenance":  true,
			"reason":       req.Reason,
			"end_at":       req.EndAt,
			"notify_users": req.NotifyUsers,
			"start_at":     time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func endMaintenance(c echo.Context) error {
	id := c.Param("id")
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"service_id":  id,
			"maintenance": false,
			"ended_at":    time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func getMaintenanceHistory(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func listStatusPages(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func createStatusPage(c echo.Context) error {
	var req struct {
		Name       string   `json:"name"`
		Slug       string   `json:"slug"`
		ServiceIDs []string `json:"service_ids"`
	}
	if err := c.Bind(&req); err != nil || req.Name == "" || req.Slug == "" {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "name and slug are required"},
		})
	}
	return c.JSON(http.StatusCreated, map[string]any{
		"data": map[string]any{
			"id":          "sp-" + req.Slug,
			"name":        req.Name,
			"slug":        req.Slug,
			"service_ids": req.ServiceIDs,
			"created_at":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func updateStatusPage(c echo.Context) error {
	id := c.Param("id")
	var req struct {
		Name       string   `json:"name"`
		Slug       string   `json:"slug"`
		ServiceIDs []string `json:"service_ids"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "invalid request body"},
		})
	}
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"id":          id,
			"name":        req.Name,
			"slug":        req.Slug,
			"service_ids": req.ServiceIDs,
			"updated_at":  time.Now().UTC().Format(time.RFC3339),
		},
	})
}

func deleteStatusPage(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": map[string]string{"status": "deleted"}})
}

func getPublicStatus(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"data": []any{}, "total": 0})
}

func getStatusBySlug(c echo.Context) error {
	slug := c.Param("slug")
	return c.JSON(http.StatusOK, map[string]any{
		"data": map[string]any{
			"slug":     slug,
			"services": []any{},
		},
	})
}

func testWebhook(c echo.Context) error {
	var req struct {
		URL  string `json:"url"`
		Body string `json:"body"`
	}
	if err := c.Bind(&req); err != nil || req.URL == "" {
		return c.JSON(http.StatusBadRequest, map[string]any{
			"error": map[string]string{"code": "INVALID_REQUEST", "message": "url is required"},
		})
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(req.URL, "application/json", bytes.NewBufferString(req.Body))
	if err != nil {
		return c.JSON(http.StatusOK, map[string]any{
			"success":    false,
			"error":      err.Error(),
			"status_code": 0,
		})
	}
	defer resp.Body.Close()
	// Read up to 1KB of response body for debugging
	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))

	return c.JSON(http.StatusOK, map[string]any{
		"success":       resp.StatusCode == http.StatusOK,
		"status_code":   resp.StatusCode,
		"response_body": string(bodyBytes),
	})
}
