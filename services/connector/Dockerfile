# Multi-stage build for DERP Data Connector Service
# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o connector .

# Stage 2: Runtime (distroless for minimal attack surface)
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /build/connector /connector

USER nonroot:nonroot
EXPOSE 8081

ENTRYPOINT ["/connector"]
