// Package modelconsole serves a developer-only, loopback text-probe UI.
// Its request token is browser CSRF protection, not NEXORA identity/authority.
package modelconsole

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/subtle"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"log/slog"
	"mime"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strconv"
	"strings"
	"sync/atomic"
	"time"
	"unicode/utf8"

	"github.com/sherzot/nexora/internal/modelprobe"
)

//go:embed ui.html
var ui []byte

const RequestTimeout = 60 * time.Second
const maxBodyBytes = 32768

type Server struct {
	provider                   modelprobe.Provider
	origin, host, token, nonce string
	page                       []byte
	logger                     *slog.Logger
	busy                       atomic.Bool
}

func New(provider modelprobe.Provider, origin, modelLabel string, logger *slog.Logger) (*Server, error) {
	u, err := url.Parse(origin)
	if err != nil || u == nil || u.Scheme != "http" || u.Hostname() != "127.0.0.1" || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" || u.Opaque != "" || origin != "http://"+u.Host {
		return nil, errors.New("console origin must be an exact HTTP IPv4 loopback origin")
	}
	port, err := strconv.Atoi(u.Port())
	if err != nil || port < 1 || port > 65535 || net.JoinHostPort("127.0.0.1", strconv.Itoa(port)) != u.Host {
		return nil, errors.New("console origin requires a canonical numeric port")
	}
	if provider == nil || logger == nil || strings.TrimSpace(modelLabel) == "" || len(modelLabel) > 128 || !utf8.ValidString(modelLabel) {
		return nil, errors.New("console provider, logger and bounded model label required")
	}
	var entropy [48]byte
	if _, err := rand.Read(entropy[:]); err != nil {
		return nil, fmt.Errorf("console entropy: %w", err)
	}
	s := &Server{provider: provider, origin: origin, host: u.Host, token: hex.EncodeToString(entropy[:32]), nonce: hex.EncodeToString(entropy[32:]), logger: logger}
	page := strings.ReplaceAll(string(ui), "__NONCE__", s.nonce)
	page = strings.ReplaceAll(page, "__TOKEN__", s.token)
	page = strings.ReplaceAll(page, "__MODEL_LABEL__", html.EscapeString(modelLabel))
	page = strings.ReplaceAll(page, "__MAX_PROMPT_BYTES__", strconv.Itoa(modelprobe.MaxPromptBytes))
	s.page = []byte(page)
	return s, nil
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'nonce-"+s.nonce+"'; style-src 'nonce-"+s.nonce+"'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'")
	remote, _, err := net.SplitHostPort(r.RemoteAddr)
	ip, ipErr := netip.ParseAddr(remote)
	if r.Host != s.host || err != nil || ipErr != nil || ip.String() != "127.0.0.1" || r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		s.fail(w, http.StatusForbidden, "Loopback origin required.")
		return
	}
	if r.URL.RawQuery != "" {
		s.fail(w, http.StatusBadRequest, "Query parameters are not supported.")
		return
	}
	switch r.URL.Path {
	case "/":
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", "GET")
			s.fail(w, http.StatusMethodNotAllowed, "Use GET.")
			return
		}
		if origin := r.Header.Get("Origin"); origin != "" && origin != s.origin {
			s.fail(w, http.StatusForbidden, "Origin rejected.")
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if _, err := w.Write(s.page); err != nil {
			s.logger.Warn("console page write failed", "error", err)
		}
	case "/api/probe":
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST")
			s.fail(w, http.StatusMethodNotAllowed, "Use POST.")
			return
		}
		if r.Header.Get("Origin") != s.origin || subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Nexora-Probe-Token")), []byte(s.token)) != 1 {
			s.fail(w, http.StatusForbidden, "Request origin/token rejected.")
			return
		}
		s.probe(w, r)
	default:
		s.fail(w, http.StatusNotFound, "Not found.")
	}
}

func (s *Server) probe(w http.ResponseWriter, r *http.Request) {
	contentType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || contentType != "application/json" {
		s.fail(w, http.StatusUnsupportedMediaType, "Use application/json.")
		return
	}
	if r.ContentLength > maxBodyBytes {
		s.fail(w, http.StatusRequestEntityTooLarge, "Request is too large.")
		return
	}
	data, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxBodyBytes))
	if err != nil {
		s.fail(w, http.StatusRequestEntityTooLarge, "Request body could not be read within the limit.")
		return
	}
	if !utf8.Valid(data) {
		s.fail(w, http.StatusBadRequest, "UTF-8 JSON required.")
		return
	}
	var input struct {
		Prompt string `json:"prompt"`
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&input) != nil || decoder.Decode(&struct{}{}) != io.EOF || modelprobe.ValidatePrompt(input.Prompt) != nil {
		s.fail(w, http.StatusBadRequest, "Supply only a nonblank prompt of at most 4096 UTF-8 bytes.")
		return
	}
	if !s.busy.CompareAndSwap(false, true) {
		s.fail(w, http.StatusTooManyRequests, "Another local request is active. Wait before sending again.")
		return
	}
	defer s.busy.Store(false)
	ctx, cancel := context.WithTimeout(r.Context(), RequestTimeout)
	defer cancel()
	result, err := modelprobe.Probe(ctx, s.provider, input.Prompt)
	if err != nil {
		switch {
		case errors.Is(err, context.Canceled):
			s.fail(w, http.StatusRequestTimeout, "Client canceled waiting; backend termination is not confirmed.")
		case errors.Is(err, context.DeadlineExceeded):
			s.fail(w, http.StatusGatewayTimeout, "Local request exceeded the 60-second deadline.")
		default:
			s.logger.Warn("console probe failed", "kind", "provider failure")
			s.fail(w, http.StatusServiceUnavailable, "Local model unavailable or returned an invalid response. Check its setup using the CLI.")
		}
		return
	}
	s.json(w, http.StatusOK, struct {
		Result modelprobe.Result `json:"result"`
	}{result})
}

func (s *Server) fail(w http.ResponseWriter, status int, message string) {
	s.json(w, status, struct {
		Error string `json:"error"`
	}{message})
}
func (s *Server) json(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		s.logger.Warn("console response write failed", "error", err)
	}
}
