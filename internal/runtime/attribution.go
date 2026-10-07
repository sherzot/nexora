package runtime

import "errors"

// ConfigurationRevisionRef is Runtime's recorded reference to an effective
// configuration revision. Definition management remains authoritative for it.
type ConfigurationRevisionRef struct{ value string }

// AssignmentRevisionRef is Runtime's recorded reference to a task/assignment
// revision. Task coordination remains authoritative for it.
type AssignmentRevisionRef struct{ value string }

func ParseConfigurationRevisionRef(text string) (ConfigurationRevisionRef, error) {
	if !validRevisionReference(text) {
		return ConfigurationRevisionRef{}, errors.New("invalid configuration revision reference")
	}
	return ConfigurationRevisionRef{value: text}, nil
}

func ParseAssignmentRevisionRef(text string) (AssignmentRevisionRef, error) {
	if !validRevisionReference(text) {
		return AssignmentRevisionRef{}, errors.New("invalid assignment revision reference")
	}
	return AssignmentRevisionRef{value: text}, nil
}

// References are bounded opaque tokens, not proof that a revision exists or is
// current. Resolve them with the authoritative owner before actual Run creation.
func validRevisionReference(text string) bool {
	if len(text) == 0 || len(text) > 256 {
		return false
	}
	for _, c := range text {
		if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-' || c == '_' || c == '.' || c == ':' || c == '/' || c == '@') {
			return false
		}
	}
	return true
}

func (r ConfigurationRevisionRef) String() string { return r.value }
func (r AssignmentRevisionRef) String() string    { return r.value }
func (r ConfigurationRevisionRef) IsZero() bool   { return r.value == "" }
func (r AssignmentRevisionRef) IsZero() bool      { return r.value == "" }

// RunConfigurationAttribution is only the frozen configuration/assignment part
// of launch attribution, not a complete Run record. It does not establish that a
// Run exists. Instance, initiator/delegator, scope and other launch references
// still require future owner contracts; no current policy or Approval lives here.
type RunConfigurationAttribution struct {
	run           RunID
	configuration ConfigurationRevisionRef
	assignment    AssignmentRevisionRef
}

func NewRunConfigurationAttribution(run RunID, configuration ConfigurationRevisionRef, assignment AssignmentRevisionRef) (RunConfigurationAttribution, error) {
	if run.IsZero() || configuration.IsZero() || assignment.IsZero() {
		return RunConfigurationAttribution{}, errors.New("run, configuration revision and assignment revision references are required")
	}
	return RunConfigurationAttribution{run: run, configuration: configuration, assignment: assignment}, nil
}

func (a RunConfigurationAttribution) IsZero() bool {
	return a.run.IsZero() || a.configuration.IsZero() || a.assignment.IsZero()
}

func (a RunConfigurationAttribution) RunID() RunID { return a.run }
func (a RunConfigurationAttribution) ConfigurationRevision() ConfigurationRevisionRef {
	return a.configuration
}
func (a RunConfigurationAttribution) AssignmentRevision() AssignmentRevisionRef {
	return a.assignment
}

// Prevent accidental empty-object encoding of private fields. A full attribution
// serialization contract must be defined with the remaining authoritative owners.
func (a RunConfigurationAttribution) MarshalJSON() ([]byte, error) {
	return nil, errors.New("Run configuration attribution JSON contract is not defined")
}

func (a *RunConfigurationAttribution) UnmarshalJSON([]byte) error {
	return errors.New("Run configuration attribution JSON contract is not defined")
}
