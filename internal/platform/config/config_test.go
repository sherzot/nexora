package config

import (
	"strings"
	"testing"
	"time"
)

func lookup(values map[string]string) func(string) (string, bool) {
	return func(key string) (string, bool) { value, ok := values[key]; return value, ok }
}

func TestLoadDefaults(t *testing.T) {
	cfg, err := Load(lookup(nil))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.ListenAddress != "127.0.0.1:8080" || cfg.ShutdownTimeout != 10*time.Second {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadOverrides(t *testing.T) {
	for _, address := range []string{"127.0.0.1:9000", "[::1]:9000", ":9000", "0.0.0.0:65535"} {
		t.Run(address, func(t *testing.T) {
			cfg, err := Load(lookup(map[string]string{"NEXORA_LISTEN_ADDRESS": address, "NEXORA_SHUTDOWN_TIMEOUT": "250ms"}))
			if err != nil {
				t.Fatal(err)
			}
			if cfg.ListenAddress != address || cfg.ShutdownTimeout != 250*time.Millisecond {
				t.Fatalf("override lost: %+v", cfg)
			}
		})
	}
}

func TestLoadRejectsInvalidValues(t *testing.T) {
	for _, test := range []struct{ key, value string }{
		{"NEXORA_LISTEN_ADDRESS", ""},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1"},
		{"NEXORA_LISTEN_ADDRESS", "localhost:8080"},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1:0"},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1:65536"},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1:+8080"},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1:http"},
		{"NEXORA_LISTEN_ADDRESS", "127.0.0.1:"},
		{"NEXORA_LISTEN_ADDRESS", " 127.0.0.1:8080"},
		{"NEXORA_SHUTDOWN_TIMEOUT", ""},
		{"NEXORA_SHUTDOWN_TIMEOUT", "0s"},
		{"NEXORA_SHUTDOWN_TIMEOUT", "-1s"},
		{"NEXORA_SHUTDOWN_TIMEOUT", "10"},
		{"NEXORA_SHUTDOWN_TIMEOUT", "999999999999999999999h"},
	} {
		t.Run(test.key+"="+test.value, func(t *testing.T) {
			_, err := Load(lookup(map[string]string{test.key: test.value}))
			if err == nil || !strings.Contains(err.Error(), test.key) {
				t.Fatalf("expected contextual validation error, got %v", err)
			}
		})
	}
}

func TestLoadReadsOnlySupportedVariables(t *testing.T) {
	_, err := Load(func(key string) (string, bool) {
		if key != "NEXORA_LISTEN_ADDRESS" && key != "NEXORA_SHUTDOWN_TIMEOUT" {
			t.Fatalf("unexpected environment access: %s", key)
		}
		return "", false
	})
	if err != nil {
		t.Fatal(err)
	}
}
