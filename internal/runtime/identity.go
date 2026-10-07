// Package runtime exposes identity contracts owned by Agent Runtime.
// It implements no subsystem behavior. Identity is not authority.
package runtime

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// RunID identifies an Agent Run, never permission or a security principal.
// Its zero value is unset. The private payload prevents unchecked construction.
type RunID struct{ value [16]byte }

// ParseRunID accepts only the owner-specific prefix and 32 lowercase hex digits.
// This internal representation is not a provider ID or a frozen external API.
func ParseRunID(text string) (RunID, error) {
	const prefix = "run_"
	var id RunID
	if len(text) != len(prefix)+32 || !strings.HasPrefix(text, prefix) {
		return id, errors.New("invalid Agent Run identity shape")
	}
	payload := text[len(prefix):]
	for _, c := range payload {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return id, errors.New("Agent Run identity requires lowercase hexadecimal")
		}
	}
	if _, err := hex.Decode(id.value[:], []byte(payload)); err != nil {
		return RunID{}, errors.New("invalid Agent Run identity payload")
	}
	if id.IsZero() {
		return RunID{}, errors.New("Agent Run identity must not be zero")
	}
	return id, nil
}

func (id RunID) IsZero() bool { return id.value == [16]byte{} }

func (id RunID) String() string {
	if id.IsZero() {
		return ""
	}
	return "run_" + hex.EncodeToString(id.value[:])
}

func (id RunID) MarshalText() ([]byte, error) {
	if id.IsZero() {
		return nil, errors.New("cannot serialize unset Agent Run identity")
	}
	return []byte(id.String()), nil
}

// UnmarshalText replaces the receiver only after successful validation.
func (id *RunID) UnmarshalText(text []byte) error {
	if id == nil {
		return errors.New("nil RunID receiver")
	}
	parsed, err := ParseRunID(string(text))
	if err != nil {
		return err
	}
	*id = parsed
	return nil
}

func (id RunID) MarshalJSON() ([]byte, error) {
	text, err := id.MarshalText()
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(text))
}

func (id *RunID) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	// null becomes empty here and is rejected, never interpreted as a valid ID.
	return id.UnmarshalText([]byte(text))
}
