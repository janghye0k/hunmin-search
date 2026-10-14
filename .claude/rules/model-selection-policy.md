# Model Selection Policy

## 1. Core Principles

Select the model based on **reasoning complexity, uncertainty, scope, dependency depth, and failure cost** — not merely the number of files involved.

Prefer supported Claude Code model aliases. An alias selects the model configured for that family; it does not guarantee the newest released version.

- **Sonnet**: Default model for implementation and routine engineering tasks.
- **Opus**: Complex reasoning, architecture, cross-module analysis, and high-risk changes.
- **Haiku**: Lightweight, well-defined tasks that require minimal reasoning.

Do not hardcode outdated model version IDs unless a specific version is required for compatibility, reproducibility, or controlled evaluation.

Model aliases may resolve differently depending on the provider, account, and Claude Code configuration. Use only models available in the current environment.

Section 5 is the authoritative selection rule. Sections 2–4 provide examples, not automatic escalation triggers. Model selection does not grant permission to modify files or expand the user's requested scope.

---

## 2. Default: Sonnet

Use `sonnet` by default for routine development tasks with a reasonably clear scope and implementation path.

Preferred tasks:

- Component bug fixes
- UI and styling fixes
- Small feature additions
- Unit and integration test creation
- Test maintenance
- TypeScript and lint errors
- Configuration and dependency updates
- Documentation updates
- Refactoring within a limited feature boundary
- Routine code reviews
- Implementing an already-approved plan
- Fixing a known root cause with a clear solution

Examples:

- Fix a React component bug in one feature.
- Add Vitest or Jest coverage for an existing function.
- Update Tailwind styles.
- Correct TypeScript errors caused by a local type mismatch.
- Update an Astro integration with a known, localized defect.
- Implement a previously approved multi-step implementation plan.

Do not escalate solely because a task modifies several files if the changes are mechanical, localized, and follow an established design.

---

## 3. Use Opus for Complex Reasoning

Use `opus` when the criteria in Section 5 require substantial investigation, architectural judgment, or reasoning across interconnected parts of the codebase. The examples below indicate possible complexity; their labels alone do not require escalation.

### 3.1 Architecture and Design

- Architecture design or redesign
- State management redesign
- Framework or major dependency migrations
- Monorepo restructuring
- API contract or database schema design
- Shared package and module boundary changes
- Evaluating competing approaches with material correctness, compatibility, or operational trade-offs
- Designing solutions with significant compatibility constraints

### 3.2 Cross-Module Engineering

- Refactoring across multiple packages or applications
- Repository-wide changes involving shared abstractions
- Changes affecting several independently maintained modules
- Modifying shared configuration with downstream build implications
- Changes involving complex dependency graphs or circular dependencies
- Coordinating changes across frontend, backend, database, and build tooling

### 3.3 Complex Debugging

- Root-cause analysis spanning multiple files or subsystems
- Hydration failures involving SSR, client rendering, and bundling
- Invalid React hook calls involving package boundaries or duplicate React instances
- Build failures involving multiple integrations or plugins
- Performance investigations spanning rendering, state management, and data loading
- Concurrency, lifecycle, caching, or initialization-order problems
- Failures where the observed error may be a secondary symptom rather than the root cause

### 3.4 High-Risk Changes

- Database migrations or data transformation strategies
- Changes that could cause data loss or corruption
- Authentication, authorization, or security-sensitive changes
- Backward compatibility and deployment strategy decisions
- Changes that are difficult to reverse or validate locally

When Section 5 calls for Opus, use it for investigation and decision-making even when the eventual code change is small. Once the cause and solution are verified, routine implementation does not require repeating that analysis.

A small patch can require substantial reasoning when the underlying problem is ambiguous or high-risk.

---

## 4. Use Haiku for Lightweight Tasks

Use `haiku` only when the task is clearly bounded and the consequences of an incorrect result are low.

Suitable tasks:

- Extracting symbols, filenames, or configuration values
- Summarizing a small, specified code section
- Performing repetitive, deterministic edits
- Generating straightforward boilerplate
- Classifying test failures before deeper investigation
- Reviewing a small, isolated change for obvious issues

Do not use Haiku as the primary model for ambiguous root-cause analysis, architectural decisions, risky migrations, or changes requiring extensive contextual reasoning.

If a lightweight task reveals unexpected dependencies or ambiguity, escalate to Sonnet or Opus as appropriate.

---

## 5. Model Selection and Escalation Rules

Before implementation, assess the following dimensions:

1. **Scope**: How many files, packages, and applications are affected?
2. **Dependency depth**: Do changes propagate through shared abstractions or dependent modules?
3. **Uncertainty**: Is the root cause or correct solution known?
4. **Decision complexity**: Are architectural trade-offs or multiple viable solutions involved?
5. **Failure cost**: Could an incorrect change cause data loss, security problems, or widespread regressions?
6. **Verification difficulty**: Can correctness be established through focused tests, or does it require system-level validation?

### Escalate to Opus if any of these conditions apply

- Architectural decisions involve material correctness, compatibility, or operational trade-offs.
- The root cause remains unknown after bounded investigation and evidence points to interacting modules or subsystems.
- Competing approaches require substantial reasoning to assess their consequences.
- Repository-wide analysis requires understanding deep dependencies or predicting nonlocal behavior changes.
- Changes affect shared packages or multiple applications with nontrivial dependencies.
- The task involves a major migration or high-risk data operation.
- Coordinating workstreams requires resolving shared contracts, conflicting assumptions, or integration risks.
- The solution has significant compatibility, deployment, or rollback implications.

Writing a detailed plan, scanning many files, comparing familiar alternatives, or coordinating independent mechanical edits is not sufficient by itself. An already-understood defect with a verified fix may remain on Sonnet even if its initial investigation required Opus.

### File Count Is a Signal, Not an Absolute Rule

Expecting changes in more than three files should trigger a scope review, but it must not automatically force escalation.

- More than three files with localized, mechanical changes: Sonnet may remain appropriate.
- Two or three files with complex lifecycle, dependency, or architectural interactions: Opus may be required.
- A large task with an approved plan and clearly separated implementation steps: Sonnet may execute the plan, while Opus handles design and difficult decisions.

### When Uncertain

Do not escalate merely because information is missing.

First, perform a limited, read-only investigation using the current model to inspect the relevant files, call sites, dependencies, and tests.

Then reassess:

- If the root cause and solution are clear, proceed with Sonnet.
- If the investigation reveals dependencies or design choices meeting the escalation criteria above, use Opus.
- If the task remains ambiguous and the cost of an incorrect decision is significant, escalate to Opus before modifying files.

Never use uncertainty as a justification for speculative implementation.

---

## 6. Reasoning and Delegation Workflow

When a task meets the Opus escalation criteria, complete the reasoning-intensive analysis using Opus before making implementation changes. If the current model is already Opus, analysis may proceed in the main session. Delegate when context isolation or independent review materially improves the work; a separate Opus subagent is not mandatory merely to satisfy model selection.

Selecting a model in this policy does not switch the running session. Use a supported session switch or delegation mechanism, and confirm the actual model from available runtime information. Do not claim that a switch occurred solely because the prompt requested it. Apply Section 6.4 when the model or mechanism is unavailable.

### 6.1 Mandatory Rules

For work meeting the Opus escalation criteria:

1. Complete the required analysis or plan before modifying implementation files.
2. Keep investigation read-only. An analysis-only user request never authorizes subsequent implementation.
3. When delegating, use a supported Opus model setting and the actual tool schema exposed by the environment. Do not assume the example below is an executable API in every host.
4. Include the user request and subsequent corrections, relevant paths, constraints, existing findings, and acceptance criteria.
5. Require confirmed facts, hypotheses, risks, and unresolved decisions to be distinguished.
6. Restrict the analysis agent's tools to read-only capabilities where supported. A prompt alone is not an access restriction; shell tools can write files even when Write and Edit are disabled.
7. Review the findings and plan before proceeding, using the approval rules in Section 6.3.
8. Verify the implementation independently and report unresolved issues. Do not delegate the same analysis again without a new question or evidence gap.

For example, a custom analysis agent can declare the following frontmatter in its agent definition. This policy does not create that agent automatically:

```yaml
---
name: reasoning-analyst
description: Read-only investigation of complex engineering decisions
tools: Read, Grep, Glob
model: opus
---
```

Use the following illustrative invocation only after configuring the agent and adapting the fields to the installed tool schema:

```javascript
Agent({
  description: 'Complex reasoning or architecture task',
  subagent_type: 'reasoning-analyst',
  model: 'opus',
  prompt: `
    User request:
    [Full user request]

    Repository context:
    [Relevant repository paths, modules, dependencies, and constraints]

    Required analysis:
    [Root cause, architecture, trade-offs, or migration strategy]

    Acceptance criteria:
    [Expected behavior and verification requirements]

    This task is analysis only. Do not edit, create, or delete files,
    install dependencies, or run commands with write side effects.
    Return findings and a plan; do not implement that plan.

    Before proposing implementation:
    - Inspect the relevant source and dependencies.
    - Distinguish verified facts from assumptions.
    - Identify risks, compatibility concerns, and affected modules.
    - Provide a concrete implementation plan.
    - Identify appropriate tests and verification commands.

    Do not claim that changes or tests were completed unless they
    were actually performed and their results were observed.
  `,
});
```

This is an invocation template. Adapt the prompt to the actual task instead of copying irrelevant sections into every delegation.

If the invocation does not support a model override, use the configured agent's supported model setting. Check the actual runtime model when available; report any substitution or inability to verify it that affects the required analysis.

### 6.2 Separate Planning from Implementation

For substantial changes, follow this sequence:

1. **Investigate**: Identify the root cause, constraints, dependencies, and affected modules.
2. **Plan**: Define the intended changes, implementation order, risks, and tests.
3. **Implement**: Execute the approved plan using Sonnet when the implementation is well specified.
4. **Escalate if needed**: Return to Opus if implementation reveals a new architectural issue, an unexpected dependency, or a materially different solution requirement.
5. **Verify**: Run relevant tests, type checks, linting, builds, or other applicable checks.
6. **Report**: Summarize changes, verification results, and outstanding risks.

Do not send every implementation step back to Opus when Sonnet can execute the approved plan safely.

However, do not force Sonnet to continue when new evidence invalidates the original plan.

### 6.3 Plan Review and User Approval

An approved plan means the responsible agent has reviewed it for correctness, scope, and verification, and any required user decisions have been resolved. A subagent's plan is a proposal, not authorization.

- For routine, reversible implementation already authorized by the user, review the plan and proceed without asking for the same permission again.
- Ask the user when a proposal materially changes the requested scope, public contract, accepted risk, or an unresolved product choice, or when explicit approval is required by the task or governing rules.
- Respect requests limited to analysis or documentation. Record proposed implementation as future work rather than executing it.
- Switching models does not reset prior authorization or supply missing authorization.

### 6.4 Unavailable Models or Tools

If Opus or the required delegation mechanism is unavailable, do not invent a tool call or claim escalation succeeded.

- Continue bounded, read-only investigation with the available model and preserve the findings.
- If the current session is already Opus, direct analysis can satisfy the reasoning requirement without delegation.
- If evidence shows the task no longer meets Section 5's escalation criteria, proceed with the appropriate available model within the user's authorized scope.
- Otherwise, report the execution limitation and defer the affected high-risk decision or implementation. Do not silently substitute a lower-capability model for required analysis. Explain what capability or user decision is needed to continue, while completing independent authorized work.
- Avoid repeated failed delegation attempts unless the environment changes.

---

## 7. Subagent Output and Verification Requirements

Delegation does not transfer responsibility for correctness.

After receiving a subagent result:

- Inspect the actual changes or findings.
- Confirm that the implementation matches the user request.
- Check for unintended modifications.
- Run the relevant verification commands when available.
- Distinguish passed checks from checks that were not run.
- Escalate unresolved architectural or root-cause questions to Opus.
- Never report an implementation as complete solely because a subagent claims completion.

If a subagent only performed analysis, report it as analysis rather than completed implementation.

If a build or test fails, determine whether the failure is caused by the change, an existing issue, or the environment before drawing conclusions.

---

## 8. Decision Priority

Apply Section 5 rather than maintaining a separate set of escalation triggers:

- Use bounded read-only investigation to resolve uncertain scope.
- Use Opus for the reasoning phases that meet the escalation criteria.
- Use Sonnet for well-defined implementation and routine engineering; use Haiku for clearly bounded, low-risk work when appropriate.
- If new evidence invalidates the plan, stop speculative implementation and reassess under Section 5.
- Apply Section 6 for execution, approval, and unavailable-model handling.

The goal is not to maximize the number of Opus calls. The goal is to use stronger reasoning where it materially improves correctness, while keeping routine implementation efficient.

---

## 9. Final Reporting Format

For substantial delegated tasks, provide a concise report containing:

- **Approach**: What was investigated or implemented.
- **Changes**: Which modules or files were affected.
- **Verification**: Which tests, type checks, lint checks, or builds were actually run and their results.
- **Remaining risks**: Known limitations, unresolved questions, and checks that could not be performed.

For simple tasks, a short completion summary is sufficient.

Do not expose unnecessary model-selection deliberation to the user unless it affects the approach, cost, execution constraints, or completion status.
