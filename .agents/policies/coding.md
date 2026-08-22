# Policy: Coding

1. Inspect before modifying — search for existing components/services/utilities first; never duplicate.
2. TypeScript strict; zero typecheck errors to merge.
3. No comments unless requested; self-documenting names.
4. No business logic in UI components; routes are thin adapters over domain services.
5. Money: integer minor units + ISO currency; never floats; never mutable balance columns.
6. i18n: translation keys only; no hard-coded user-facing strings.
7. Dependencies require justification; prefer existing abstractions.
8. Changes are small, reversible, and testable.
