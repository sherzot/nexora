// Package architecture contains test-only fitness checks for implemented boundaries.
package architecture

import (
	"go/parser"
	"go/token"
	"io/fs"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
)

func TestImplementedDependencyDirection(t *testing.T) {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot locate architecture test")
	}
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "../.."))
	command := exec.Command("go", "list", "std")
	command.Dir = root
	output, err := command.Output()
	if err != nil {
		t.Fatal(err)
	}
	standard := make(map[string]bool)
	for _, path := range strings.Fields(string(output)) {
		standard[path] = true
	}
	const module = "github.com/sherzot/nexora/"
	// Only the executable composes these two independent technical packages.
	allowed := map[string]map[string]bool{
		"cmd/nexora": {
			module + "internal/platform/config":     true,
			module + "internal/platform/httpserver": true,
		},
		"internal/platform/config":     {},
		"internal/platform/httpserver": {},
		"internal/architecture":        {},
		"internal/runtime":             {},
		"internal/workflow":            {},
		"internal/tool":                {},
		"internal/execution":           {},
		"internal/approval":            {},
	}
	contracts := map[string]bool{
		"internal/runtime": true, "internal/workflow": true, "internal/tool": true,
		"internal/execution": true, "internal/approval": true,
	}
	// Contract packages need only local validation/codecs, not HTTP, process,
	// persistence or provider mechanisms, even when available in the standard library.
	contractStandard := map[string]bool{
		"encoding/hex": true, "encoding/json": true, "errors": true,
		"strings": true, "testing": true,
	}
	err = filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() && entry.Name() == ".git" {
			return filepath.SkipDir
		}
		if entry.IsDir() || !strings.HasSuffix(path, ".go") {
			return nil
		}
		relative, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		owner := filepath.ToSlash(filepath.Dir(relative))
		imports, known := allowed[owner]
		if !known {
			t.Errorf("%s: new package requires explicit ownership/dependency review", relative)
		}
		parsed, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
		if err != nil {
			return err
		}
		for _, imported := range parsed.Imports {
			name, err := strconv.Unquote(imported.Path.Value)
			if err != nil {
				return err
			}
			if !standard[name] && !imports[name] {
				t.Errorf("%s: forbidden dependency %s", relative, name)
			}
			if contracts[owner] && !contractStandard[name] {
				t.Errorf("%s: identity contract depends on an unauthorized mechanism %s", relative, name)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
