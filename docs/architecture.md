# Release Readiness Framework – Architecture

## Purpose

This document describes the **architecture and repository structure** of the **Release Readiness Validation Framework**.

The structure defined here is **intentional and contractual**:
- It enforces clear separation of concerns
- It enables evidence-based release decisions
- It supports Jenkins-first execution today (MVP1)
- It prepares the system for a future UI (MVP2)

Any structural changes must update this document and be reviewed like code.

---

## Architectural Principles

1. **Evidence First**  
   Every readiness decision must be backed by explicit, auditable evidence.

2. **Deterministic Decisions**  
   The framework must produce consistent results from the same inputs.

3. **Separation of Concerns**  
   Business logic, system integrations, reporting, and policy evaluation are isolated.

4. **UI-Ready by Design**  
   Outputs are structured so a UI can consume them without coupling to CI logic.

5. **Extensibility Without Refactoring**  
   New checks or integrations should be addable without touching core orchestration.

---

## High-Level Flow

```text
release.yml
↓
CLI (readiness validate)
↓
Runner
↓
Checks → Adapters → Evidence
↓
Policy Evaluation
↓
Reports (JSON / MD / HTML)
```
## Repository Structure
```text
release-readiness-framework/
│
├── README.md
├── Jenkinsfile
├── pyproject.toml                # or requirements.txt
├── .gitignore
│
├── release.yml                   # sample release config (example only)
│
├── ai/
│   └── agents/
│       ├── release-readiness.prompt.md   # 🧠 canonical AI agent spec
│       └── README.md
│
├── src/
│   └── readiness/
│       ├── __init__.py
│
│       ├── cli/
│       │   ├── __init__.py
│       │   └── main.py           # `readiness validate` entrypoint
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── runner.py         # orchestrates checks + aggregation
│       │   ├── context.py        # runtime context built from config
│       │   ├── config.py         # YAML parsing + validation
│       │   ├── policy.py         # GREEN/YELLOW/RED evaluation logic
│       │   └── timeutils.py
│       │
│       ├── checks/
│       │   ├── __init__.py
│       │   ├── base.py           # Check interface / abstract class
│       │   │
│       │   ├── argocd_nonprod.py # Check #1
│       │   ├── regression.py     # Check #2
│       │   ├── certification.py  # Check #3 (perf/chaos/dr)
│       │   ├── prerelease.py     # Check #4
│       │   └── change_mgmt.py    # Check #5
│       │
│       ├── adapters/
│       │   ├── __init__.py
│       │   ├── argocd.py
│       │   ├── jenkins.py
│       │   ├── github.py
│       │   └── confluence.py
│       │
│       ├── models/
│       │   ├── __init__.py
│       │   ├── check_result.py
│       │   ├── evidence.py
│       │   └── report.py
│       │
│       ├── reporters/
│       │   ├── __init__.py
│       │   ├── json_reporter.py
│       │   ├── markdown_reporter.py
│       │   └── html_reporter.py  # optional (static)
│       │
│       ├── schemas/
│       │   └── readiness_report.schema.json
│       │
│       └── utils/
│           ├── __init__.py
│           ├── logging.py
│           ├── redaction.py
│           └── fs.py
│
├── tests/
│   ├── unit/
│   │   ├── test_config.py
│   │   ├── test_policy.py
│   │   ├── test_argocd_check.py
│   │   └── test_regression_check.py
│   │
│   └── fixtures/
│       ├── argocd_app.json
│       ├── jenkins_build.json
│       ├── github_pr.json
│       └── confluence_page.json
│
├── docs/
│   ├── architecture.md
│   ├── checks.md
│   ├── evidence-model.md
│   └── mvp2-ui.md
│
└── out/                          # runtime output (gitignored)
    ├── readiness_report.json
    ├── readiness_report.md
    ├── readiness_report.html
    └── evidence/
```

Each directory has a **strict responsibility boundary**, described below.

---

## Directory Responsibilities

### `ai/agents/`

**Purpose:**  
Canonical AI agent specifications used to generate, evolve, or validate the framework.

**Key Rules:**
- Contains prompts only (no executable code)
- Treated as versioned specifications
- Must align with actual implementation

Example: ai/agents/release-readiness.prompt.md


---

### `src/readiness/`

Root package for the framework implementation.

This directory contains **all executable logic** and must not include:
- CI pipeline definitions
- Documentation-only files
- Generated artifacts

---

### `src/readiness/cli/`

**Purpose:**  
User-facing command-line interface.

**Responsibilities:**
- Parse CLI arguments
- Load configuration
- Invoke the core runner
- Set process exit codes

**Must NOT:**
- Contain business logic
- Call external systems directly

---

### `src/readiness/core/`

**Purpose:**  
Framework orchestration and decision-making core.

**Key Components:**
- `runner.py`: Executes checks and aggregates results
- `config.py`: Parses and validates `release.yml`
- `context.py`: Shared execution context
- `policy.py`: GREEN / YELLOW / RED evaluation logic

**Must NOT:**
- Contain system-specific API calls
- Format output directly

---

### `src/readiness/checks/`

**Purpose:**  
Encapsulates **release readiness business logic**.

Each check:
- Implements one readiness requirement
- Produces structured results and evidence
- Is isolated from other checks

**Examples:**
- ArgoCD non-prod deployment validation
- Jenkins regression verification
- Pre-release documentation readiness

**Rules:**
- Checks may call adapters
- Checks must not call other checks
- Checks must return structured `CheckResult` objects

---

### `src/readiness/adapters/`

**Purpose:**  
Integration layer for external systems.

Adapters translate external APIs into **framework-friendly data models**.

**Examples:**
- ArgoCD API adapter
- Jenkins REST adapter
- GitHub REST / GraphQL adapter
- Confluence REST adapter

**Rules:**
- No business decisions
- No policy logic
- Pure data retrieval and normalization

---

### `src/readiness/models/`

**Purpose:**  
Defines stable **data contracts** used throughout the framework.

These models form the **public interface** between:
- Checks
- Reporters
- Future UI (MVP2)

**Examples:**
- `CheckResult`
- `Evidence`
- `ReadinessReport`

**Rules:**
- Changes must be backward compatible when possible
- UI will bind directly to these models

---

### `src/readiness/reporters/`

**Purpose:**  
Transform structured results into output formats.

**Formats:**
- JSON (canonical)
- Markdown (human-readable)
- HTML (optional, static)

**Rules:**
- Must not modify business logic
- Must not re-evaluate policy
- Must faithfully represent model data

---

### `src/readiness/schemas/`

**Purpose:**  
Formal schema definitions for framework outputs.

**Usage:**
- Validate generated JSON reports
- Serve as contracts for UI and external systems

**Rules:**
- Schemas are versioned
- Breaking changes require explicit version bump

---

### `src/readiness/utils/`

**Purpose:**  
Shared utilities used across the framework.

**Examples:**
- Logging
- Time helpers
- Redaction and sanitization
- File system helpers

**Rules:**
- Must remain generic
- Must not contain business logic

---

### `tests/`

**Purpose:**  
Automated validation of framework behavior.

**Structure:**
- `unit/`: Core logic and checks
- `fixtures/`: Sample payloads from external systems

**Rules:**
- Tests must not call real external systems
- Use fixtures for deterministic behavior

---

### `docs/`

**Purpose:**  
Human-facing documentation.

**Includes:**
- Architecture
- Check definitions
- Evidence model
- MVP2 UI design notes

This directory **must not** contain executable logic.

---

### `release.yml`

**Purpose:**  
Example configuration file showing how a service declares its release readiness inputs.

**Rules:**
- Provided as reference only
- Not used directly in CI without review

---

### `out/`

**Purpose:**  
Runtime-generated artifacts.

**Contains:**
- `readiness_report.json`
- `readiness_report.md`
- `readiness_report.html`
- Evidence payloads

**Rules:**
- Must be gitignored
- Must be archived by Jenkins as build artifacts

---

## Dependency Direction Rules

Allowed dependency flow:
```text
cli → core → checks → adapters
↓
models
↓
reporters
```

Disallowed:
- Adapters importing checks
- Reporters calling adapters
- Core importing reporters

---

## Change Management

- Structural changes require updating this document
- New checks must:
  - Follow existing interfaces
  - Update check documentation
- Schema changes require explicit versioning

---

## Summary

This architecture is designed to:
- Provide **trustable release gating**
- Scale across teams and services
- Enable future UI-driven workflows
- Prevent architectural drift

The repository structure is a **first-class part of the system design** and must be treated accordingly.
