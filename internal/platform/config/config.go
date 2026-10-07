// Package config owns only the executable's process configuration.
package config

import (
	"fmt"
	"net"
	"net/netip"
	"strconv"
	"time"
)

type Config struct {
	ListenAddress   string
	ShutdownTimeout time.Duration
}

// Load reads only the two supported variables. An explicitly empty value is invalid.
func Load(lookup func(string) (string, bool)) (Config, error) {
	cfg := Config{ListenAddress: "127.0.0.1:8080", ShutdownTimeout: 10 * time.Second}
	if value, ok := lookup("NEXORA_LISTEN_ADDRESS"); ok {
		cfg.ListenAddress = value
	}
	host, port, err := net.SplitHostPort(cfg.ListenAddress)
	if err != nil {
		return Config{}, fmt.Errorf("NEXORA_LISTEN_ADDRESS must be an IP address and numeric port")
	}
	if host != "" {
		if _, err := netip.ParseAddr(host); err != nil {
			return Config{}, fmt.Errorf("NEXORA_LISTEN_ADDRESS host must be a literal IP address")
		}
	}
	for _, c := range port {
		if c < '0' || c > '9' {
			return Config{}, fmt.Errorf("NEXORA_LISTEN_ADDRESS port must be numeric")
		}
	}
	number, err := strconv.Atoi(port)
	if err != nil || number < 1 || number > 65535 {
		return Config{}, fmt.Errorf("NEXORA_LISTEN_ADDRESS port must be between 1 and 65535")
	}
	if value, ok := lookup("NEXORA_SHUTDOWN_TIMEOUT"); ok {
		timeout, err := time.ParseDuration(value)
		if err != nil || timeout <= 0 {
			return Config{}, fmt.Errorf("NEXORA_SHUTDOWN_TIMEOUT must be a positive Go duration")
		}
		cfg.ShutdownTimeout = timeout
	}
	return cfg, nil
}
