-- De Fulde Fem — Supabase-skema.
--
-- Matcher felterne i assets/js/db.js. I mockfasen kører appen mod
-- localStorage; dette skema tages i brug når CONFIG.BRUG_SUPABASE = true.
--
-- RLS: appen bruger ÉT fælles klub-login (Supabase Auth) bag Dørmanden.
-- Den offentlige anon-nøgle giver INGEN adgang — kun rollen 'authenticated'
-- (dvs. logget ind med klub-kontoen) kan læse/skrive. Det lukker den
-- offentlige skrive/slette-adgang, som "anon all" ellers ville give.
--
-- Med ÉT delt login ser databasen én bruger, så rolle-rettigheder (kun
-- Bødekasseministeren må skrive bøder) kan IKKE håndhæves her — de er
-- kosmetiske i klienten. Server-side rolle-håndhævelse kræver login pr.
-- medlem + tjek på auth.uid(); se TODO(rolle-rls) nedenfor.

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
  enhed     integer not null default 0,  -- takst pr. styk (kroner, heltal)
  antal     integer not null default 1,  -- antal gange (beløb = enhed * antal)
  betalt    boolean not null default false,
  dato      date not null default current_date,
  oprettet  timestamptz not null default now()
);
create index if not exists fines_member_idx on fines(member_id);

-- Bødekatalog (faste forseelser + takster).
create table if not exists fine_catalog (
  id        uuid primary key default gen_random_uuid(),
  kategori  text,
  forseelse text not null,
  takst     integer not null default 0  -- kroner (heltal)
);

-- Ønskeliste — hvad kassen skal bruges på.
create table if not exists wishlist (
  id        uuid primary key default gen_random_uuid(),
  tekst     text not null,
  member_id text references members(id) on delete set null, -- FK: hvem ønskede det (nullable)
  oprettet  timestamptz not null default now()
);

-- Møder / ture.
create table if not exists meetings (
  id         uuid primary key default gen_random_uuid(),
  type       text not null default 'moede',  -- 'moede' | 'rejse'
  dato       date not null,
  datoer     jsonb,                           -- liste af ISO-datoer (fx flerdages rejse)
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
  pct          numeric(4,1),             -- fx 10.2
  havde_med_id text references members(id) on delete set null, -- hvem havde den med
  oprettet    timestamptz not null default now()
);
create index if not exists beers_session_idx on beers(session_id);

-- Ratings (heltal 1–10, ét pr. medlem pr. øl).
create table if not exists beer_ratings (
  id        uuid primary key default gen_random_uuid(),
  beer_id   uuid not null references beers(id) on delete cascade,
  member_id text not null references members(id) on delete cascade,
  score     integer not null check (score between 0 and 10),
  unique (beer_id, member_id)
);

-- Kassens saldo — ét lagret tal (enkelt-række, id altid 1).
create table if not exists kasse (
  id    integer primary key default 1,
  saldo integer not null default 0
);

-- Kassebog — logbog over ind/ud af kassen (manuelle reguleringer + markér betalt).
create table if not exists kasse_log (
  id       uuid primary key default gen_random_uuid(),
  dato     timestamptz not null default now(),
  beloeb   integer not null default 0,   -- + ind / − ud (kroner, heltal)
  note     text not null default '',
  oprettet timestamptz not null default now()
);
create index if not exists kasse_log_dato_idx on kasse_log(dato desc);

-- Vedtægter — fri tekst pr. nøgle ('forening' | 'boedekasse').
create table if not exists vedtaegter (
  noegle text primary key,
  tekst  text not null default ''
);

-- ============================================================
-- ROW LEVEL SECURITY (fælles login: kun indloggede)
-- ============================================================
-- anon (den offentlige nøgle, ikke logget ind) får INGEN policy = ingen
-- adgang. Kun 'authenticated' (det fælles klub-login) kan læse/skrive.
-- TODO(rolle-rls): ved login pr. medlem kan skriv til fines/fine_catalog
-- begrænses til Bødekasseministerens konto via auth.uid().

alter table members       enable row level security;
alter table fines         enable row level security;
alter table fine_catalog  enable row level security;
alter table wishlist      enable row level security;
alter table meetings      enable row level security;
alter table rsvps         enable row level security;
alter table beer_sessions enable row level security;
alter table beers         enable row level security;
alter table beer_ratings  enable row level security;
alter table kasse         enable row level security;
alter table kasse_log     enable row level security;
alter table vedtaegter    enable row level security;

-- Kun det fælles klub-login (rollen 'authenticated'). Ingen anon-policy =
-- den offentlige nøgle alene kan hverken læse, skrive eller slette.
create policy "klub rw" on members       for all to authenticated using (true) with check (true);
create policy "klub rw" on fines         for all to authenticated using (true) with check (true);
create policy "klub rw" on fine_catalog  for all to authenticated using (true) with check (true);
create policy "klub rw" on wishlist      for all to authenticated using (true) with check (true);
create policy "klub rw" on meetings      for all to authenticated using (true) with check (true);
create policy "klub rw" on rsvps         for all to authenticated using (true) with check (true);
create policy "klub rw" on beer_sessions for all to authenticated using (true) with check (true);
create policy "klub rw" on beers         for all to authenticated using (true) with check (true);
create policy "klub rw" on beer_ratings  for all to authenticated using (true) with check (true);
create policy "klub rw" on kasse         for all to authenticated using (true) with check (true);
create policy "klub rw" on kasse_log     for all to authenticated using (true) with check (true);
create policy "klub rw" on vedtaegter    for all to authenticated using (true) with check (true);

-- ============================================================
-- TAVLE, NÆSER & STEMMEBOKS
-- ============================================================

-- Informationstavle — opslag fra medlemmerne.
create table if not exists opslag (
  id        uuid primary key default gen_random_uuid(),
  member_id text references members(id) on delete set null, -- hvem skrev det (nullable)
  tekst     text not null,
  oprettet  timestamptz not null default now()
);

-- Joy's næser — tæller hvor mange gange nogen har fået en næse.
create table if not exists naeser (
  id       uuid primary key default gen_random_uuid(),
  titel    text not null,
  antal    integer not null default 1,
  oprettet timestamptz not null default now()
);

-- Stemmeboks — ja/nej-afstemninger ('aaben' indtil de offentliggøres).
create table if not exists afstemninger (
  id          uuid primary key default gen_random_uuid(),
  spoergsmaal text not null,
  status      text not null default 'aaben',  -- 'aaben' | 'offentlig'
  oprettet    timestamptz not null default now()
);

-- Stemmesvar (ét pr. medlem pr. afstemning).
-- Blød anonymitet: vi gemmer member_id, men UI viser KUN optællingen,
-- aldrig hvem der stemte hvad. Med ÉT delt login kan ægte anonymitet
-- ikke håndhæves i RLS (databasen ser kun én bruger), så hemmeligheden
-- holdes i klienten — den slår aldrig identiteter op til visning.
-- ADVARSEL: "klub rw"-policyen nedenfor giver enhver med det fælles login
-- fuld SELECT, så et klubmedlem KAN læse (member_id, svar) direkte via en rå
-- supabase-query i DevTools — også før offentliggørelse. Anonymiteten gælder
-- altså kun i UI'et, ikke mod et medlem der graver i databasen. Vil man have
-- ægte hemmelighed kræver det login pr. medlem + en SECURITY DEFINER-funktion
-- der kun returnerer {ja,nej} (se TODO(rolle-rls) øverst).
create table if not exists afstemning_svar (
  id            uuid primary key default gen_random_uuid(),
  afstemning_id uuid not null references afstemninger(id) on delete cascade,
  member_id     text not null references members(id) on delete cascade,
  svar          text not null,             -- 'ja' | 'nej'
  unique (afstemning_id, member_id)
);

alter table opslag          enable row level security;
alter table naeser          enable row level security;
alter table afstemninger    enable row level security;
alter table afstemning_svar enable row level security;

create policy "klub rw" on opslag          for all to authenticated using (true) with check (true);
create policy "klub rw" on naeser          for all to authenticated using (true) with check (true);
create policy "klub rw" on afstemninger    for all to authenticated using (true) with check (true);
create policy "klub rw" on afstemning_svar for all to authenticated using (true) with check (true);
