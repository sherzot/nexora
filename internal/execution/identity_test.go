package execution

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestJobIDContract(t *testing.T) {
	const valid = "job_0123456789abcdef0123456789abcdef"
	id, err := ParseJobID(valid)
	if err != nil {
		t.Fatal(err)
	}
	if id.IsZero() || id.String() != valid {
		t.Fatal("valid identity lost its canonical representation")
	}
	text, err := id.MarshalText()
	if err != nil || string(text) != valid {
		t.Fatalf("text representation: %q %v", text, err)
	}
	var roundTrip JobID
	if err := roundTrip.UnmarshalText(text); err != nil || roundTrip != id {
		t.Fatalf("text round trip: %v", err)
	}
	data, err := json.Marshal(id)
	if err != nil || string(data) != "\""+valid+"\"" {
		t.Fatalf("JSON representation: %s %v", data, err)
	}
	if err := json.Unmarshal(data, &roundTrip); err != nil || roundTrip != id {
		t.Fatalf("JSON round trip: %v", err)
	}
	for _, malformed := range []string{"", "job_", "job_" + strings.Repeat("0", 32), valid + "0", " " + valid, valid + " ", "job_0123456789ABCDEF0123456789abcdef", "job_g123456789abcdef0123456789abcdef", "foreign_0123456789abcdef0123456789abcdef"} {
		if parsed, err := ParseJobID(malformed); err == nil || !parsed.IsZero() {
			t.Fatalf("accepted malformed input %q", malformed)
		}
		unchanged := id
		if err := unchanged.UnmarshalText([]byte(malformed)); err == nil || unchanged != id {
			t.Fatal("invalid text modified the existing identity")
		}
	}
	for _, invalidJSON := range []string{"null", "\"\"", "42", "{}", "[]", "\"foreign_0123456789abcdef0123456789abcdef\"", "\"unterminated"} {
		unchanged := id
		if err := json.Unmarshal([]byte(invalidJSON), &unchanged); err == nil || unchanged != id {
			t.Fatalf("invalid JSON modified identity: %s", invalidJSON)
		}
	}
	var unset JobID
	if !unset.IsZero() || unset.String() != "" {
		t.Fatal("unset identity looks valid")
	}
	if _, err := unset.MarshalText(); err == nil {
		t.Fatal("unset text serialization succeeded")
	}
	if _, err := json.Marshal(unset); err == nil {
		t.Fatal("unset JSON serialization succeeded")
	}
	var missing *JobID
	if err := missing.UnmarshalText([]byte(valid)); err == nil {
		t.Fatal("nil receiver accepted")
	}
}

func FuzzParseJobID(f *testing.F) {
	for _, seed := range []string{"", "job_0123456789abcdef0123456789abcdef", "job_" + strings.Repeat("0", 32), "foreign_0123456789abcdef0123456789abcdef", "\x00"} {
		f.Add(seed)
	}
	f.Fuzz(func(t *testing.T, text string) {
		id, err := ParseJobID(text)
		if err != nil {
			if !id.IsZero() {
				t.Fatal("failed parse returned a usable identity")
			}
			return
		}
		if id.IsZero() || id.String() != text {
			t.Fatal("accepted text is not canonical")
		}
		reparsed, err := ParseJobID(id.String())
		if err != nil || reparsed != id {
			t.Fatal("canonical identity does not round trip")
		}
	})
}
