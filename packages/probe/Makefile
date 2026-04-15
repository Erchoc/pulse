APP_NAME := pulse-probe
BUILD_DIR := ../../dist

.PHONY: dev build test clean

dev:
	go run ./cmd/pulse-probe --token dev-test

build:
	CGO_ENABLED=0 go build -o $(BUILD_DIR)/$(APP_NAME) ./cmd/pulse-probe

test:
	go test -v -count=1 ./... 2>&1 | tee ../../test-reports/probe.txt

clean:
	rm -f $(BUILD_DIR)/$(APP_NAME)
