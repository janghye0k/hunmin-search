# Model Selection Policy

## Default

Use Sonnet 4.6 by default.

Sonnet is preferred for:

- Component bug fixes
- UI fixes
- Small feature additions
- Unit test creation
- Integration test creation
- Test maintenance
- TypeScript fixes
- Styling updates
- Configuration changes
- Documentation updates
- Refactoring limited to a small number of files

Examples:

- Fix a React component bug
- Add Vitest/Jest test coverage
- Update Tailwind styles
- Fix TypeScript errors
- Modify a single feature implementation

---

## Use Opus For

Use Opus 4.6 when tasks require broad context, planning, or architecture-level reasoning.

Examples:

- Multi-file refactoring
- Cross-module refactoring
- Large-scale codebase analysis
- Architecture design
- Technical planning
- Database design
- State management redesign
- Framework migration
- Performance investigations spanning multiple systems
- Root-cause analysis involving many files
- Repository-wide changes

---

## Escalation Rules

Before making changes, estimate the scope.

Escalate to Opus if ANY of the following are true:

- More than 3 files are expected to require modification
- The task requires understanding multiple modules
- The task requires architectural decisions
- The task requires repository-wide analysis
- Multiple implementation approaches must be evaluated
- A detailed implementation plan is required before coding

---

## Required Behavior

When a task matches the Opus criteria:

1. Do not begin implementation directly.
2. Do not modify files yourself.
3. Delegate the entire task to an Opus subagent using the Agent tool with `model: "opus"`.
4. Brief the subagent fully: include the user's request, relevant file paths, and all context needed.
5. Return the subagent's result to the user.

Example delegation:

```
Agent({
  description: "Architecture-level task requiring Opus",
  model: "claude-opus-4-6",
  prompt: "<full task description with context>"
})
```

Do NOT stop and ask the user to switch models manually. Delegate automatically.

---

## Decision Priority

1. If the task is a bug fix, test-writing task, or isolated feature change:
   - Use Sonnet.

2. If the task requires planning, architecture, or repository-wide understanding:
   - Use Opus.

3. If uncertain:
   - Prefer escalation to Opus rather than proceeding.
