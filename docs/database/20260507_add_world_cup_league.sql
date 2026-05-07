-- Register FIFA World Cup 2026 as an allowed livescore league.
-- API-FOOTBALL identifiers: league=1, season=2026.

insert into public.leagues (
  id,
  name,
  name_ko,
  country,
  country_ko,
  logo,
  flag,
  is_calendar_season,
  is_cup,
  is_major
) values (
  1,
  'World Cup',
  U&'\C6D4\B4DC\CEF5',
  'World',
  U&'\C138\ACC4',
  'https://media.api-sports.io/football/leagues/1.png',
  '',
  true,
  true,
  true
)
on conflict (id) do update set
  name = excluded.name,
  name_ko = excluded.name_ko,
  country = excluded.country,
  country_ko = excluded.country_ko,
  logo = excluded.logo,
  flag = excluded.flag,
  is_calendar_season = excluded.is_calendar_season,
  is_cup = excluded.is_cup,
  is_major = excluded.is_major;
