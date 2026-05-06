# Post-Soak Bugfix Release Plan (Lite)

Branch: `release/post-soak-bugfix`

## Start Criteria

1. Migration release soak window completed.
2. Pro migration compatibility confirmed stable.

## Scope

- Apply only bug-fix changes that are required for Lite.
- Keep Pro/Lite conflict detection compatibility checks intact.

## Validation

- Activation/deactivation conflict smoke test with Pro.
- Bug reproduction -> fix -> verification.
- Rebuild artefacts and verify checksums.
