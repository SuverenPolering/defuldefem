-- De Fulde Fem — keep-alive-tabellen "hjerteslag".
--
-- Køres i Supabase' SQL Editor (Dashboard → SQL Editor → kør hele filen).
-- Idempotent: kan køres igen uden skade.
--
-- Formål: workflowet .github/workflows/supabase-keepalive.yml laver hver
-- anden dag ét GET-kald mod denne tabel via REST-API'et, så projektet ikke
-- pauses af Supabase' 7-dages inaktivitetsregel.
--
-- RLS-undtagelse: resten af skemaet (schema.sql) giver bevidst anon INGEN
-- adgang. Her får anon SELECT — tabellen indeholder kun et id og et
-- tidsstempel, ingen klubdata, så undtagelsen åbner ikke for noget.

create table if not exists hjerteslag (
  id       integer generated always as identity primary key,
  oprettet timestamptz not null default now()
);

alter table hjerteslag enable row level security;

-- create policy har ingen "if not exists" — drop først, så filen er idempotent.
drop policy if exists "anon laes" on hjerteslag;
create policy "anon laes" on hjerteslag for select to anon using (true);

-- Én række, så tabellen ikke er tom (indsættes kun hvis den mangler).
insert into hjerteslag (oprettet)
select now()
where not exists (select 1 from hjerteslag);
