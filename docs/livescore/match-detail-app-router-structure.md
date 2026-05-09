# Match Detail App Router Structure

## Scope

This document describes only the match detail page structure:

- `/livescore/football/match/[id]`
- `/livescore/football/match/[id]/[slug]`
- `src/domains/livescore/components/football/match/**`
- `src/domains/livescore/actions/match/**`

It does not compare team, player, league, or board pages.

## Route Shape

The match detail has two route levels.

```txt
src/app/(site)/livescore/football/match/[id]/page.tsx
src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx
```

`/match/[id]` is not the real detail page. It resolves the canonical slug and redirects to:

```txt
/livescore/football/match/[id]/[slug]
```

The actual detail page is `/match/[id]/[slug]`.

## Canonical Slug Flow

`/match/[id]/page.tsx`:

```txt
resolveCanonicalMatchSlug(id)
permanentRedirect(/livescore/football/match/${id}/${slug})
```

`/match/[id]/[slug]/page.tsx` also checks the canonical slug before rendering:

```txt
resolveCanonicalMatchSlug(matchId)
if slug !== canonicalSlug:
  permanentRedirect(canonical URL)
```

So direct id-only access and stale slug access both normalize to the canonical URL.

## Server Data Entry Point

Main server entry:

```txt
src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx
```

The page decides the active tab from `searchParams.tab`.

Valid tabs:

```txt
power
events
lineups
stats
standings
support
```

Default tab:

```txt
power
```

The first major fetch is:

```ts
fetchCachedMatchFullData(matchId, {
  fetchEvents: initialTab === 'events' || initialTab === 'lineups',
  fetchLineups: initialTab === 'lineups',
  fetchStats: initialTab === 'stats',
  fetchStandings: initialTab === 'power' || initialTab === 'standings',
})
```

This means the server fetches only the match sub-data needed for the current tab.

## Additional Server Data

After base match data is loaded, the page prepares extra data in parallel.

```txt
cupRoundsData
highlight
powerDataResult
sidebarExtrasResult
allPlayerStats
goalEventsResult
lineupPlayerPhotoUrls
```

Important calls:

```txt
fetchCupFixturesByRound
getMatchHighlight
getCachedPowerData
getCachedSidebarExtrasData
fetchAllPlayerStats
fetchCachedMatchGoalEvents
getPlayerPhotoUrls
getPlayersKoreanNames
```

These values are passed down as initial props to `MatchPageClient`.

## Client Boundary

The main client component is:

```txt
src/domains/livescore/components/football/match/MatchPageClient.tsx
```

It is still a client component because the page contains interactive UI:

- tab click handling
- prediction buttons
- comment form
- lineup image export/share flows
- login redirects

But it does not fetch public match data itself.

Current role:

```txt
Receive server props
Render MatchHeader
Render TabNavigation
Render TabContent
Render MatchSidebar
```

It does not own tab state. It uses:

```ts
const currentTab = initialTab;
```

The active tab comes from the URL/server page, not local state.

## Tab Navigation

File:

```txt
src/domains/livescore/components/football/match/TabNavigation.tsx
```

Tabs produce URL targets:

```txt
power      -> current pathname
events     -> ?tab=events
lineups    -> ?tab=lineups
stats      -> ?tab=stats
standings  -> ?tab=standings
support    -> ?tab=support
```

If no external `onTabChange` is passed, tab click calls:

```ts
router.push(tab.href)
```

That causes App Router navigation, so `/match/[id]/[slug]/page.tsx` runs again and prepares the selected tab data on the server.

This is different from a shallow `window.history.replaceState` tab model.

## Tab Content

File:

```txt
src/domains/livescore/components/football/match/TabContent.tsx
```

`TabContent` selects which tab component to render from server-provided props.

Current model:

```txt
currentTab
initialData
initialPowerData
allPlayerStats
playerKoreanNames
lineupPlayerPhotoUrls
cupRoundsData
sidebarData
highlight
```

It does not run React Query.

## Match Header

File:

```txt
src/domains/livescore/components/football/match/MatchHeader.tsx
```

Goal events and player Korean names are passed from the server:

```txt
headerGoalEvents
playerKoreanNames
```

The header no longer fetches goal events on the client.

## Public Data Tabs

The public data tabs now render from server props.

```txt
Power       -> initialPowerData
Events      -> initialData.events
Lineups     -> initialData.lineups + allPlayerStats + lineupPlayerPhotoUrls
Stats       -> initialData.stats + allPlayerStats
Standings   -> initialData.standings + cupRoundsData
Support     -> sidebarData prediction/comment initial values
```

React Query is not used inside the match detail folder.

Verified search target:

```txt
src/domains/livescore/components/football/match
```

Removed patterns:

```txt
useQuery(
useQueryClient
@tanstack/react-query
invalidateQueries
setQueryData
```

## Prediction And Comments

Prediction and comments are still interactive client components, but their data model changed.

Files:

```txt
src/domains/livescore/components/football/match/sidebar/MatchPredictionClient.tsx
src/domains/livescore/components/football/match/sidebar/SupportCommentsSection.tsx
```

Initial data comes from:

```txt
getCachedSidebarExtrasData
  getUserPrediction
  getPredictionStats
  getSupportComments
  getRelatedPosts
```

Mutation flow:

```txt
Client form/button
Server Action
revalidatePath(currentPath)
router.refresh()
```

Prediction:

```txt
savePrediction(matchId, type, pathname)
updatePredictionStatsManually(matchId)
router.refresh()
```

Comments:

```txt
createSupportComment(matchId, teamType, content, pathname)
router.refresh()
```

The client uses `usePathname()` so the Server Action can revalidate the real slug URL, not only `/match/[id]`.

## Suspense

There is no match-detail-specific `Suspense` boundary in:

```txt
src/app/(site)/livescore/football/match/[id]/[slug]/page.tsx
src/domains/livescore/components/football/match/**
```

The visible Suspense related to this page comes from the shared site layout:

```txt
src/app/(site)/layout.tsx
```

That layout uses Suspense for shared layout pieces:

```txt
TotalPostCountValue
RightSidebar
```

So match detail benefits from the common layout streaming behavior, but the match detail body itself is currently rendered after its server data is ready.

There is also no match detail `loading.tsx` now. A route loading skeleton was intentionally removed because it was not requested.

## Prefetch

Match links and internal entity links generally use:

```tsx
prefetch={false}
```

The match tab navigation goes through the shared `TabList` with hrefs, and tab click uses `router.push`.

Important distinction:

```txt
prefetch={false} prevents automatic route prefetch
router.push still performs navigation when the user clicks
```

## Current App Router Model

The match detail page is now closer to this App Router model:

```txt
URL determines active tab
Server page fetches current tab data
Client components render props
Client components handle only interaction
Server Actions handle writes
router.refresh refreshes server data after writes
```

## Remaining Client-Side Behavior

The remaining client-side work is interaction-oriented, not public data fetching:

```txt
tab click navigation
prediction button click
comment form submit
login redirect
lineup image export/share
browser auth check for comment form
```

Known browser-only code:

```txt
Formation.tsx
  image export/share fetch/blob logic
  Supabase browser upload flow

SupportCommentsSection.tsx
  Supabase browser auth check
```

These are not the same as client fetching public match tab data.

## Practical Implication

Before the cleanup, the match detail could behave like:

```txt
route shell appears
client query starts
tab data appears piece by piece
```

After the cleanup, the intended behavior is:

```txt
tab URL navigation
server prepares the selected tab data
client receives populated props
interactive islands hydrate after render
```

This is the structure to compare against when reviewing team/player/league pages later.
