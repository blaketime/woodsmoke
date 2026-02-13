# Booking URL Fix — Design

**Date:** 2026-02-12
**Problem:** All 96 park `bookingUrl` values in `parks.json` were AI-generated and do not resolve to actual reservation pages.
**Goal:** Replace every `bookingUrl` with a verified, working link to the park's specific reservation/booking page.

## Booking Systems

| System | Domain | Parks | Notes |
|--------|--------|-------|-------|
| Parks Canada | `reservation.pc.gc.ca` | 23 | National parks, national marine conservation areas |
| Ontario Parks | `reservations.ontarioparks.ca` | 21 | Provincial parks |
| BC Parks | `bcparks.ca` | 20 | Provincial parks |
| Alberta Parks | `albertaparks.ca` | 17 | Provincial parks |
| SEPAQ (Quebec) | `sepaq.com` | 8 | Provincial parks |
| Nova Scotia Parks | `parks.novascotia.ca` | 5 | Provincial parks |
| One-offs | various | 3 | Gatineau, Whiteshell, Cypress Hills |

## Strategy

**Pattern-based research by booking system:**

1. For each of the 7 booking systems, research the actual URL structure for park-specific reservation pages.
2. Apply the correct pattern to all parks in that system's group.
3. Update `parks.json` with verified URLs.

**Execution:** Parallel research agents — one per booking system — to maximise speed.

**Edge cases:**
- Parks without online reservation (backcountry-only, FCFS) — link to park info page instead.
- The 3 one-off parks (Gatineau, Whiteshell, Cypress Hills) get individual research.

## Output

- Updated `src/data/parks.json` with correct booking URLs for all 96 parks.
- No code changes required — data-only fix.
