# Policy: Architecture

1. Modular monolith (ADR-003): domains own their tables and services; cross-domain effects go through events.
2. Zero circular dependencies; dependency direction: apps → packages → domains → database.
3. Vendor-agnostic ports for search (ADR-010), AI (ADR-011), payments (ADR-008), and storage.
4. Every significant decision gets an ADR before implementation.
5. Service extraction requires load evidence and a new ADR.
6. Never claim non-existent code in docs — planned items are marked as planned.
7. Empty packages are forbidden; create packages when a domain has real logic.
