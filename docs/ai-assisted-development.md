# AI-Assisted Development Workflow

This repository treats AI assistance as a review workflow, not an autonomous author.

## Working agreement

1. Start from a ticket or acceptance criteria and record the intended boundary.
2. Do not paste credentials, customer data, source restricted by policy or personal data into prompts.
3. Ask for a plan or focused diff, then inspect every changed file.
4. Run type checking, unit tests and integration tests locally.
5. Review security, error handling, dependency changes and generated documentation.
6. Use a normal branch and pull request; AI assistance does not replace code review.
7. Demo the behavior and document limitations before merging.

## Repository evidence

- The policy package rejects common credential patterns.
- The backend creates review plans without external side effects.
- Higher-risk test generation is marked `PENDING_APPROVAL`.
- CI validates shared policy, backend routes, React behavior, the container and Helm chart.

## Limitations

The repository does not measure productivity gains and does not claim that AI-generated output is correct. Any provider integration would require Volvo Group's approved tools, data classifications, security controls and review process.
