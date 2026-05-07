# Team Page SEO Audit

Last checked: 2026-05-08

## Scope

Audited URL pattern:

- `/livescore/football/team/[id]/[slug]`
- Example: `/livescore/football/team/157/bayern-munchen`
- Tab URLs:
  - `/livescore/football/team/157/bayern-munchen?tab=fixtures`
  - `/livescore/football/team/157/bayern-munchen?tab=standings`
  - `/livescore/football/team/157/bayern-munchen?tab=squad`
  - `/livescore/football/team/157/bayern-munchen?tab=transfers`
  - `/livescore/football/team/157/bayern-munchen?tab=stats`

Goal:

- Index the main overview URL.
- Use tab URLs as crawlable supporting URLs.
- Keep canonical signals consolidated on the overview URL.

## Current Verdict

The team page is in a good technical SEO state after the recent changes.

The strongest points are:

- The main team URL has a clean slug route.
- The id-only route redirects permanently to the slug route while preserving `?tab=`.
- The overview page now receives meaningful SSR preview data.
- Team tabs are now real internal links, not button-only state changes.
- Canonical remains focused on the main overview URL.
- SportsTeam and Breadcrumb JSON-LD are present.
- Team pages are included in the team sitemap route.

This does not guarantee immediate Google indexing. It does mean the page now gives Google a much clearer crawl path and stronger representative content than before.

## URL And Canonical

Source files:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
- `src/app/(site)/livescore/football/team/[id]/page.tsx`
- `src/shared/utils/metadataNew.ts`

Current behavior:

- Canonical path is generated from `/livescore/football/team/${id}/${teamSlug}`.
- `?tab=` is not included in canonical.
- `/livescore/football/team/[id]` redirects to `/livescore/football/team/[id]/[slug]`.
- The redirect preserves `?tab=fixtures`, `?tab=squad`, etc.

SEO impact:

- Good for avoiding duplicate indexing between overview and tab URLs.
- Good for consolidating ranking signals into the main team page.
- Correct for the current strategy: tab URLs support crawling, overview URL receives canonical weight.

## Internal Links

Source files:

- `src/domains/livescore/components/football/team/TabNavigation.tsx`
- `src/shared/components/ui/tabs.tsx`

Recent improvement:

- Team navigation tabs now expose real `href` values:
  - overview -> base team URL
  - fixtures -> `?tab=fixtures`
  - standings -> `?tab=standings`
  - squad -> `?tab=squad`
  - transfers -> `?tab=transfers`
  - stats -> `?tab=stats`

Implementation detail:

- `TabList` supports `TabItem.href`.
- Tabs with `href` render as `next/link`.
- Normal clicks still use the existing client tab transition for fast UX.
- Modified/new-tab clicks still work as actual links.

SEO impact:

- Strong improvement.
- Google can now discover supporting tab URLs from the team page HTML.
- Since canonical remains on overview, these tabs should mainly strengthen crawl discovery and topical signals instead of competing as separate indexed pages.

## SSR Content

Source file:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`

Overview SSR currently includes:

- Team header/basic team data
- Recent matches preview
- Upcoming matches preview
- Standings preview
- Season highlights player rankings preview
- Recent transfers preview
- Logo/image URL maps needed by those sections
- Korean player names for preview players where available

Tab SSR behavior:

- `?tab=fixtures`: fetches match data for the fixtures tab.
- `?tab=standings`: fetches standings data.
- `?tab=squad`: fetches squad and player stats.
- `?tab=stats`: fetches player stats.
- `?tab=transfers`: fetches transfer data.

SEO impact:

- Good balance between SEO and performance.
- The overview page has enough representative content without loading every full tab.
- Direct tab URLs can be rendered with the selected tab's server data when crawled.

Risk:

- Some tab sub-states, such as `subTab`, are still client-side. That is acceptable because the main SEO target is the overview URL and the first-level tab URLs.

## Structured Data

Source file:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`

Current JSON-LD:

- `SportsTeam`
- `BreadcrumbList`

SportsTeam currently includes:

- `name`
- `alternateName` when mapping exists
- `url`
- `logo` / `image` when usable
- `foundingDate`
- `sport`
- `memberOf` league when available
- `coach` when squad data includes coach
- `location` as stadium/arena or country fallback

SEO impact:

- Good.
- This is stronger than plain metadata because it gives Google explicit entity context.

Potential improvement:

- If reliable social/profile URLs become available later, add `sameAs`.
- If reliable official website URLs become available later, add them carefully. Do not invent them.

## Metadata

Source files:

- `src/app/(site)/livescore/football/team/[id]/[slug]/page.tsx`
- `src/shared/utils/metadataNew.ts`

Current metadata:

- Dynamic title
- Dynamic description
- Canonical URL
- Open Graph URL
- Team logo as OG image when available and not placeholder
- `noindex` fallback when team data is missing

SEO impact:

- Good.
- The main weakness is not the metadata mechanism, but data quality and Korean text quality in some source strings/comments. The user-visible UI labels were fixed in `TabNavigation.tsx`, but some server-side strings in older files still show mojibake in the source.

Priority:

- If the generated metadata appears garbled in live HTML, fix the affected Korean literals in the server page files.
- If live HTML metadata is normal, this is lower priority.

## Sitemap

Relevant route:

- `/livescore/football/team/sitemap/0.xml`

Current state:

- Team pages are included in the sitemap route.
- Tab URLs are not expected to be included in sitemap.

SEO impact:

- Correct.
- Sitemap should list canonical overview URLs only.
- Tab URLs are internal crawl paths, not sitemap targets.

## Comparison With Other Livescore Pages

| Area | Team Page | League Page | Player Page | Match Page |
| --- | --- | --- | --- | --- |
| Clean slug URL | Yes | Yes | Yes | Yes |
| id-only redirect | Yes | Yes for id route pattern | Yes for id route pattern | Yes for id route pattern |
| Dynamic metadata | Yes | Yes | Yes | Yes |
| Canonical focused on main URL | Yes | Yes | Yes | Yes |
| Structured data | SportsTeam + Breadcrumb | SportsOrganization + Breadcrumb | Person + Breadcrumb | SportsEvent + Breadcrumb |
| SSR main content | Overview previews | Standings/rankings | Selected tab data | Core match data |
| Crawlable tabs | Improved now | Not applicable | Needs separate check | Match tabs appear similar pattern |
| Sitemap inclusion | Yes | Yes | Yes | Yes |

Team page after the recent update is now closer to the league page model:

- League pages expose important data directly in SSR sections.
- Team overview now exposes important preview data directly.
- Team tab links now provide extra crawl paths without changing canonical strategy.

Compared with player and match pages:

- Player and match pages also use `?tab=`.
- They may still have button-only tab navigation depending on their tab components.
- If the same SEO support-link strategy is desired, player and match tab navigation can be reviewed next.

## Remaining Gaps

High priority:

- Verify live deployed HTML after deployment:
  - canonical
  - title/description encoding
  - `SportsTeam` JSON-LD
  - `BreadcrumbList` JSON-LD
  - tab links as real `<a href>`

Medium priority:

- Review player/match tab navigation for the same internal-link pattern.
- Check whether team metadata Korean strings are garbled in production HTML. Some source literals currently appear mojibake in local file reads.
- Consider lightweight `sameAs` only if reliable official data exists.

Low priority:

- Add longer unique team introduction text only if a trustworthy data source is available.
- Do not add duplicate summary cards just for SEO. The overview itself already acts as the summary surface.

## Recommended Search Console Flow

After deployment:

1. Inspect the canonical overview URL:
   - `/livescore/football/team/157/bayern-munchen`
2. Confirm:
   - Page can be indexed.
   - User-declared canonical is the overview URL.
   - Google-selected canonical is the inspected URL or the same overview URL.
   - Breadcrumb enhancement is detected.
3. Request indexing for the overview URL.
4. Do not request indexing for every `?tab=` URL unless a specific tab URL needs troubleshooting.

## Final Assessment

The current team page SEO architecture is sound:

- Overview URL is the index target.
- Tab URLs are crawlable support paths.
- Canonical avoids duplicate-index competition.
- SSR preview content gives the overview real content depth.
- Structured data identifies the page as a football team entity.

The next meaningful work is verification on the deployed HTML, not adding more duplicate UI to the overview.
