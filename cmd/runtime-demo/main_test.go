package main

import (
	"bytes"
	"io"
	"strings"
	"testing"
)

const expectedTranscript = `Local Runtime demo — synthetic fixtures; no operational creation, authorization, commit, persistence or dispatch.
Created: state=Created revision=1 effects=Unknown final-outcome=unset
Prepared enqueue: candidate=Queued proposed-revision=2 predecessor=Created/1 unchanged
Local value selection only; not operational queue admission or execution.
Prepared start: candidate=Running proposed-revision=3 predecessor=Queued/2 unchanged
Illegal start from Created/1: rejected ErrIllegalTransition; zero candidate; predecessor unchanged
Prepared finish: candidate=Finished proposed-revision=4 outcome=Succeeded effects=Unknown (synthetic local report only)
Terminal stop from Finished/4: rejected ErrTerminalMutation and ErrIllegalTransition; zero candidate; predecessor unchanged
Competing preparations from Running/3: finish=Finished/4 stop=Running/4 stop-intent=UserCancellation; both prepared; no exclusivity or winner
`

func TestDemoTranscript(t *testing.T) {
	var out, diagnostic bytes.Buffer
	if code := execute(nil, &out, &diagnostic); code != 0 || diagnostic.Len() != 0 {
		t.Fatalf("exit %d; diagnostics %q", code, diagnostic.String())
	}
	if out.String() != expectedTranscript {
		t.Fatalf("unexpected transcript:\n%s", out.String())
	}
}

func TestDemoDeterministic(t *testing.T) {
	var first, second bytes.Buffer
	if err := demonstrate(&first); err != nil {
		t.Fatal(err)
	}
	if err := demonstrate(&second); err != nil {
		t.Fatal(err)
	}
	if first.String() != second.String() {
		t.Fatal("repeated demonstration changed output")
	}
}

func TestDemoRejectsArguments(t *testing.T) {
	var out, diagnostic bytes.Buffer
	if code := execute([]string{"--run-id=untrusted"}, &out, &diagnostic); code != 2 || out.Len() != 0 || !strings.Contains(diagnostic.String(), "no arguments") {
		t.Fatalf("unexpected usage result: %d, %q, %q", code, out.String(), diagnostic.String())
	}
}

type failingWriter struct{}

func (failingWriter) Write([]byte) (int, error) { return 0, io.ErrClosedPipe }

func TestDemoReportsOutputFailure(t *testing.T) {
	var diagnostic bytes.Buffer
	if code := execute(nil, failingWriter{}, &diagnostic); code != 1 || !strings.Contains(diagnostic.String(), io.ErrClosedPipe.Error()) {
		t.Fatalf("output failure concealed: %d, %q", code, diagnostic.String())
	}
}

func TestScenarioTranscripts(t *testing.T) {
	cases := []struct{ selector, expected string }{
		{"--scenario=wait-resume", "Synthetic local values only; no operational acceptance, queue admission, execution or authoritative commit.\n" +
			"wait-resume: Running/3 -> Waiting/4 reason=ExternalInput -> Queued/5 -> Running/6\n" +
			"Categorical wait cleared by requeue; predecessors unchanged; no actual dependency resolution.\n"},
		{"--scenario=stop", "Synthetic local values only; no operational acceptance, queue admission, execution or authoritative commit.\n" +
			"stop: Running/3 -> Running/4 stop-intent=UserCancellation; outcome unset; effects=Unknown\n" +
			"Advancement rejected: ErrStopRequested; zero candidate; predecessors unchanged.\n" +
			"Separate finish: Finished/5 outcome=Cancelled effects=Unknown; no termination, rollback or external-effect evidence.\n"},
		{"--scenario=revision-guards", "Synthetic local values only; no operational acceptance, queue admission, execution or authoritative commit.\n" +
			"revision-guards: identity mismatch rejected ErrRunIdentityMismatch; zero candidate.\n" +
			"Expected revision mismatch rejected ErrExpectedRevisionMismatch; zero candidate.\n" +
			"Revision overflow rejected ErrRevisionOverflow; zero candidate; no wrapping.\n" +
			"All predecessors unchanged; checks concern supplied snapshots only.\n"},
	}
	for _, tc := range cases {
		t.Run(tc.selector, func(t *testing.T) {
			for attempt := 0; attempt < 2; attempt++ {
				var out, diagnostic bytes.Buffer
				code := execute([]string{tc.selector}, &out, &diagnostic)
				if code != 0 || diagnostic.Len() != 0 || out.String() != tc.expected {
					t.Fatalf("attempt %d: exit %d; diagnostics %q; transcript %q", attempt, code, diagnostic.String(), out.String())
				}
			}
		})
	}
}

func TestScenarioRejectsMalformedArguments(t *testing.T) {
	for _, args := range [][]string{
		{"--scenario=unknown"}, {"--scenario="}, {"--scenario", "stop"},
		{"--scenario=stop", "--scenario=stop"}, {"--scenario=stop", "extra"},
		{"--scenario=STOP"}, {"--scenario=stop "}, {"--help"}, {""},
	} {
		var out, diagnostic bytes.Buffer
		if code := execute(args, &out, &diagnostic); code != 2 || out.Len() != 0 || !strings.Contains(diagnostic.String(), "usage:") {
			t.Fatalf("arguments %q: exit %d; output %q; diagnostics %q", args, code, out.String(), diagnostic.String())
		}
	}
}

// A partial write is a failure even after some diagnostic transcript was emitted.
type partialFailingWriter struct{}

func (partialFailingWriter) Write(p []byte) (int, error) {
	return len(p) / 2, io.ErrClosedPipe
}

func TestScenarioOutputFailures(t *testing.T) {
	for _, args := range [][]string{nil, {"--scenario=wait-resume"}, {"--scenario=stop"}, {"--scenario=revision-guards"}} {
		for _, writer := range []io.Writer{failingWriter{}, partialFailingWriter{}} {
			var diagnostic bytes.Buffer
			if code := execute(args, writer, &diagnostic); code != 1 || !strings.Contains(diagnostic.String(), io.ErrClosedPipe.Error()) {
				t.Fatalf("arguments %q, writer %T: exit %d; diagnostics %q", args, writer, code, diagnostic.String())
			}
		}
	}
}
