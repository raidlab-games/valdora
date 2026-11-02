-- Valdora — banco online (rodada 109). Rode este arquivo inteiro no SQL Editor do projeto Supabase (uma vez).
-- Contas: o Supabase Auth guarda e-mail e senha (com hash); aqui ficam o nome de usuário, os servidores e os personagens.
-- Toda tabela tem RLS: cada jogador só lê e muda os próprios personagens.

create extension if not exists pgcrypto with schema extensions;

-- ---------- perfis (nome de usuário único, ligado à conta) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,14}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));
alter table public.profiles enable row level security;
drop policy if exists "perfil: dono lê" on public.profiles;
create policy "perfil: dono lê" on public.profiles for select using (auth.uid() = id);

-- o perfil nasce junto com a conta, com o usuário escolhido no cadastro (raw_user_meta_data.username)
create or replace function public.valdora_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username) values (new.id, new.raw_user_meta_data->>'username');
  return new;
end $$;
drop trigger if exists valdora_on_auth_user on auth.users;
create trigger valdora_on_auth_user after insert on auth.users for each row execute function public.valdora_new_user();

-- usuário livre? (o cadastro confere antes de criar a conta)
create or replace function public.valdora_username_free(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

-- entrar com o usuário: devolve o e-mail SÓ se a senha conferir com o hash da conta (não expõe e-mail de ninguém);
-- depois o navegador entra normalmente com e-mail + senha
create or replace function public.valdora_login_email(p_username text, p_password text) returns text
language sql stable security definer set search_path = public, extensions, auth as $$
  select u.email from auth.users u join public.profiles p on p.id = u.id
  where lower(p.username) = lower(p_username) and u.encrypted_password = extensions.crypt(p_password, u.encrypted_password)
  limit 1;
$$;
revoke all on function public.valdora_login_email(text, text) from public;
grant execute on function public.valdora_login_email(text, text) to anon, authenticated;
grant execute on function public.valdora_username_free(text) to anon, authenticated;

-- ---------- servidores ----------
create table if not exists public.servers (
  id text primary key,
  name text not null,
  region text not null,
  status text not null default 'online' check (status in ('online', 'maintenance', 'closed')),
  sort int not null default 0
);
alter table public.servers enable row level security;
drop policy if exists "servidores: todos leem" on public.servers;
create policy "servidores: todos leem" on public.servers for select using (true);
insert into public.servers (id, name, region, sort) values
  ('lumeira', 'Lumeira', 'Brasil', 1), ('escarpa', 'Escarpa', 'Brasil', 2), ('degelo', 'Degelo', 'Portugal', 3)
on conflict (id) do nothing;

-- ---------- personagens ----------
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  server_id text not null references public.servers,
  name text not null check (char_length(name) between 2 and 14),
  hero text not null check (hero ~ '^hero_[0-9]$'),
  level int not null default 0,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 400000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists characters_name_per_server on public.characters (server_id, lower(name));
create index if not exists characters_owner on public.characters (owner, server_id);
alter table public.characters enable row level security;
drop policy if exists "personagem: dono lê" on public.characters;
drop policy if exists "personagem: dono cria" on public.characters;
drop policy if exists "personagem: dono muda" on public.characters;
drop policy if exists "personagem: dono apaga" on public.characters;
create policy "personagem: dono lê" on public.characters for select using (auth.uid() = owner);
create policy "personagem: dono cria" on public.characters for insert with check (auth.uid() = owner);
create policy "personagem: dono muda" on public.characters for update using (auth.uid() = owner) with check (auth.uid() = owner);
create policy "personagem: dono apaga" on public.characters for delete using (auth.uid() = owner);

-- no máximo 4 personagens por servidor em cada conta
create or replace function public.valdora_max_chars() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.characters where owner = new.owner and server_id = new.server_id) >= 4 then
    raise exception 'max_chars';
  end if;
  return new;
end $$;
drop trigger if exists valdora_max_chars on public.characters;
create trigger valdora_max_chars before insert on public.characters for each row execute function public.valdora_max_chars();

-- lista de servidores com o total de aventureiros e quantos são do jogador (sem expor personagens de ninguém)
create or replace function public.valdora_servers() returns table (id text, name text, region text, status text, players int, mine int)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.region, s.status,
    (select count(*)::int from public.characters c where c.server_id = s.id),
    (select count(*)::int from public.characters c where c.server_id = s.id and c.owner = auth.uid())
  from public.servers s order by s.sort, s.name;
$$;
grant execute on function public.valdora_servers() to anon, authenticated;
