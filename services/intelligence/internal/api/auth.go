// Authentication middleware interface for the DERP Intelligence Service.
// Consumed by: router.go (middleware chain)
// Depends on: net/http (request context)
//
// Provides an Authenticator interface with a NoopAuthenticator for POC use.
// Replace NoopAuthenticator with JWT/OIDC implementation for production.
package api

import (
	"context"
	"net/http"
)

// Identity represents an authenticated user.
type Identity struct {
	UserID   string   `json:"userId"`
	Roles    []string `json:"roles"`
	MemberID string   `json:"memberId,omitempty"`
}

// Authenticator verifies request identity.
type Authenticator interface {
	Authenticate(r *http.Request) (*Identity, error)
}

// NoopAuthenticator always returns a system identity. Used during POC.
type NoopAuthenticator struct{}

// Authenticate returns a fixed system identity — no real auth in POC mode.
func (n *NoopAuthenticator) Authenticate(r *http.Request) (*Identity, error) {
	return &Identity{
		UserID: "NOUI_SYSTEM",
		Roles:  []string{"system"},
	}, nil
}

// DefaultAuthenticator returns the POC authenticator (noop).
func DefaultAuthenticator() Authenticator {
	return &NoopAuthenticator{}
}

type identityKey struct{}

// authMiddleware injects Identity into the request context.
func authMiddleware(auth Authenticator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			identity, err := auth.Authenticate(r)
			if err != nil {
				WriteError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication failed")
				return
			}
			ctx := context.WithValue(r.Context(), identityKey{}, identity)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// IdentityFromContext retrieves the authenticated Identity from request context.
func IdentityFromContext(ctx context.Context) *Identity {
	id, _ := ctx.Value(identityKey{}).(*Identity)
	return id
}
