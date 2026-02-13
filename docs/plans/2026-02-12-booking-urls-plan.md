# Booking URL Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all 96 hallucinated `bookingUrl` values in `parks.json` with verified, working reservation page URLs.

**Architecture:** Research the actual URL pattern for each of 7 major booking systems (Parks Canada, Ontario Parks, BC Parks, Alberta Parks, SEPAQ, Nova Scotia Parks, one-offs) via web search, then batch-update the JSON.

**Tech Stack:** Web research + JSON editing. No code changes — data only.

---

### Task 1: Research Parks Canada booking URLs (23 parks)

**Files:**
- Modify: `src/data/parks.json` (all `reservation.pc.gc.ca` entries)

**Step 1: Research the real Parks Canada reservation URL pattern**

Web search for the Parks Canada reservation system. The current URLs use `reservation.pc.gc.ca/<ParkName>` — find the actual URL structure. Parks Canada uses a centralised reservation system at reservation.pc.gc.ca. Research the correct URL format for each of these 23 parks:

banff, jasper, pacific-rim, yoho, kootenay, glacier-bc, waterton-lakes, gros-morne, cape-breton-highlands, fundy, pei-national, la-mauricie, forillon, bruce-peninsula, thousand-islands, point-pelee, riding-mountain, prince-albert, kejimkujik, nahanni, kluane, elk-island, fathom-five

**Step 2: Update parks.json with corrected Parks Canada URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct Parks Canada booking URLs (23 parks)"
```

---

### Task 2: Research Ontario Parks booking URLs (21 parks)

**Files:**
- Modify: `src/data/parks.json` (all `reservations.ontarioparks.ca` entries)

**Step 1: Research the real Ontario Parks reservation URL pattern**

The current URLs use `reservations.ontarioparks.ca/<ParkName>`. Ontario Parks uses a centralised reservation system. Research the correct URL format for each of these 21 parks:

algonquin, killarney, bon-echo, sandbanks, quetico, frontenac, grundy-lake, awenda, pinery, arrowhead, lake-superior, sleeping-giant, kawartha-highlands, silent-lake, french-river, massasauga, charleston-lake, rondeau, presquile, restoule, neys

**Step 2: Update parks.json with corrected Ontario Parks URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct Ontario Parks booking URLs (21 parks)"
```

---

### Task 3: Research BC Parks booking URLs (20 parks)

**Files:**
- Modify: `src/data/parks.json` (all `bcparks.ca` entries)

**Step 1: Research the real BC Parks reservation URL pattern**

The current URLs use `bcparks.ca/<park-name>-park/`. BC Parks has its own reservation system (likely camping.bcparks.ca or similar). Research the correct URL format for each of these 20 parks:

garibaldi, wells-gray, manning, strathcona, mount-robson, golden-ears, bowron-lake, joffre-lakes, juan-de-fuca, cape-scott, mount-assiniboine, cathedral, rathtrevor-beach, tweedsmuir-south, kokanee-creek, okanagan-lake, miracle-beach, stein-valley, sasquatch, nairn-falls

**Step 2: Update parks.json with corrected BC Parks URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct BC Parks booking URLs (20 parks)"
```

---

### Task 4: Research Alberta Parks booking URLs (17 parks)

**Files:**
- Modify: `src/data/parks.json` (all `albertaparks.ca` entries)

**Step 1: Research the real Alberta Parks reservation URL pattern**

The current URLs use `www.albertaparks.ca/<park-name>/`. Alberta Parks uses Reserve.AlbertaParks.ca for reservations. Research the correct URL format for each of these 17 parks:

dinosaur, peter-lougheed, writing-on-stone, bow-valley, william-a-switzer, crimson-lake, spray-valley, dry-island-buffalo-jump, lesser-slave-lake, aspen-beach, beauvais-lake, chain-lakes, lakeland, castle, ram-falls, gregoire-lake, sir-winston-churchill

**Step 2: Update parks.json with corrected Alberta Parks URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct Alberta Parks booking URLs (17 parks)"
```

---

### Task 5: Research SEPAQ booking URLs (8 parks)

**Files:**
- Modify: `src/data/parks.json` (all `sepaq.com` entries)

**Step 1: Research the real SEPAQ reservation URL pattern**

The current URLs use `www.sepaq.com/pq/<code>/`. SEPAQ (Societe des etablissements de plein air du Quebec) manages Quebec national parks. Research the correct URL format for each of these 8 parks:

mont-tremblant (mot), jacques-cartier (jac), gaspesie (gas), bic (bic), oka (oka), hautes-gorges (hgo), fjord-du-saguenay (sag), mont-orford (mor)

**Step 2: Update parks.json with corrected SEPAQ URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct SEPAQ booking URLs (8 parks)"
```

---

### Task 6: Research Nova Scotia Parks booking URLs (5 parks)

**Files:**
- Modify: `src/data/parks.json` (all `parks.novascotia.ca` entries)

**Step 1: Research the real Nova Scotia Parks reservation URL pattern**

The current URLs use `parks.novascotia.ca/park/<park-name>`. Research the correct reservation URL format for each of these 5 parks:

cape-chignecto, blomidon, five-islands, taylor-head, thomas-raddall

**Step 2: Update parks.json with corrected Nova Scotia Parks URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 3: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct Nova Scotia Parks booking URLs (5 parks)"
```

---

### Task 7: Research one-off booking URLs (3 parks)

**Files:**
- Modify: `src/data/parks.json` (Gatineau, Whiteshell, Cypress Hills entries)

**Step 1: Research Gatineau Park booking URL**

Current: `https://ncc-ccn.gc.ca/places/gatineau-park-camping`
Research the actual camping reservation page for Gatineau Park (NCC).

**Step 2: Research Whiteshell Provincial Park booking URL**

Current: `https://www.gov.mb.ca/sd/parks/whiteshell.html`
Research the actual camping reservation page for Whiteshell (Manitoba Parks).

**Step 3: Research Cypress Hills Interprovincial Park booking URL**

Current: `https://www.tourismsaskatchewan.com/listings/cypress-hills-interprovincial-park`
Research the actual camping reservation page for Cypress Hills (Saskatchewan side).

**Step 4: Update parks.json with corrected one-off URLs**

Replace each park's `bookingUrl` with the verified URL.

**Step 5: Commit**

```bash
git add src/data/parks.json
git commit -m "fix: correct Gatineau, Whiteshell, Cypress Hills booking URLs"
```

---

### Task 8: Final verification

**Step 1: Verify all bookingUrl values are updated**

Grep `parks.json` for all `bookingUrl` entries and confirm none still use the old hallucinated patterns.

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/parks.json', 'utf8')); console.log('Valid JSON')"`

**Step 3: Verify app still builds**

Run: `npm run build`

**Step 4: Final commit if needed**

```bash
git add src/data/parks.json
git commit -m "fix: verify all booking URLs updated"
```
