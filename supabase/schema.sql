-- De Fulde Fem — Supabase-skema.
--
-- Matcher felterne i assets/js/db.js. I mockfasen kører appen mod
-- localStorage; dette skema tages i brug når CONFIG.BRUG_SUPABASE = true.
--
-- RLS: i mockfasen har anon (den offentlige nøgle) BÅDE læse- og
-- skriverettigheder, så appen kan skrive direkte fra browseren uden rigtig
-- auth. STRAM SENERE: når Supabase Auth indføres, erstattes "anon"-policies
-- med "authenticated" + medlems-tjek, og skriverettigheder til bøder/katalog
-- begrænses til Bødekasseministeren. Markeret med TODO(stram) nedenfor.

-- ============================================================
-- TABELLER
-- ============================================================

-- Medlemmer (kanonisk liste; id matcher localStorage-id'erne).
create table if not exists members (
  id      text primary key,            -- 'henning', 'jakob', ...
  navn    text not null,
  titel   text not null,
  initial text not null,
  rolle   text not null                -- 'minister' | 'boedekasseminister' | 'joy'
);

-- Bøder.
create table if not exists fines (
  id        uuid primary key default gen_random_uuid(),
  member_id text not null references members(id) on delete cascade,
  grund     text not null,
  beloeb    integer not null default 0, -- kroner (heltal)
  dato      date not null default current_date,
  oprettet  timestamptz not null default now()
);
create index if not exists fines_member_idx on fines(member_id);

-- Bødekatalog (faste forseelser + takster).
create table if not exists fine_catalog (
  id        uuid primary key default gen_random_uuid(),
  forseelse text not null,
  takst     integer not null default 0  -- kroner (heltal)
);

-- Ønskeliste — hvad kassen skal bruges på.
create table if not exists wishlist (
  id       uuid primary key default gen_random_uuid(),
  tekst    text not null,
  oprettet timestamptz not null default now()
);

-- Møder / ture.
create table if not exists meetings (
  id         uuid primary key default gen_random_uuid(),
  dato       date not null,
  sted       text not null default '',
  tema       text not null default '',
  arkiveret  boolean not null default false,
  oprettet   timestamptz not null default now()
);

-- Tilmeldingssvar (ét pr. medlem pr. møde).
create table if not exists rsvps (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  member_id  text not null references members(id) on delete cascade,
  svar       text not null,             -- 'ja' | 'nej' | 'maaske'
  tekst      text not null default '',
  unique (meeting_id, member_id)
);

-- Øl-sessioner (mapper pr. mødedato).
create table if not exists beer_sessions (
  id        uuid primary key default gen_random_uuid(),
  dato      date not null,
  sted      text not null default '',
  deltagere text[] not null default '{}',  -- member-id'er
  tema      text not null default '',
  oprettet  timestamptz not null default now()
);

-- Øl i en session.
create table if not exists beers (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references beer_sessions(id) on delete cascade,
  bryggeri    text not null default '',
  navn        text not null,
  type        text not null default '',
  pct         numeric(4,1),              -- fx 10.2
  havde_med   text references members(id) on delete set null, -- hvem havde den med
  oprettet    timestamptz not null default now()
);
create index if not exists beers_session_idx on beers(session_id);

-- Ratings (heltal 1–10, ét pr. medlem pr. øl).
create table if not exists beer_ratings (
  id        uuid primary key default gen_random_uuid(),
  beer_id   uuid not null references beers(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  score     integer not null check (score between 1 and 10),
  unique (beer_id, member_id)
);

-- Ordbogsnævnet — ord + domme.
create table if not exists words (
  id          uuid primary key default gen_random_uuid(),
  ord         text not null,
  status      text not null default 'afventer', -- 'doemt' | 'frikendt' | 'afventer'
  begrundelse text not null default '',
  oprettet    timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (mockfase: anon read + write)
-- ============================================================
-- TODO(stram): erstat anon-policies med authenticated + medlems-/rolle-tjek
-- når Supabase Auth er på plads. Bøder + katalog: kun Bødekasseministeren.

alter table members      enable row level security;
alter table fines        enable row level security;
alter table fine_catalog enable row level security;
alter table wishlist     enable row level security;
alter table meetings     enable row level security;
alter table rsvps        enable row level security;
alter table beer_sessions enable row level security;
alter table beers        enable row level security;
alter table beer_ratings enable row level security;
alter table words        enable row level security;

-- Hjælpe-makro findes ikke i ren SQL; vi skriver policies eksplicit pr. tabel.
-- anon-rollen dækker den offentlige browser-klient i mockfasen.

create policy "mock anon all" on members      for all to anon using (true) with check (true);
create policy "mock anon all" on fines         for all to anon using (true) with check (true); -- TODO(stram): kun boedekasseminister
create policy "mock anon all" on fine_catalog  for all to anon using (true) with check (true); -- TODO(stram): kun boedekasseminister
create policy "mock anon all" on wishlist      for all to anon using (true) with check (true);
create policy "mock anon all" on meetings      for all to anon using (true) with check (true);
create policy "mock anon all" on rsvps         for all to anon using (true) with check (true);
create policy "mock anon all" on beer_sessions for all to anon using (true) with check (true);
create policy "mock anon all" on beers         for all to anon using (true) with check (true);
create policy "mock anon all" on beer_ratings  for all to anon using (true) with check (true);
create policy "mock anon all" on words         for all to anon using (true) with check (true);
