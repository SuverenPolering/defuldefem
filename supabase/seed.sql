-- De Fulde Fem — Supabase migrering + ren seed (medlemmer + katalog + vedtægter).
-- Kør ÉN gang i Supabase SQL Editor. Genereret fra appens egne data.

-- === 1) MIGRERING: bring skemaet i sync med appen ===
alter table fines drop column if exists beloeb;
alter table fines add column if not exists enhed integer not null default 0;
alter table fines add column if not exists antal integer not null default 1;

create table if not exists kasse_log (
  id uuid primary key default gen_random_uuid(),
  dato timestamptz not null default now(),
  beloeb integer not null default 0,
  note text not null default '',
  oprettet timestamptz not null default now());
create index if not exists kasse_log_dato_idx on kasse_log(dato desc);
alter table kasse_log enable row level security;
drop policy if exists "klub rw" on kasse_log;
create policy "klub rw" on kasse_log for all to authenticated using (true) with check (true);

-- === 2) SEED: ren start (medlemmer + katalog + vedtægter + tom kasse) ===
insert into members (id, navn, titel, initial, rolle) values
  ('henning', 'Henning Trab', 'Turistminister', 'H', 'turistminister'),
  ('jakob', 'Jakob Jakobsen', 'Bødekasseminister', 'J', 'boedekasseminister'),
  ('kim', 'Kim Hanen', 'Finansminister', 'K', 'finansminister'),
  ('anders', 'Anders Trab', 'Foreningssekretær', 'A', 'foreningssekretaer'),
  ('steffen', 'Steffen Due Lund', 'Joy', 'S', 'joy'),
  ('gaest', 'Gæst', 'Gæst', 'G', 'gaest')
on conflict (id) do nothing;

delete from fine_catalog;
insert into fine_catalog (kategori, forseelse, takst) values
  ('Snak, telefon og bordopførsel', 'Ikke-danske ord', 2),
  ('Snak, telefon og bordopførsel', 'Mobil på bordet', 2),
  ('Snak, telefon og bordopførsel', 'Min. 2 siger »den har vi hørt«', 2),
  ('Snak, telefon og bordopførsel', 'Starte seriøs politisk diskussion', 2),
  ('Snak, telefon og bordopførsel', 'Søge teknologihjælp for at understøtte en påstand', 2),
  ('Snak, telefon og bordopførsel', 'Forkert temperatur-brok', 2),
  ('Snak, telefon og bordopførsel', 'Dårlig joke der får stilhed', 5),
  ('Snak, telefon og bordopførsel', 'Far jokes', 5),
  ('Snak, telefon og bordopførsel', 'Erklære sig enig med HT', 4),
  ('Snak, telefon og bordopførsel', 'Bøde til HT for at lokke til enighed', 5),
  ('Øl – spild og uheld', 'Spilde lidt øl', 2),
  ('Øl – spild og uheld', 'Spilde mere end lidt øl', 5),
  ('Øl – spild og uheld', 'Vælte øl', 10),
  ('Øl – spild og uheld', 'Drikke øl før alle er klar', 5),
  ('Øl – spild og uheld', 'Medbringe den samme øl (bøde til begge)', 5),
  ('Øl – spild og uheld', 'Hælde øl ud (medmindre flertallet gør det)', 15),
  ('Øl – forkert eller dårlig øl', 'Ikke overholde øltema (pr. øl)', 5),
  ('Øl – forkert eller dårlig øl', 'Mødets dårligst karakterscorende øl', 15),
  ('Øl – forkert eller dårlig øl', 'Mødets næst-dårligst karakterscorende øl', 10),
  ('Øl – forkert eller dårlig øl', 'Mødets tredje-dårligst karakterscorende øl', 5),
  ('Glemt udstyr', 'Glemme ølbræt', 10),
  ('Glemt udstyr', 'Glemme ølglas (pr. glas)', 5),
  ('Glemt udstyr', 'Glemme øl (pr. øl)', 5),
  ('Fremmøde og mødedisciplin', 'Komme for sent (+ 2 kr pr. min efter 3 min)', 5),
  ('Fremmøde og mødedisciplin', 'Melde sent afbud til aftalt møde', 100),
  ('Fremmøde og mødedisciplin', 'Gå glip af øllets dag', 50),
  ('Fremmøde og mødedisciplin', 'Kaste op til et møde', 10),
  ('Ritualer: challenge og sang', 'Ikke bestå sin challenge', 10),
  ('Ritualer: challenge og sang', 'Ikke hørt min. én af de tre tenorer (bøde til alle)', 50),
  ('Tøj', 'Iført kjole / slips / hawaiiskjorte / sejlersko / tegnebog / hårbånd / turtleneck', 5),
  ('Tøj', 'Iført dobbelt denim', 10),
  ('Tøj', 'Ikke iført bælte / sokker', 5),
  ('Skade, gæster og status', 'Ødelægge glas', 20),
  ('Skade, gæster og status', 'Entré for gæster', 20),
  ('Skade, gæster og status', 'Mødets højeste skyldner', 2),
  ('Skade, gæster og status', 'Mødets mindste skyldner', 5);

insert into kasse (id, saldo) values (1, 0) on conflict (id) do nothing;

insert into vedtaegter (noegle, tekst) values
  ('forening', '# 1. Navn og hjemsted

§ 1
Foreningens navn er De fulde Fem (i det følgende benævnt Foreningen).
Stk. 2
Foreningens navn forkortes DFF.

§ 2
Foreningen har hjemsted på Hunderupvej 58b 1., th.

# 2. Foreningens formål

§ 3
Foreningens har til formål at etablere et forum, hvor foreningens medlemmer kan mødes, diskutere, smage og bedømme specialøl fra forskellige bryghuse. Foreningen kan derudover danne ramme om diverse arrangementer i form af bl.a. musikquiz, udfordringer, feltture mv.

# 3. Foreningens medlemmer

§ 4
Foreningens stiftende medlemmer er: Bødekasseministeren, Joy, Finansministeren, Turistministeren og Foreningssekretæren.

§ 5
De i § 4 nævnte medlemmer har fast sæde på Foreningens møder.
Stk. 2
Hvert af de stiftende medlemmer har hver 1 stemme på foreningens møder.

§ 6
Der kan ikke optages nye faste medlemmer i Foreningen. Foreningens medlemmer kan dog bestemme, at der kan medvirke inviterede gæster på Foreningens møder.

# 4. Foreningens møder og beslutninger

§ 7
Foreningen holder møde på de af de stiftende medlemmer valgte dage.
Stk. 2
Foreningens møder skal afholdes én gang i kvartalet, medmindre et af de stiftende medlemmer kan godtgøre lovligt forfald.
Stk. 3
Lovligt forfald i denne bestemmelses stk. 2 skal forstås som:
a) akut sygdom,
b) arbejdsrelaterede forhindringer, når disse er af maritim karakter,
c) trælse ægtefæller/partnere, eller
d) andre efter de stiftende medlemmers skøn kvalificerede forhold.

§ 8
Kan et medlem ikke godt, at denne har været i lovligt forfald, træffer de øvrige medlemmer beslutning om konsekvenserne heraf.
Stk. 2
De øvrige medlemmer er forpligtet til at vedtage en proportionel og retfærdig sanktion.

§ 9
Til brug for mødet udarbejder Foreningens sekretær en dagsorden, som skal indeholde de beslutningsforslag, som Foreningens medlemmer skal tage stilling til på mødet.

§ 10
Beslutninger på Foreningens møder træffes med simpelt flertal.
Stk. 2
Vedtægtsændringer skal dog vedtages med kvalificeret flertal, således at tre femtedele skal stemme for vedtægtsændringen.

§ 11
Foreningen er alene beslutningsdygtig, når alle 5 stiftende medlemmer er til stede på mødet.
Stk. 2
Såfremt et medlem er mødt, men er forfalden grundet beruselse eller lignende, vil Foreningen dog stadig være beslutningsdygtig.
Stk. 3
Stk. 2 gælder ikke for vedtægtsændringer.

# 5. Bøder

§ 12
Bødeministeren kan træffe bestemmelse om indførelse af bøde og disses størrelse.
Stk. 2
Bødeministerens bøder er dog underlagt de øvrige medlemmers kontrol, således at en bøde som findes uholdbar af de øvrige medlemmer bortfalder, hvis de tilkendegiver utilfredsheden over for Bødeministeren på et af møderne.

§ 13
Bøderne indbetales til Finansministeren, som sikrer beløbene på behørig vis.
Stk. 2
Finansministeren sørger for, i samarbejde med bødeministeren, at holde regnskab med de bøder, som udstedes og sørger for at bøder betales rettidigt.

§ 14
Såfremt en bøde ikke betales rettidigt, træffer Finansministeren foranstaltninger til bødekravet inddrives.
Stk. 2
Kan kravet ikke inddrives hos det pågældende medlem fastsætter Finansministeren og Bødeministeren en passende straf.

§ 15
Bøde for forfald på øllets dag besluttes på øllets dag af de tilstedeværende medlemmer. Straffen kan ikke lyde på under 1 omgang øl til foreningen.

# 6. Arrangementer i foreningen

§ 16
Ethvert medlem er berettiget til at foreslå idéer til arrangementer, som foreningen kan afholde og/eller deltage i.

§ 17
Turistministeren drager omsorg for forslag til arrangementer og sørger for eventuelle forslag forelægges Foreningssekretæren med henblik på optagelse i dagsordenen.

§ 18
Turistministeren forestår praktiske foranstaltninger forbundet med arrangementerne i det omfang det er hensigtsmæssigt.

§ 19
Turistministeren kan tage Joy med på råd omkring arrangement, men er ikke forpligtet hertil.'),
  ('boedekasse', '§ 1
Bødekassen gøres op fra møde til møde. Opgørelsen foreligger senest dagen efter et officielt DFF-møde.
§ 2
Bødekasseministeren står for opgørelsen, Finansministeren for opkrævningen.
§ 3
Bøderne fastsættes i rimeligt omfang af Bødekasseministeren. I tvivlstilfælde afgøres spørgsmålet ved flertalsafstemning.
§ 4
Bødernes størrelse fastsættes af Bødekasseministeren og kan til enhver tid ændres ved flertalsafstemning.
§ 5
Finansministeren fremlægger bødekassens indhold fra møde til møde.
§ 6
Forslag til brug af bødekassens indhold sendes til Foreningssekretæren senest to dage før et officielt DFF-møde. Sekretæren fremlægger forslagene, hvorefter der holdes hemmelig afstemning.
§ 7
Alle forslag til brug af bødekassens indhold skal vedrøre DFF''s grundværdi: øl.
§ 8
Forslag til nye bøder sendes til Bødekasseministeren senest to dage før et officielt DFF-møde. Bødekasseministeren udvælger og prissætter bøden. Hvert officielt medlem kan én gang om året nedlægge veto mod en ny bøde, hvorefter prisen fastsættes ved afstemning.
§ 9
Bøder, der ikke værdsættes af medlemmerne, kan fjernes ved afstemning. Samtidig skal der vedtages en ny bøde med samme størrelse, som først kan ændres ved afstemning på næste møde.
§ 10
Ønskes der afstemninger, skal de være sendt til Bødekasseministeren senest ét døgn før et officielt DFF-møde.
§ 11
Alle medlemmer kan påkalde bødestraf efter de gældende bøder.')
on conflict (noegle) do update set tekst = excluded.tekst;
