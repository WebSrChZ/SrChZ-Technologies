-- ============================================================
-- TABELA DE LEADS — SRCHZ TECHNOLOGIES (secao /growth/)
-- Execute no painel do Supabase: SQL Editor -> New query
--
-- Referencia do schema que o formulario de `growth/js/main.js` espera, mais as
-- colunas de prova de consentimento exigidas pela LGPD.
--
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

begin;

create table if not exists srchz_leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  contact    text not null,
  segment    text,
  message    text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Prova de consentimento: quem aceitou e quando. A LGPD poe o onus da prova no
-- controlador (art. 8, par. 2), entao guarde o aceite junto com o lead.
alter table srchz_leads add column if not exists consent    boolean not null default false;
alter table srchz_leads add column if not exists consent_at timestamptz;

-- ------------------------------------------------------------
-- RLS: o formulario e publico e so pode INSERIR.
-- A chave do front-end e publicavel por natureza (esta em growth/js/main.js),
-- entao sem isto qualquer visitante conseguiria LER a base de leads inteira.
-- ------------------------------------------------------------
alter table srchz_leads enable row level security;

drop policy if exists "Public insert srchz_leads"    on srchz_leads;
drop policy if exists "anon_insert_srchz_leads"      on srchz_leads;
create policy "anon_insert_srchz_leads" on srchz_leads for insert with check (true);

-- Sem policy de SELECT/UPDATE/DELETE: leitura so pelo painel do Supabase ou
-- com a service key (que nunca deve aparecer no front-end).
revoke select, update, delete on srchz_leads from anon, authenticated;
grant insert on srchz_leads to anon;

commit;

-- ============================================================
-- Depois de rodar, habilite o registro do aceite em growth/js/main.js:
-- acrescente ao corpo do insert:
--     consent: true,
--     consent_at: new Date().toISOString()
--
-- CONFIRA a policy no painel (Table Editor -> srchz_leads -> RLS): a base de
-- leads tem nome, contato e mensagem de pessoas reais — se `SELECT` estiver
-- liberado para anon, ela e publica.
-- ============================================================
