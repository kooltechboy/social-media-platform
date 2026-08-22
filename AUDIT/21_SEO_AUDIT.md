# 21 — SEARCH ENGINE OPTIMIZATION (SEO) & DISCOVERABILITY AUDIT

**Domain:** Metadata, OpenGraph, Canonical URLs, Structured Data & Public Route Indexing  
**Auditor:** Digital Growth Strategist & Frontend Architect  
**Status:** Good (Score: 82/100)

---

## 1. Metadata & OpenGraph Architecture

- **Root Layout:** `apps/web/src/app/layout.tsx` defines default metadata including title template, meta description, and OpenGraph tags.
- **Dynamic Entity Metadata:** Creator profiles (`/profile/[username]`), public podcasts (`/podcasts`), community hubs (`/communities`), and marketplace products generate dynamic title and description tags.
- **Structured Data (JSON-LD):** Public events and podcast episodes can be embedded with `Schema.org/Event` and `Schema.org/PodcastEpisode` structured data.

---

## 2. Recommendations

- Add dynamic `sitemap.xml` and `robots.txt` generation in `apps/web/src/app/sitemap.ts` and `robots.ts` to automate search engine indexing of public Caribbean content.
