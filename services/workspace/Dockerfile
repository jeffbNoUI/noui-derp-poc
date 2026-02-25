# Multi-stage build for DERP Workspace Composition Service
# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /build

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o workspace .

# Stage 2: Runtime (distroless for minimal attack surface)
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /build/workspace /workspace

USER nonroot:nonroot
EXPOSE 8083

ENTRYPOINT ["/workspace"]
