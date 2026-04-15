FROM golang:1.23-alpine AS builder

RUN apk add --no-cache gcc musl-dev nodejs npm

WORKDIR /app

# Install pnpm and build frontend
RUN npm install -g pnpm@10.12.4
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/web/package.json ./packages/web/
RUN pnpm install --frozen-lockfile

COPY packages/web/ ./packages/web/
RUN pnpm --filter @pulse/web build

# Build Go server
COPY packages/server/ ./packages/server/
RUN cd packages/server && CGO_ENABLED=1 go build -o /app/pulse ./cmd/pulse

# --- Runtime ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates
COPY --from=builder /app/pulse /usr/local/bin/pulse
COPY --from=builder /app/packages/web/dist /srv/web

EXPOSE 8080

CMD ["pulse", "--port", "8080"]
