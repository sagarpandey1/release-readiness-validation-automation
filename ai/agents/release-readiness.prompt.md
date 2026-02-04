# Release Readiness Validation Agent Prompt

## Purpose
You are an expert Platform / SRE engineer.  
Your task is to implement an **MVP1 Release Readiness Validation Framework** that runs in **Jenkins (core)** and validates production release readiness using **ArgoCD, Jenkins, GitHub, and Confluence**.

The framework must produce a **transparent, evidence-first release readiness report** with **RED / YELLOW / GREEN** status for each check and an overall consolidated decision.

This prompt is treated as a **source-of-truth specification** and must be followed precisely.

---

## Scope & Goals

### MVP1 (This implementation)
- Pipeline-only framework (no UI)
- Jenkins-executed CLI tool
- Evidence-based checks
- Deterministic RED / YELLOW / GREEN output
- Machine-readable + human-readable reports
- UI-ready JSON output for MVP2

### Out of Scope
- Interactive UI
- Deep CM system API integrations (handled via evidence injection in MVP1)

---

## Technology Assumptions

- **CI**: Jenkins (core)
- **Deployment**: ArgoCD
- **Source Control**: GitHub
- **Release Notes / Install Docs**: Confluence
- **Customer-Facing Docs**: GitHub repo integrated into docs site
- **Preferred Language**: Python (recommended)

---

## Status Model (Strict)

Each check must return **exactly one** of:

- **GREEN** – Requirement satisfied with strong, recent evidence
- **YELLOW** – Partially satisfied, optional per policy, or evidence is incomplete but not blocking
- **RED** – Requirement not satisfied or required evidence missing

### Overall Status Rules
- Any **RED** in a required check → overall **RED**
- No RED but ≥1 **YELLOW** → overall **YELLOW**
- All checks **GREEN** → overall **GREEN**

---

## Configuration Input

The framework must consume a single YAML config file (example: `release.yml`) containing:

- `service_name`
- `release_version` (tag) and/or `commit_sha`
- `argo`
  - application name(s)
  - non-prod environment(s)
  - expected revision
- `jenkins`
  - base URL
  - job names for regression / perf / chaos / dr
  - allowed time windows
- `github`
  - org + repo names (service repo, helm repo, docs repo)
- `confluence`
  - base URL
  - page IDs or space + title for release notes and install steps
- `policies`
  - required vs optional checks
  - freshness thresholds
  - approval counts
- `credentials`
  - environment variable names for tokens (never hard-coded)

---

## Architecture Requirements

### Core Components
- **Runner**
  - Loads config
  - Builds execution context
  - Executes all checks
  - Aggregates results
  - Writes report artifacts

- **Check Interface**
run(context) -> CheckResult

- **Adapters**
- GitHubAdapter (REST / GraphQL)
- JenkinsAdapter (REST API)
- ArgoCDAdapter (API)
- ConfluenceAdapter (REST API)

---

## Data Models

### CheckResult
- `id`
- `name`
- `status` (RED / YELLOW / GREEN)
- `summary`
- `reasons[]`
- `evidence[]`
- `started_at`
- `ended_at`
- `duration_ms`

### Evidence
- `type` (argocd_app, jenkins_build, github_pr, confluence_page, artifact)
- `source_system` (ArgoCD / Jenkins / GitHub / Confluence)
- `identifier`
- `timestamp`
- `url`
- `details` (small structured JSON)
- `raw_ref` (optional path to stored payload)

---

## Output Artifacts (UI-Ready)

Write all outputs under `/out`:

1. `readiness_report.json` (canonical source for MVP2 UI)
2. `readiness_report.md` (human readable)
3. `readiness_report.html` (static, optional but preferred)
4. `/out/evidence/` (cached payloads if needed)

### JSON Report Must Include
- release metadata
- overall_status
- per-check status, reasons, evidence
- summary counts
- blocking vs non-blocking items
- generation timestamp and Jenkins build ID

---

## Jenkins Integration

Provide CLI:
readiness validate --config release.yml --out out/

Exit codes:
- `0` → overall GREEN
- `1` → overall YELLOW
- `2` → overall RED
- `3` → tool failure

Provide a Jenkinsfile example that:
- runs the validation
- archives `/out/**`
- prints a Markdown summary to logs

---

## Check Definitions (MVP1)

### 1) Non-Prod Deployment Completed (REQUIRED)
- Validate ArgoCD app exists
- `sync.status == Synced`
- `health.status == Healthy` (configurable)
- Revision matches release version or commit

Status logic:
- GREEN: synced + healthy + revision match
- YELLOW: synced but health degraded within allowed window
- RED: not synced, revision mismatch, or app missing

---

### 2) Regression Test Completed (REQUIRED)
- Jenkins regression job SUCCESS
- Build parameters match release
- Timestamp within policy window

Status logic:
- GREEN: SUCCESS and fresh
- YELLOW: SUCCESS but stale
- RED: FAILED / ABORTED / missing

---

### 3) Perf / Chaos / DR Certification (Policy-Driven)
- Jenkins jobs and/or Confluence evidence
- Sub-checks: perf, chaos, dr

Status logic:
- GREEN: all required certifications present
- YELLOW: optional items missing
- RED: required certification missing or failed

---

### 4) Pre-Release Review Readiness (REQUIRED)

Sub-checks:
- **Helm Chart**
  - version updated
  - lint/build evidence
- **Release Install Steps**
  - Confluence page exists and recently updated
- **Customer Docs**
  - GitHub docs PR merged or docs build completed

Status logic:
- GREEN: all satisfied
- YELLOW: minor evidence gaps
- RED: any required item missing

---

### 5) Production CM Created + Testing Task Completed (REQUIRED, MVP1 Flexible)
- Accept CM link and exported JSON evidence
- Validate CM created and testing task completed

Status logic:
- GREEN: CM exists + testing completed
- YELLOW: CM exists but testing incomplete
- RED: CM missing or invalid evidence

---

## Security & Reliability
- Never log secrets
- Redact tokens from stored payloads
- Store only minimal evidence
- Deterministic decisions only (no heuristics without policy)

---

## Deliverables
Return:
- Repository structure
- Source code
- Sample `release.yml`
- Example reports (JSON + MD + optional HTML)
- Jenkinsfile snippet
- Design notes explaining extensibility and MVP2 UI path

---

## Guiding Principle
This system is an **auditable release gate**, not a best-effort script.
Every decision must be backed by **explicit evidence**.
