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
