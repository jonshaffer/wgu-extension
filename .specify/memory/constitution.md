<!--
SYNC IMPACT REPORT
==================
Version change: N/A (template) → 1.0.0 (initial)

Modified principles: N/A (initial creation)
- [PRINCIPLE_1_NAME] → I. User Privacy First
- [PRINCIPLE_2_NAME] → II. Type Safety
- [PRINCIPLE_3_NAME] → III. Minimal Permissions
- [PRINCIPLE_4_NAME] → IV. Test-First Validation
- [PRINCIPLE_5_NAME] → V. Simplicity & YAGNI

Added sections:
- Development Workflow (from template SECTION_2)
- Security Requirements (from template SECTION_3)

Removed sections: None

Templates requiring updates:
- .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
- .specify/templates/spec-template.md ✅ (Requirements sections compatible)
- .specify/templates/tasks-template.md ✅ (Task organization compatible)

Follow-up TODOs: None
-->

# WGU Extension Constitution

## Core Principles

### I. User Privacy First

The extension MUST protect user privacy at all times:

- Only collect public community information (server metadata, subreddit data)
- NEVER collect personal data from Discord users or Reddit members
- NEVER store or transmit user credentials or session tokens
- Discord extraction is limited to server metadata, not user content
- Reddit extraction is limited to public subreddit data only

**Rationale**: Users trust the extension to enhance their WGU experience without compromising their privacy. Collecting only public community data ensures we provide value without overreach.

### II. Type Safety

All code MUST maintain strict type safety:

- TypeScript strict mode enabled across all workspaces
- Explicit types required; `any` type is prohibited
- JSON Schema validation with runtime type guards for external data
- Type definitions flow from functions → graphql-client → consumers
- Zod schemas for runtime validation of external inputs

**Rationale**: Type safety prevents runtime errors and ensures data integrity across the monorepo boundaries. The GraphQL type flow ensures API contracts are enforced at compile time.

### III. Minimal Permissions

The extension MUST request only necessary permissions:

- Request access only to WGU domains (`*.wgu.edu`)
- Content Security Policy strictly enforced in manifest
- Use extension storage APIs exclusively (not localStorage or web storage)
- API endpoints implement rate limiting and CORS restrictions
- Host permissions limited to required external resources only

**Rationale**: Minimal permissions reduce attack surface and build user trust. Users should be confident the extension cannot access data outside its stated purpose.

### IV. Test-First Validation

All data and code changes MUST be validated before integration:

- Data validation MUST occur before ingestion to Firestore
- JSON Schema validation for all community data sources
- CI/CD pipelines validate data integrity on every PR
- Type checking runs before commits via lefthook pre-commit hooks
- GraphQL persisted queries ensure only whitelisted operations execute

**Rationale**: Validation at every stage prevents bad data from propagating through the system and ensures the extension delivers accurate information to users.

### V. Simplicity & YAGNI

Development MUST follow simplicity principles:

- Avoid over-engineering; only implement what is directly requested
- Keep solutions simple and focused on the current requirement
- Do not add features, refactoring, or "improvements" beyond scope
- Do not add error handling for scenarios that cannot occur
- Prefer editing existing files over creating new ones
- Three similar lines of code is better than a premature abstraction

**Rationale**: Simple code is easier to understand, maintain, and debug. YAGNI (You Aren't Gonna Need It) prevents accumulation of unused code and unnecessary complexity.

## Development Workflow

### Code Quality Gates

All contributions MUST pass these gates before merge:

1. **Type Check**: `pnpm run typecheck` passes across all workspaces
2. **Lint**: `pnpm run lint` passes with no errors
3. **Build**: Production builds complete without errors
4. **Data Validation**: Community data passes schema validation

### Monorepo Structure

The project uses pnpm workspaces with clear boundaries:

- **extension/**: Browser extension (WXT framework, React, Tailwind)
- **functions/**: Firebase Cloud Functions (GraphQL API)
- **site/**: Public documentation website (React Router)
- **data/**: Community data collection and processing
- **graphql-client/**: Shared GraphQL client library

Cross-workspace dependencies MUST be explicit in package.json and types MUST flow correctly through the dependency graph.

### Commit Standards

Follow conventional commits for all changes:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation only
- `chore:` Maintenance tasks
- `refactor:` Code restructuring

## Security Requirements

### Sensitive Data Protection

- NEVER commit `.env` files or API keys
- NEVER expose Firebase service account keys
- NEVER include user personal data in commits
- Store secrets in GitHub Secrets for CI/CD
- Use Firebase Config for runtime secrets

### Extension Security

- Content Security Policy enforced in manifest
- No dynamic code execution or inline scripts
- Sanitize all user inputs before processing
- Extension permissions documented in manifest.json

### API Security

- GraphQL endpoints use persisted queries only (allowlist.json)
- CORS restrictions limit origins for function endpoints
- Rate limiting implemented on all public endpoints
- Firebase security rules protect Firestore access

## Governance

This constitution supersedes all other development practices. When in conflict, constitution principles take precedence.

### Amendment Process

1. Proposed amendments MUST be documented in a PR
2. Changes require review and approval
3. Version MUST be incremented following semver:
   - MAJOR: Backward-incompatible principle changes
   - MINOR: New principles or expanded guidance
   - PATCH: Clarifications and wording fixes
4. Last Amended date MUST be updated

### Compliance Review

- All PRs MUST verify compliance with these principles
- Code reviewers SHOULD reference constitution principles when requesting changes
- Complexity beyond these principles MUST be justified in PR description

### Runtime Guidance

For development guidance beyond this constitution, refer to:
- `CLAUDE.md` for detailed development instructions
- `.specify/templates/` for specification templates
- `specs/` for feature specifications

**Version**: 1.0.0 | **Ratified**: 2025-01-03 | **Last Amended**: 2025-01-03
