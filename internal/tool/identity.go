// Package tool exposes identity contracts owned by Tool operation owner.
// It implements no subsystem behavior. Identity is not authority.
package tool

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// OperationID identifies a logical Tool Operation, never permission or a security principal.
// Its zero value is unset. The private payload prevents unchecked construction.
type OperationID struct{ value [16]byte }

// ParseOperationID accepts only the owner-specific prefix and 32 lowercase hex digits.
// This internal representation is not a provider ID or a frozen external API.
func ParseOperationID(text string) (OperationID, error) {
	const prefix = "operation_"
	var id OperationID
	if len(text) != len(prefix)+32 || !strings.HasPrefix(text, prefix) {
		return id, errors.New("invalid logical Tool Operation identity shape")
	}
	payload := text[len(prefix):]
	for _, c := range payload {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return id, errors.New("logical Tool Operation identity requires lowercase hexadecimal")
		}
	}
	if _, err := hex.Decode(id.value[:], []byte(payload)); err != nil {
		return OperationID{}, errors.New("invalid logical Tool Operation identity payload")
	}
	if id.IsZero() {
		return OperationID{}, errors.New("logical Tool Operation identity must not be zero")
	}
	return id, nil
}

func (id OperationID) IsZero() bool { return id.value == [16]byte{} }

func (id OperationID) String() string {
	if id.IsZero() {
		return ""
	}
	return "operation_" + hex.EncodeToString(id.value[:])
}

func (id OperationID) MarshalText() ([]byte, error) {
	if id.IsZero() {
		return nil, errors.New("cannot serialize unset logical Tool Operation identity")
	}
	return []byte(id.String()), nil
}

// UnmarshalText replaces the receiver only after successful validation.
func (id *OperationID) UnmarshalText(text []byte) error {
	if id == nil {
		return errors.New("nil OperationID receiver")
	}
	parsed, err := ParseOperationID(string(text))
	if err != nil {
		return err
	}
	*id = parsed
	return nil
}

func (id OperationID) MarshalJSON() ([]byte, error) {
	text, err := id.MarshalText()
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(text))
}

func (id *OperationID) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	// null becomes empty here and is rejected, never interpreted as a valid ID.
	return id.UnmarshalText([]byte(text))
}
