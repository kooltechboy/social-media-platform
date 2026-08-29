# Geographic / Country Data Model — TUKUBI

## 1. Principles

- **Versioned reference data, not code.** Countries/regions/cities live in the database (`countries` migration `00001` + planned expansions), seeded via `supabase/seed/`, never hard-coded in application logic.
- **Political status is data, not inference.** Classification (sovereign state, territory, dependency, associated state) is stored, not assumed from geography.
- **Extensible without redesign.** New Caribbean-associated locations (e.g., diaspora hubs like Miami, Toronto, London as *connection* points) require no schema change.

## 2. Coverage

**Sovereign Caribbean states (13):** Antigua & Barbuda, Bahamas, Barbados, Cuba, Dominica, Dominican Republic, Grenada, Haiti, Jamaica, Saint Kitts & Nevis, Saint Lucia, Saint Vincent & the Grenadines, Trinidad & Tobago.
**CARICOM/regional (3):** Belize, Guyana, Suriname.
**Territories & dependencies:** Anguilla, Aruba, Bermuda, Bonaire, British Virgin Islands, Cayman Islands, Curaçao, Guadeloupe, Martinique, Montserrat, Puerto Rico, Saba, Saint Barthélemy, Sint Eustatius, Sint Maarten, Turks & Caicos, U.S. Virgin Islands.

## 3. Model

```
countries   (id, iso2, iso3, name, status[sovereign|territory|dependency|associated],
             region, subregion, currency, timezone, calling_code, is_caribbean, sort_order)
regions     (id, country_id, code, name, type[state|parish|province|province/etc.])
cities      (id, region_id, name, lat, lng, population_band, is_diaspora_hub)
languages   (id, iso639, name, native_name)
country_languages (country_id, language_id, official BOOLEAN)
```

`countries` exists today (with ISO fixes per commit `3cb8a3a`); `regions`/`cities`/`languages` are Phase 1 migrations.

## 4. Diaspora Model (Privacy-First)

User Caribbean identity is **optional, user-controlled, private by default**:

```
profile_identity (profile_id, country_id NULL, region_id NULL, city_id NULL,
                  home_location NULL, diaspora_hub_id NULL,       -- e.g., Toronto, Brooklyn
                  visibility[public|followers|private])
profile_interests (profile_id, interest_key)                     -- music, food, carnival, tech…
```

- The platform may reason over: *Jamaican → living in Toronto → Caribbean food → follows Trinidadian creators → family in Kingston* — but **inferred attributes are never exposed as facts** and never shown without user opt-in.
- Identity fields feed the Caribbean Graph signals (feed ranking, Explore, Ask Caribbean) server-side only.

## 5. Explore/Taxonomy Usage
Trending-by-location (Kingston, Santo Domingo, Port of Spain, Miami, Toronto, London…), country browse, and diaspora categories are driven by queries over this model — adding a location immediately appears everywhere it is relevant.
