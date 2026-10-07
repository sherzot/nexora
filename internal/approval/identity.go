// Package approval exposes identity contracts owned by Approval owner.
// It implements no subsystem behavior. Identity is not authority.
package approval

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"
)

// RequestID identifies an Approval Request, never permission or a security principal.
// Its zero value is unset. The private payload prevents unchecked construction.
type RequestID struct{ value [16]byte }

// ParseRequestID accepts only the owner-specific prefix and 32 lowercase hex digits.
// This internal representation is not a provider ID or a frozen external API.
func ParseRequestID(text string) (RequestID, error) {
	const prefix = "approval_request_"
	var id RequestID
	if len(text) != len(prefix)+32 || !strings.HasPrefix(text, prefix) {
		return id, errors.New("invalid Approval Request identity shape")
	}
	payload := text[len(prefix):]
	for _, c := range payload {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return id, errors.New("Approval Request identity requires lowercase hexadecimal")
		}
	}
	if _, err := hex.Decode(id.value[:], []byte(payload)); err != nil {
		return RequestID{}, errors.New("invalid Approval Request identity payload")
	}
	if id.IsZero() {
		return RequestID{}, errors.New("Approval Request identity must not be zero")
	}
	return id, nil
}

func (id RequestID) IsZero() bool { return id.value == [16]byte{} }

func (id RequestID) String() string {
	if id.IsZero() {
		return ""
	}
	return "approval_request_" + hex.EncodeToString(id.value[:])
}

func (id RequestID) MarshalText() ([]byte, error) {
	if id.IsZero() {
		return nil, errors.New("cannot serialize unset Approval Request identity")
	}
	return []byte(id.String()), nil
}

// UnmarshalText replaces the receiver only after successful validation.
func (id *RequestID) UnmarshalText(text []byte) error {
	if id == nil {
		return errors.New("nil RequestID receiver")
	}
	parsed, err := ParseRequestID(string(text))
	if err != nil {
		return err
	}
	*id = parsed
	return nil
}

func (id RequestID) MarshalJSON() ([]byte, error) {
	text, err := id.MarshalText()
	if err != nil {
		return nil, err
	}
	return json.Marshal(string(text))
}

func (id *RequestID) UnmarshalJSON(data []byte) error {
	var text string
	if err := json.Unmarshal(data, &text); err != nil {
		return err
	}
	// null becomes empty here and is rejected, never interpreted as a valid ID.
	return id.UnmarshalText([]byte(text))
}
