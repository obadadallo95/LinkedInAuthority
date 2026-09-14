# AI Generation Notes

This document describes the current repository-intelligence and content-generation pipeline. It is implementation documentation for an active beta, not a claim of production readiness.

## Pipeline

1. Validate the authenticated request and repository identifier.
2. Fetch GitHub metadata, README/configuration snippets, languages, and—when requested—recent commits, pull requests, and issues.
3. Normalize the fetched material into repository context and evidence.
4. Ask Gemini for structured output using response schemas and grounding instructions.
5. Sign analysis results with an expiring HMAC token bound to the user and canonical repository.
6. Generate an editable draft and persist it when the caller chooses to save it or when an automation run completes.

## Grounding controls

- Candidate angles are returned with atomic evidence and conflict information.
- Generation prompts distinguish repository facts from model-generated narrative.
- Deep analysis uses stable repository identity plus recent activity.
- Link extraction and call-to-action selection are deterministic over links found in repository content. “Verified” here means deterministically sourced from fetched repository metadata; it does not establish domain ownership or safety.

## Model routing

The Gemini service selects models by task and supports configured fallback handling. Current task categories include repository analysis, post generation, deep synthesis, commit analysis, and hashtag generation. Model names are configuration details and may change without an API contract change.

## Observability

AI calls can record task, model, token counts, latency, repository context, and estimated cost through Firestore telemetry. Telemetry is best-effort and does not replace production monitoring.

## Known limitations

- Repository-derived context and drafts may be persisted.
- Prompt grounding reduces unsupported claims but does not independently prove every model statement.
- GitHub token handling remains a beta limitation because the current client flow stores the integration token in user settings.
- LinkedIn publishing and official LinkedIn analytics are not implemented.
