APP_NAME := pulse
BUILD_DIR := ../../dist

.PHONY: dev build test clean

dev:
	go run ./cmd/pulse

build:
	CGO_ENABLED=1 go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/pulse

test:
	go test -v -count=1 ./... 2>&1 | tee ../../test-reports/go-server.txt

clean:
	rm -f $(BUILD_DIR)/$(APP_NAME)
