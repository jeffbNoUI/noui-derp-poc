# Multi-stage build for DERP Intelligence Service
# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o intelligence .

# Stage 2: Runtime (distroless for minimal attack surface)
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /build/intelligence /intelligence

USER nonroot:nonroot
EXPOSE 8082

ENTRYPOINT ["/intelligence"]
