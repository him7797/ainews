# Phase 0: Research & Decisions

## CI/CD Provider

- **Decision**: GitHub Actions
- **Rationale**: The project is hosted on GitHub, and GitHub Actions provides seamless, native integration for Pull Request checks and branch protections without requiring third-party services. It is the industry standard for open-source and modern proprietary projects.
- **Alternatives considered**: CircleCI, GitLab CI, Bitrise (overkill for simple linting/testing right now).

## Tooling Commands

- **Decision**: Use existing `package.json` scripts (`npm run lint`, `npm test`, `npm run typecheck` assuming they exist or will be added).
- **Rationale**: Keeps the CI pipeline decoupled from the specific tools used. If we switch from Jest to Vitest later, the CI workflow file doesn't need to change as long as `npm test` remains the standard entry point.
- **Alternatives considered**: Running `npx eslint .` directly in the workflow. Rejected because it breaks encapsulation.

## Caching Strategy

- **Decision**: Use `actions/setup-node` built-in caching for npm dependencies.
- **Rationale**: Drastically reduces pipeline execution time by avoiding full `npm install` on every run.
- **Alternatives considered**: Custom `actions/cache` implementation (more complex and error-prone).
