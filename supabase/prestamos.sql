-- Módulo de préstamos. Ejecutar una vez en el SQL Editor de Supabase.
create table implementos(
  id bigint generated always as identity primary key,
  codigo text not null unique, nombre text not null, categoria text default '',
  accesorios text default '', valor numeric not null default 0 check (valor>=0),
  dias_plazo int not null default 3 check (dias_plazo between 1 and 60),
  estado text not null default 'disponible' check (estado in ('disponible','prestado','por_limpiar','en_reparacion','perdido','retirado')),
  condicion text not null default 'bueno', creado timestamptz not null default now());
create table prestamos(
  id bigint generated always as identity primary key, numero text not null unique,
  nombre text not null, documento text not null, telefono text default '', notas text default '',
  salida timestamptz not null default now(), estado text not null default 'activo' check (estado in ('activo','cerrado')),
  entregado_por text, autoriza_datos timestamptz not null default now());
create table prestamo_items(
  id bigint generated always as identity primary key,
  prestamo_id bigint not null references prestamos(id) on delete cascade,
  implemento_id bigint not null references implementos(id),
  codigo text, nombre text, cond_salida text, vence timestamptz not null,
  devuelto timestamptz, cond_regreso text, limpio boolean, novedad text default '', recibido_por text);
create table prestamo_eventos(
  id bigint generated always as identity primary key, t timestamptz not null default now(),
  prestamo_id bigint, numero text, tipo text not null, detalle text default '', apodo text);
create index on prestamo_items(prestamo_id); create index on prestamo_eventos(t desc);
create sequence prestamo_seq;

alter table implementos enable row level security; alter table prestamos enable row level security;
alter table prestamo_items enable row level security; alter table prestamo_eventos enable row level security;
revoke all on implementos, prestamos, prestamo_items, prestamo_eventos from anon, authenticated;
grant select on prestamos, prestamo_items, prestamo_eventos, implementos to authenticated;
grant insert, update, delete on implementos to authenticated;
create policy ver_impl on implementos for select to authenticated using (true);
create policy adm_impl on implementos for all to authenticated using (es_admin()) with check (es_admin());
create policy ver_prest on prestamos for select to authenticated using (true);
create policy ver_pitem on prestamo_items for select to authenticated using (true);
create policy ver_pev on prestamo_eventos for select to authenticated using (true);

create function crear_prestamo(p_nombre text, p_documento text, p_telefono text, p_ids bigint[], p_notas text default '')
returns prestamos language plpgsql security definer set search_path=public as $$
declare ap text; pr prestamos; im implementos; n int := 0;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if length(trim(coalesce(p_nombre,'')))<2 or length(trim(coalesce(p_documento,'')))<4 then raise exception 'Faltan nombre o documento'; end if;
  if coalesce(array_length(p_ids,1),0)=0 then raise exception 'Elige al menos un implemento'; end if;
  select apodo into ap from perfiles where id=auth.uid();
  insert into prestamos(numero,nombre,documento,telefono,notas,entregado_por)
    values('P-'||extract(year from now())::int||'-'||lpad(nextval('prestamo_seq')::text,4,'0'),trim(p_nombre),trim(p_documento),
    coalesce(p_telefono,''),coalesce(p_notas,''),ap) returning * into pr;
  for im in select * from implementos where id=any(p_ids) order by id for update loop
    if im.estado<>'disponible' then raise exception '% no está disponible',im.nombre; end if;
    update implementos set estado='prestado' where id=im.id;
    insert into prestamo_items(prestamo_id,implemento_id,codigo,nombre,cond_salida,vence)
      values(pr.id,im.id,im.codigo,im.nombre,im.condicion,now()+make_interval(days=>im.dias_plazo));
    n := n+1;
  end loop;
  if n<>array_length(p_ids,1) then raise exception 'Algún implemento no existe'; end if;
  insert into prestamo_eventos(prestamo_id,numero,tipo,detalle,apodo) values(pr.id,pr.numero,'prestamo',n||' implemento(s) a '||pr.nombre,ap);
  return pr;
end $$;

create function registrar_devolucion(p_item bigint, p_condicion text, p_limpio boolean, p_novedad text default '')
returns void language plpgsql security definer set search_path=public as $$
declare it prestamo_items; ap text; pr prestamos;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if p_condicion not in ('bueno','danado','perdido') then raise exception 'Condición inválida'; end if;
  select * into it from prestamo_items where id=p_item for update;
  if not found or it.devuelto is not null then raise exception 'Ítem no válido o ya devuelto'; end if;
  select apodo into ap from perfiles where id=auth.uid();
  update prestamo_items set devuelto=now(),cond_regreso=p_condicion,limpio=p_limpio,novedad=coalesce(p_novedad,''),recibido_por=ap where id=p_item;
  update implementos set estado=case when p_condicion='perdido' then 'perdido' when p_condicion='danado' then 'en_reparacion'
    when not p_limpio then 'por_limpiar' else 'disponible' end,
    condicion=case when p_condicion='bueno' then condicion else p_condicion end where id=it.implemento_id;
  select * into pr from prestamos where id=it.prestamo_id;
  if not exists(select 1 from prestamo_items where prestamo_id=it.prestamo_id and devuelto is null) then
    update prestamos set estado='cerrado' where id=it.prestamo_id; end if;
  insert into prestamo_eventos(prestamo_id,numero,tipo,detalle,apodo)
    values(pr.id,pr.numero,'devolucion',it.nombre||' · '||p_condicion||case when p_limpio then '' else ' · sin limpiar' end,ap);
end $$;

create function marcar_limpio(p_id bigint) returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  update implementos set estado='disponible' where id=p_id and estado='por_limpiar';
end $$;

revoke execute on function crear_prestamo, registrar_devolucion, marcar_limpio from public, anon;
grant execute on function crear_prestamo, registrar_devolucion, marcar_limpio to authenticated;
alter publication supabase_realtime add table implementos, prestamos, prestamo_items, prestamo_eventos;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
