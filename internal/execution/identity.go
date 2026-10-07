// Package execution exposes identity contracts owned by Execution owner.
// It implements no subsystem behavior. Identity is not authority.
package execution

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// JobID identifies a logical Execution Job, never permission or a security principal.
// Its zero value is unset. The private payload prevents unchecked construction.
type JobID struct{ value [16]byte }

// ParseJobID accepts only the owner-specific prefix and 32 lowercase hex digits.
// This internal representation is not a provider ID or a frozen external API.
func ParseJobID(text string) (JobID, error) {
	const prefix = "job_"
	var id JobID
	if len(text) != len(prefix)+32 || !strings.HasPrefix(text, prefix) {
		return id, errors.New("invalid logical Execution Job identity shape")
	}
	payload := text[len(prefix):]
	for _, c := range payload {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return id, errors.New("logical Execution Job identity requires lowercase hexadecimal")
		}
	}
	if _, err := hex.Decode(id.value[:], []byte(payload)); err != nil {
		return JobID{}, errors.New("invalid logical Execution Job identity payload")
	}
	if id.IsZero() {
		return JobID{}, errors.New("logical Execution Job identity must not be zero")
	}
	return id, nil
}

func (id JobID) IsZero() bool { return id.value == [16]byte{} }

func (id JobID) String() string {
	if id.IsZero() {
		return ""
	}
	return "job_" + hex.EncodeToString(id.value[:])
}

func (id JobID) MarshalText() ([]byte, error) {
	if id.IsZero() {
		return nil, errors.New("cannot serialize unset logical Execution Job identity")
	}
	return []byte(id.String()), nil
}

// UnmarshalText replaces the receiver only after successful validation.
func (id *JobID) UnmarshalText(text []byte) error {
	if id == nil {
		return errors.New("nil JobID receiver")
	}
	parsed, err := ParseJobID(string(text))
	if err != nil {
		return err
	}
	*id = parsed
	return nil
}

func (id JobID) MarshalJSON() ([]byte, error) {
	text, err := id.MarshalText()
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(text))
}

func (id *JobID) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	// null becomes empty here and is rejected, never interpreted as a valid ID.
	return id.UnmarshalText([]byte(text))
}
