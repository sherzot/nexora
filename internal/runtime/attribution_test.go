package runtime

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestFrozenRunConfigurationAttribution(t *testing.T) {
	run, err := ParseRunID("run_0123456789abcdef0123456789abcdef")
	if err != nil {
		t.Fatal(err)
	}
	configuration, err := ParseConfigurationRevisionRef("definition-a:configuration-r1")
	if err != nil {
		t.Fatal(err)
	}
	assignment, err := ParseAssignmentRevisionRef("task-a:assignment-r2")
	if err != nil {
		t.Fatal(err)
	}
	original, err := NewRunConfigurationAttribution(run, configuration, assignment)
	if err != nil {
		t.Fatal(err)
	}
	// Later owner revision references create a different value; earlier attribution
	// remains exactly the recorded revision and is not silently upgraded.
	newConfiguration, err := ParseConfigurationRevisionRef("definition-a:configuration-r3")
	if err != nil {
		t.Fatal(err)
	}
	later, err := NewRunConfigurationAttribution(run, newConfiguration, assignment)
	if err != nil {
		t.Fatal(err)
	}
	if original.IsZero() || original.RunID() != run || original.ConfigurationRevision() != configuration || original.AssignmentRevision() != assignment || later == original {
		t.Fatal("historical revision attribution was lost")
	}
	returnedRun := original.RunID()
	if err := returnedRun.UnmarshalText([]byte("run_1123456789abcdef0123456789abcdef")); err != nil {
		t.Fatal(err)
	}
	if original.RunID() != run {
		t.Fatal("mutating a returned value rewrote historical attribution")
	}
	if _, err := json.Marshal(original); err == nil {
		t.Fatal("undefined attribution JSON silently serialized")
	}
	copy := original
	if err := json.Unmarshal([]byte("{}"), &copy); err == nil || copy != original {
		t.Fatal("undefined JSON changed historical attribution")
	}
	for _, inputs := range []struct {
		run           RunID
		configuration ConfigurationRevisionRef
		assignment    AssignmentRevisionRef
	}{{RunID{}, configuration, assignment}, {run, ConfigurationRevisionRef{}, assignment}, {run, configuration, AssignmentRevisionRef{}}} {
		result, err := NewRunConfigurationAttribution(inputs.run, inputs.configuration, inputs.assignment)
		if err == nil || !result.IsZero() {
			t.Fatal("missing launch reference accepted")
		}
	}
}

func TestRevisionReferenceValidation(t *testing.T) {
	for _, text := range []string{"", "has space", "line\nbreak", "\x00", "日本語", strings.Repeat("r", 257)} {
		if _, err := ParseConfigurationRevisionRef(text); err == nil {
			t.Fatalf("configuration accepted malformed reference %q", text)
		}
		if _, err := ParseAssignmentRevisionRef(text); err == nil {
			t.Fatalf("assignment accepted malformed reference %q", text)
		}
	}
	for _, text := range []string{"owner:object@revision-1", strings.Repeat("r", 256)} {
		configuration, err := ParseConfigurationRevisionRef(text)
		if err != nil || configuration.String() != text || configuration.IsZero() {
			t.Fatalf("configuration reference lost: %v", err)
		}
		assignment, err := ParseAssignmentRevisionRef(text)
		if err != nil || assignment.String() != text || assignment.IsZero() {
			t.Fatalf("assignment reference lost: %v", err)
		}
	}
}
