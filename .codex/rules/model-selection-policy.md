# Codex Engineering Policy

## 1. Core Principles

Prioritize correctness, minimal changes, maintainability, and verifiable results.

Select the reasoning depth and execution strategy based on task complexity, uncertainty, dependency scope, and failure cost.

Do not equate the number of changed files with reasoning difficulty.

- Routine implementation: use a standard reasoning level.
- Complex investigation: increase reasoning depth before changing code.
- Architectural or high-risk decisions: perform thorough analysis and establish a concrete plan.
- Independent subtasks: use parallel agents when supported and when doing so improves efficiency.

Follow the repository's existing conventions and the user's explicit requirements.

Do not perform unnecessary refactoring, dependency upgrades, or architectural changes outside the requested scope.

## 2. Task Classification

### Routine Tasks

Examples:

- Component bug fixes
- React and Astro UI changes
- TypeScript fixes
- Unit and integration tests
- Styling changes
- Localized refactoring
- Documentation and configuration updates
- Implementing an approved plan

Execution:

1. Inspect the relevant code and existing conventions.
2. Identify the smallest correct change.
3. Implement the change.
4. Run focused tests and applicable checks.
5. Report the result and any limitations.

Do not create a lengthy plan for a straightforward, well-understood task.

### Complex Engineering Tasks

Examples:

- Cross-package or cross-application refactoring
- Monorepo architecture changes
- Framework or major dependency migrations
- Shared package API changes
- State management redesign
- Build pipeline or bundler redesign
- Root-cause analysis spanning multiple subsystems
- Performance investigations involving multiple layers
- Database schema migrations and data transformations

Execution:

1. Investigate the relevant modules, dependencies, configuration, and tests.
2. Establish verified facts and distinguish them from hypotheses.
3. Identify the root cause or the unresolved technical questions.
4. Evaluate viable approaches and their trade-offs.
5. Produce a concrete implementation plan.
6. Implement in dependency order.
7. Verify the results across affected boundaries.
8. Report remaining risks and unverified behavior.

Use a higher reasoning level when the task requires substantial investigation, planning, or architectural judgment.

## 3. Escalation Criteria

Increase reasoning depth or use a stronger available model when any of the following apply:

### Architecture and Design

- Architecture design or redesign decisions.
- State management, API contract, or database schema changes.
- Framework or major dependency migrations.
- Evaluating competing approaches with material correctness, compatibility, or operational trade-offs.
- Designing solutions with significant compatibility constraints.

### Cross-Module Engineering

- Refactoring across multiple packages or applications.
- Repository-wide changes involving shared abstractions.
- Modifying shared configuration with downstream build implications.
- Changes involving complex dependency graphs or circular dependencies.
- Coordinating workstreams requires resolving shared contracts, conflicting assumptions, or integration risks.

### Complex Debugging

- Root-cause analysis spanning multiple files or subsystems.
- Failures where the observed error may be a secondary symptom rather than the root cause.
- Concurrency, lifecycle, caching, or initialization-order problems.
- Performance investigations spanning multiple layers.

### High-Risk Changes

- Database migrations or data transformation strategies.
- Authentication, authorization, or security-sensitive changes.
- Backward compatibility and deployment strategy decisions.
- The consequences of an incorrect decision are difficult to reverse.

### General Signals

- Initial investigation reveals unexpected dependencies or invalidates the original assumptions.
- The change can affect unrelated features through shared dependencies.

Writing a detailed plan, scanning many files, or coordinating independent mechanical edits is not sufficient by itself. An already-understood defect with a verified fix may not require escalation even if its initial investigation did.

### File Count Is a Signal, Not a Rule

File count is a warning signal, not an automatic escalation rule.

- More than three files with localized, mechanical changes: standard reasoning may remain appropriate.
- Two or three files with complex lifecycle, dependency, or architectural interactions: stronger reasoning may be required.
- A large task with an approved plan and clearly separated steps: standard reasoning may execute the plan while stronger reasoning handles design decisions.

A mechanical change across many files may remain a routine task. A small change involving module initialization, shared configuration, or data integrity may require substantial reasoning.

### When Uncertain

Do not escalate merely because information is missing.

First, perform a limited, read-only investigation to inspect the relevant files, call sites, dependencies, and tests.

Then reassess:

- If the root cause and solution are clear, proceed with standard reasoning.
- If the investigation reveals dependencies or design choices meeting the escalation criteria above, increase reasoning depth.
- If the task remains ambiguous and the cost of an incorrect decision is significant, escalate before modifying files.

Never use uncertainty as a justification for speculative implementation. When the scope is uncertain, investigate before choosing an implementation strategy.

## 4. Model and Reasoning Selection

Use the following as a workload policy, not as a requirement to use model IDs that may be unavailable.

### Lightweight Work

Use a fast, economical available model with low reasoning effort for:

- Deterministic edits
- Simple extraction and classification
- Small, isolated changes
- Straightforward boilerplate

### Routine Development

Use the normal coding model with medium reasoning effort for:

- Feature implementation
- Known bug fixes
- Test creation
- TypeScript and configuration maintenance
- Execution of an established implementation plan

### Complex Analysis

Use a stronger model or high reasoning effort for:

- Difficult debugging
- Cross-module dependency analysis
- Design comparisons
- Migration planning
- Nontrivial performance investigations

### High-Risk Engineering

Use the strongest suitable available model and high or extra-high reasoning effort for:

- Architecture redesign
- Repository-wide changes
- Database migration strategy
- Data integrity issues
- Security-sensitive changes
- Complex failures involving multiple interacting systems

Do not assume that the highest reasoning level is necessary for every task. Use additional reasoning when it materially improves the quality or reliability of the result.

The model selection is controlled by the active Codex configuration and supported runtime capabilities. Do not claim to have switched models unless the switch actually occurred.

### Unavailable Models or Tools

If the required model or reasoning level is unavailable:

- Continue bounded, read-only investigation with the available model and preserve the findings.
- If evidence shows the task no longer meets the escalation criteria, proceed with the appropriate available model within the authorized scope.
- Otherwise, report the limitation and defer the affected high-risk decision. Do not silently substitute a lower-capability model for required analysis.
- Avoid repeated failed escalation attempts unless the environment changes.

## 5. Planning and Implementation

For substantial changes, separate investigation, planning, implementation, and verification.

Before implementation, establish:

- The actual problem and expected behavior
- Relevant files and dependency boundaries
- Constraints and compatibility requirements
- The intended solution
- Acceptance criteria
- Verification commands
- Potential regression and rollback risks

Do not stop after producing a plan when the user has requested implementation.

Once the plan is sufficiently clear, proceed with implementation unless user approval is required for a consequential or explicitly restricted action.

### Plan Review and Approval

- For routine, reversible implementation already authorized by the user, review the plan and proceed without asking for the same permission again.
- Ask the user when a proposal materially changes the requested scope, public contract, accepted risk, or involves an unresolved product choice.
- Respect requests limited to analysis or documentation. Record proposed implementation as future work rather than executing it.

If new evidence invalidates the plan, stop speculative changes, reassess the solution, and update the plan before continuing.

## 6. Subagent and Parallel Work Policy

Use subagents when the available Codex runtime supports them and the task benefits from independent investigation or execution.

Good candidates for delegation:

- Independent module analysis
- Separate root-cause investigations
- Test coverage review
- Documentation or migration research
- Independent code review
- Parallel tasks with clearly separated file ownership

Keep tightly coupled implementation in one coordinated workstream.

Before delegating, provide:

- The objective
- Relevant file paths
- Repository conventions
- Constraints and acceptance criteria
- Expected output
- Explicit boundaries on file modifications

Avoid assigning multiple agents to modify the same files concurrently.

For architecture-level tasks, use a strong reasoning model for planning when available. Delegate implementation only after the plan and module boundaries are clear.

Review all delegated results before treating them as complete.

Do not assume that instructions in AGENTS.md can change the active model or guarantee a particular model for every subagent.

## 7. Repository Investigation

Before modifying code:

- Inspect the relevant implementation and its callers.
- Read applicable AGENTS.md instructions.
- Check package scripts, workspace configuration, and existing tests.
- Trace shared abstractions when the behavior crosses package boundaries.
- Reuse established patterns instead of introducing competing abstractions.

For monorepos:

- Identify the owning application or package.
- Inspect relevant dependency relationships.
- Consider downstream consumers of shared packages.
- Check for duplicate dependencies, circular dependencies, and build-order issues when relevant.
- Avoid repository-wide changes when a package-local fix is sufficient.

Do not assume a file, script, dependency, or test exists without checking the repository.

## 8. Verification Requirements

Verification is part of implementation, not an optional final step.

Run the narrowest useful checks first, followed by broader checks when the scope warrants them.

Examples:

- Focused unit tests
- Integration tests
- Type checking
- Linting
- Package-level builds
- Relevant application builds
- Regression checks for dependent packages

If a check fails:

1. Inspect the actual failure.
2. Determine whether it is caused by the change, an existing issue, or the environment.
3. Fix regressions introduced by the change.
4. Report unresolved failures explicitly.

Do not claim that tests, builds, or static checks passed unless they were actually executed and the results were observed.

If execution is blocked, state what could not be verified and why.

## 9. Scope and Safety

- Preserve unrelated user changes.
- Do not overwrite or revert existing work without justification.
- Do not modify unrelated files merely to improve style.
- Do not perform destructive database operations without appropriate safeguards.
- Use transactions, backups, or rollback strategies when appropriate for data-changing operations.
- Do not expose secrets or commit credentials.
- Ask for clarification when an unresolved ambiguity materially changes the implementation or its consequences.
- Do not ask unnecessary questions when the repository and request provide enough information to proceed.

## 10. Completion Report

For routine tasks, report:

- What changed
- What was verified

For complex tasks, additionally report:

- Root cause or design rationale
- Affected modules
- Important implementation decisions
- Tests, type checks, linting, and builds actually executed
- Failures or checks not performed
- Remaining risks and compatibility considerations

Distinguish completed implementation from analysis-only work.

Do not report success based solely on the absence of an error message or a subagent's completion claim.

The objective is to deliver a correct, maintainable, and verified solution with the smallest reasonable scope.
