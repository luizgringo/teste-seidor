---

name: itsm-tickets
description: Use when changing tickets, permissions, events, SLA, or what Marina, Ricardo, and Helena can see.
---

# ITSM tickets

Read `docs/product/permissions.md` and `docs/api/events.md` before editing the domain.

Put a new business rule in `src/features/tickets/domain` and cover it with a Vitest file next to it. The server calls that function. The component reads `capabilitiesFor` and does not repeat the condition.

When an event is broadcast, pass it through `presentEvent` so a customer socket never receives an internal note or a real priority.

Keep drafts in component state. Do not reset them inside the socket effect.
