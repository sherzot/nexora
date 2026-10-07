// Package workflow exposes identity contracts owned by NEXORA workflow coordination.
// It implements no subsystem behavior. Identity is not authority.
package workflow

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// WorkflowID identifies a logical Workflow, never permission or a security principal.
// Its zero value is unset. The private payload prevents unchecked construction.
type WorkflowID struct{ value [16]byte }

// ParseWorkflowID accepts only the owner-specific prefix and 32 lowercase hex digits.
// This internal representation is not a provider ID or a frozen external API.
func ParseWorkflowID(text string) (WorkflowID, error) {
	const prefix = "workflow_"
	var id WorkflowID
	if len(text) != len(prefix)+32 || !strings.HasPrefix(text, prefix) {
		return id, errors.New("invalid logical Workflow identity shape")
	}
	payload := text[len(prefix):]
	for _, c := range payload {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return id, errors.New("logical Workflow identity requires lowercase hexadecimal")
		}
	}
	if _, err := hex.Decode(id.value[:], []byte(payload)); err != nil {
		return WorkflowID{}, errors.New("invalid logical Workflow identity payload")
	}
	if id.IsZero() {
		return WorkflowID{}, errors.New("logical Workflow identity must not be zero")
	}
	return id, nil
}

func (id WorkflowID) IsZero() bool { return id.value == [16]byte{} }

func (id WorkflowID) String() string {
	if id.IsZero() {
		return ""
	}
	return "workflow_" + hex.EncodeToString(id.value[:])
}

func (id WorkflowID) MarshalText() ([]byte, error) {
	if id.IsZero() {
		return nil, errors.New("cannot serialize unset logical Workflow identity")
	}
	return []byte(id.String()), nil
}

// UnmarshalText replaces the receiver only after successful validation.
func (id *WorkflowID) UnmarshalText(text []byte) error {
	if id == nil {
		return errors.New("nil WorkflowID receiver")
	}
	parsed, err := ParseWorkflowID(string(text))
	if err != nil {
		return err
	}
	*id = parsed
	return nil
}

func (id WorkflowID) MarshalJSON() ([]byte, error) {
	text, err := id.MarshalText()
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(text))
}

func (id *WorkflowID) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	// null becomes empty here and is rejected, never interpreted as a valid ID.
	return id.UnmarshalText([]byte(text))
}
