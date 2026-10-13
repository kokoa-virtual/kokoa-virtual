-- =====================================================================
-- Migración 2026-10-12 — decisiones de permisos y comportamiento
-- Ejecutar UNA vez en Supabase → SQL Editor, después de leer docs/DECISIONES.md.
-- Es idempotente en lo posible (drop … if exists / create or replace).
-- Todo va en una transacción: si algo falla, no se aplica nada.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. USUARIOS Y ROLES
-- ---------------------------------------------------------------------

-- (P4b) Cualquier admin puede crear admins.
create or replace function public.crear_usuario(p_apodo text, p_clave text, p_nombre text, p_apellido text, p_telefono text, p_correo text, p_animal text, p_rol rol_usuario)
returns void language plpgsql security definer set search_path to 'public','auth','extensions' as $function$
declare uid uuid := gen_random_uuid(); cod text; em text;
begin
  if not es_admin() then raise exception 'No autorizado'; end if;
  if length(coalesce(p_clave,'')) < 8 then raise exception 'La clave debe tener mínimo 8 caracteres'; end if;
  if exists (select 1 from perfiles where lower(apodo) = lower(trim(p_apodo))) then raise exception 'Ese apodo ya está en uso'; end if;
  em := lower(regexp_replace(trim(p_apodo),'[^a-zA-Z0-9]+','','g')) || '@kokoa.app';
  if em = '@kokoa.app' or exists (select 1 from auth.users where email = em) then em := left(uid::text,8) || '@kokoa.app'; end if;
  select valor into cod from config where clave = 'codigo_registro';
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
      confirmation_token,recovery_token,email_change,email_change_token_new,email_change_token_current,phone_change,phone_change_token,reauthentication_token)
  values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,
      crypt(p_clave, gen_salt('bf')),now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('apodo',trim(p_apodo),'nombre',p_nombre,'apellido',p_apellido,'telefono',p_telefono,'correo',coalesce(p_correo,''),'animal',p_animal,'codigo',cod),now(),now(),
      '','','','','','','','');
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values(gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now());
  update perfiles set rol = p_rol where id = uid;
end $function$;

-- (P4b) proteger_rol: se quita "solo Kokoa/Joa crean admins"; se mantiene todo lo demás.
create or replace function public.proteger_rol()
returns trigger language plpgsql set search_path to 'public','pg_temp' as $function$
begin
  if auth.uid() is null then return new; end if; -- editor SQL / mantenimiento
  if new.rol is distinct from old.rol then
    if not es_admin() then raise exception 'Solo un admin puede cambiar roles'; end if;
    if lower(old.apodo) in ('kokoa','joa') then raise exception 'El rol de Kokoa y Joa no se puede cambiar'; end if;
  end if;
  if lower(old.apodo) = 'kokoa' and lower(new.apodo) <> 'kokoa' then
    raise exception 'Kokoa no se puede renombrar'; end if;
  if lower(new.apodo) in ('kokoa','joa') and lower(old.apodo) <> lower(new.apodo) then
    raise exception 'Apodo reservado'; end if;
  return new;
end $function$;

-- (P6b) Solo Joa puede ocultar o mostrar usuarios (columna oculto).
create or replace function public.proteger_oculto()
returns trigger language plpgsql security definer set search_path to 'public','pg_temp' as $function$
begin
  if auth.uid() is null then return new; end if;
  if new.oculto is distinct from old.oculto
     and not exists (select 1 from perfiles where id = auth.uid() and lower(apodo) = 'joa') then
    raise exception 'Solo Joa puede ocultar o mostrar usuarios';
  end if;
  return new;
end $function$;
drop trigger if exists proteger_oculto on public.perfiles;
create trigger proteger_oculto before update on public.perfiles
  for each row when (old.oculto is distinct from new.oculto) execute function public.proteger_oculto();

-- Joa oculta o muestra a otros por apodo (un UPDATE directo no sirve: la política de
-- lectura de perfiles impide a un admin modificar la fila de alguien que queda oculto).
create or replace function public.ocultar_usuario(p_apodo text, p_oculto boolean)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not exists (select 1 from perfiles where id = auth.uid() and lower(apodo) = 'joa') then
    raise exception 'Solo Joa puede ocultar o mostrar usuarios'; end if;
  update perfiles set oculto = p_oculto where lower(apodo) = lower(trim(p_apodo));
  if not found then raise exception 'El usuario no existe'; end if;
end $function$;
revoke all on function public.ocultar_usuario(text,boolean) from public, anon;
grant execute on function public.ocultar_usuario(text,boolean) to authenticated;

-- (P7a) Cada usuario puede eliminar su propia cuenta; un admin puede eliminar a otros.
-- Kokoa y Joa siguen protegidos.
create or replace function public.eliminar_usuario(p_id uuid)
returns void language plpgsql security definer set search_path to 'public','auth' as $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if p_id <> auth.uid() and not es_admin() then raise exception 'No autorizado'; end if;
  if exists (select 1 from perfiles where id = p_id and lower(apodo) in ('kokoa','joa')) then
    raise exception 'Este usuario no se puede eliminar'; end if;
  delete from auth.users where id = p_id;
end $function$;

-- (P12a) Un admin puede resetear la clave de otro usuario. Para Kokoa y Joa solo
-- ellos mismos (o el otro de los dos). Mínimo 8 caracteres, como en crear_usuario.
create or replace function public.admin_resetear_clave(p_id uuid, p_clave text)
returns void language plpgsql security definer set search_path to 'public','auth','extensions' as $function$
declare ap text; objetivo text;
begin
  if not es_admin() then raise exception 'No autorizado'; end if;
  if length(coalesce(p_clave,'')) < 8 then raise exception 'La clave debe tener mínimo 8 caracteres'; end if;
  select lower(apodo) into objetivo from perfiles where id = p_id;
  if objetivo is null then raise exception 'El usuario no existe'; end if;
  if objetivo in ('kokoa','joa') and p_id <> auth.uid() and not es_super() then
    raise exception 'Solo Kokoa o Joa pueden cambiar esa clave'; end if;
  update auth.users set encrypted_password = crypt(p_clave, gen_salt('bf')), updated_at = now() where id = p_id;
  select apodo into ap from perfiles where id = auth.uid();
  insert into bitacora(clase, texto, apodo) values ('adj', 'Clave restablecida a ' || objetivo, ap);
end $function$;
revoke all on function public.admin_resetear_clave(uuid,text) from public, anon;
grant execute on function public.admin_resetear_clave(uuid,text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. ALIMENTOS
-- ---------------------------------------------------------------------

-- (P15b) Se permite stock negativo (la app debe avisar). Se elimina el CHECK stock >= 0.
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.alimentos'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) like '%stock >= %' loop
    execute format('alter table public.alimentos drop constraint %I', c);
  end loop;
end $$;

-- (P16a) El borrado de alimentos ya lo registra la app en la bitácora; no se añade trigger para no duplicarlo.

-- ---------------------------------------------------------------------
-- 3. HISTORIAL
-- ---------------------------------------------------------------------

-- (P22b) Solo Kokoa y Joa borran historial de alimentos.
create or replace function public.borrar_historial(p_tabla text default 'todo', p_id bigint default null)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if not es_super() then raise exception 'Solo Kokoa o Joa pueden borrar el historial'; end if;
  if p_tabla not in ('movimientos','comidas','bitacora','todo') then raise exception 'Tabla inválida'; end if;
  if p_tabla = 'todo' then
    delete from movimientos where true;
    delete from comidas where true;
    delete from bitacora where true;
  elsif p_id is null then
    execute format('delete from %I where true', p_tabla);
  else
    execute format('delete from %I where id = $1', p_tabla) using p_id;
  end if;
end $function$;

-- (P23) Limpieza anual el 1 de mayo. Conserva los movimientos de inventario que
-- están ligados a un asiento contable (respaldo de la contabilidad).
create or replace function public.limpiar_historial_anual()
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  delete from movimientos where asiento_id is null;
  delete from comidas where true;
  delete from bitacora where true;

  delete from prestamo_eventos where true;
  delete from prestamo_items
   where prestamo_id in (
     select p.id from prestamos p
      where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id and i.devuelto is null));
  delete from prestamos p
   where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id);
end $function$;
revoke all on function public.limpiar_historial_anual() from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. PRÉSTAMOS
-- ---------------------------------------------------------------------

-- (P30b) Cualquier usuario con sesión gestiona implementos, tipos y estados.
drop policy if exists impl_adm_i on public.implementos;
drop policy if exists impl_adm_u on public.implementos;
drop policy if exists impl_adm_d on public.implementos;
drop policy if exists impl_ins on public.implementos;
create policy impl_ins on public.implementos for insert to authenticated with check (true);
drop policy if exists impl_upd on public.implementos;
create policy impl_upd on public.implementos for update to authenticated using (true) with check (true);
drop policy if exists impl_del on public.implementos;
create policy impl_del on public.implementos for delete to authenticated using (true);

drop policy if exists adm_tipos_imp_i on public.tipos_implemento;
drop policy if exists adm_tipos_imp_u on public.tipos_implemento;
drop policy if exists adm_tipos_imp_d on public.tipos_implemento;
drop policy if exists tipos_imp_ins on public.tipos_implemento;
create policy tipos_imp_ins on public.tipos_implemento for insert to authenticated with check (true);
drop policy if exists tipos_imp_upd on public.tipos_implemento;
create policy tipos_imp_upd on public.tipos_implemento for update to authenticated using (true) with check (true);
drop policy if exists tipos_imp_del on public.tipos_implemento;
create policy tipos_imp_del on public.tipos_implemento for delete to authenticated using (true);

drop policy if exists adm_estados_imp_i on public.estados_implemento;
drop policy if exists adm_estados_imp_u on public.estados_implemento;
drop policy if exists adm_estados_imp_d on public.estados_implemento;
drop policy if exists estados_imp_ins on public.estados_implemento;
create policy estados_imp_ins on public.estados_implemento for insert to authenticated with check (true);
drop policy if exists estados_imp_upd on public.estados_implemento;
create policy estados_imp_upd on public.estados_implemento for update to authenticated using (true) with check (true);
drop policy if exists estados_imp_del on public.estados_implemento;
create policy estados_imp_del on public.estados_implemento for delete to authenticated using (true);

create or replace function public.eliminar_estado_implemento(p_clave text, p_destino text)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if p_clave = p_destino then raise exception 'El destino debe ser distinto'; end if;
  update implementos set estado = p_destino where estado = p_clave;
  delete from estados_implemento where clave = p_clave;
end $function$;

create or replace function public.eliminar_tipo_implemento(p_nombre text, p_destino text)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if p_nombre = coalesce(p_destino,'') then raise exception 'El destino debe ser distinto'; end if;
  update implementos set categoria = coalesce(p_destino,'') where categoria = p_nombre;
  delete from tipos_implemento where nombre = p_nombre;
end $function$;

-- Las ediciones de implementos las hace cualquier usuario, así que también se registran.
create or replace function public.registrar_edicion_prestamos(p_detalle text)
returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  insert into prestamo_eventos(tipo, detalle, apodo)
  values ('edicion', p_detalle, (select apodo from perfiles where id = auth.uid()));
end $function$;

-- (P28) Datos personales de quien pidió prestado: 6 meses después de la última
-- devolución se anonimizan (se conserva el préstamo para las estadísticas).
create or replace function public.anonimizar_prestamos_antiguos()
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare ids bigint[]; nums text[];
begin
  select array_agg(p.id), array_agg(p.numero) into ids, nums
    from prestamos p
   where p.estado = 'cerrado' and p.nombre <> '(anonimizado)'
     and not exists (select 1 from prestamo_items i
                      where i.prestamo_id = p.id
                        and (i.devuelto is null or i.devuelto > now() - interval '6 months'));
  if ids is null then return 0; end if;
  update prestamos set nombre = '(anonimizado)', documento = '-', telefono = '', notas = '' where id = any(ids);
  update prestamo_eventos set detalle = regexp_replace(detalle, ' a .*$', ' a (anonimizado)')
   where tipo = 'prestamo' and numero = any(nums);
  return array_length(ids, 1);
end $function$;
revoke all on function public.anonimizar_prestamos_antiguos() from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. CONTABILIDAD
-- ---------------------------------------------------------------------

-- (P35b) Solo Kokoa y Joa cierran y reabren períodos; los admins solo los ven.
drop policy if exists cnt_cierres_all on public.cnt_cierres;
drop policy if exists cnt_cierres_sel on public.cnt_cierres;
create policy cnt_cierres_sel on public.cnt_cierres for select to authenticated using ((select cnt_admin()));
drop policy if exists cnt_cierres_ins on public.cnt_cierres;
create policy cnt_cierres_ins on public.cnt_cierres for insert to authenticated with check ((select es_super()));
drop policy if exists cnt_cierres_upd on public.cnt_cierres;
create policy cnt_cierres_upd on public.cnt_cierres for update to authenticated using ((select es_super())) with check ((select es_super()));
drop policy if exists cnt_cierres_del on public.cnt_cierres;
create policy cnt_cierres_del on public.cnt_cierres for delete to authenticated using ((select es_super()));

-- (P36a, P38a) Auditoría contable: quién cambió qué y cuándo. Nadie puede editarla
-- ni borrarla desde la app (no hay permisos ni políticas de escritura).
create table if not exists public.cnt_auditoria(
  id bigint generated always as identity primary key,
  t timestamptz not null default now(),
  usuario uuid,
  apodo text,
  tabla text not null,
  op text not null,
  antes jsonb,
  despues jsonb);
create index if not exists cnt_auditoria_t_idx on public.cnt_auditoria(t desc);
create index if not exists cnt_auditoria_tabla_idx on public.cnt_auditoria(tabla, t desc);
alter table public.cnt_auditoria enable row level security;
drop policy if exists cnt_auditoria_sel on public.cnt_auditoria;
create policy cnt_auditoria_sel on public.cnt_auditoria for select to authenticated using ((select cnt_admin()));
revoke all on public.cnt_auditoria from anon, authenticated;
grant select on public.cnt_auditoria to authenticated;

create or replace function public.cnt_auditar()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  insert into cnt_auditoria(usuario, apodo, tabla, op, antes, despues)
  values (auth.uid(), (select apodo from perfiles where id = auth.uid()), tg_table_name, tg_op,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return null;
end $function$;

do $$
declare t text;
begin
  foreach t in array array['cnt_asientos','cnt_lineas','cnt_terceros','cnt_cuentas','cnt_presupuesto',
                           'cnt_cierres','cnt_extractos','cnt_conciliaciones','cnt_precios'] loop
    execute format('drop trigger if exists cnt_auditar on public.%I', t);
    execute format('create trigger cnt_auditar after insert or update or delete on public.%I
                    for each row execute function public.cnt_auditar()', t);
  end loop;
end $$;

-- (P36a) Cerrar o reabrir un período también deja una línea visible en la bitácora.
create or replace function public.cnt_cierre_log()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare ap text;
begin
  select apodo into ap from perfiles where id = auth.uid();
  insert into bitacora(clase, texto, apodo)
  values ('adj', case tg_op when 'INSERT' then 'Período cerrado: ' || new.periodo
                            else 'Período reabierto: ' || old.periodo end, ap);
  return null;
end $function$;
drop trigger if exists cnt_cierre_log on public.cnt_cierres;
create trigger cnt_cierre_log after insert or delete on public.cnt_cierres
  for each row execute function public.cnt_cierre_log();

-- Cierra una función que quedó con permisos por defecto (ejecutable por cualquiera).
revoke all on function public.cnt_eliminar_tercero(bigint) from public, anon;
grant execute on function public.cnt_eliminar_tercero(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 6. MENÚ SEMANAL PÚBLICO (P44a)
-- ---------------------------------------------------------------------
create table if not exists public.menu_semana(
  dia smallint primary key check (dia between 1 and 5),   -- 1 = lunes … 5 = viernes
  plato text not null default '' check (length(plato) <= 120 and plato !~ '[<>"`]'),
  actualizado timestamptz not null default now(),
  apodo text);
insert into public.menu_semana(dia) select g from generate_series(1,5) g on conflict do nothing;
alter table public.menu_semana enable row level security;
drop policy if exists menu_ver on public.menu_semana;
drop policy if exists menu_edit on public.menu_semana;
create policy menu_ver  on public.menu_semana for select to anon, authenticated using (true);
drop policy if exists menu_edit on public.menu_semana;
create policy menu_edit on public.menu_semana for update to authenticated
  using ((select es_admin())) with check ((select es_admin()));
revoke all on public.menu_semana from anon, authenticated;
grant select on public.menu_semana to anon, authenticated;
grant update(plato, actualizado, apodo) on public.menu_semana to authenticated;

-- ---------------------------------------------------------------------
-- 7. TAREAS PROGRAMADAS (pg_cron)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job
      where jobname in ('kokoa-limpiar-historial','kokoa-anonimizar-prestamos');
    -- 1 de mayo, 05:00 UTC = 00:00 en Bogotá
    perform cron.schedule('kokoa-limpiar-historial', '0 5 1 5 *', 'select public.limpiar_historial_anual()');
    -- todos los días, 05:30 UTC = 00:30 en Bogotá
    perform cron.schedule('kokoa-anonimizar-prestamos', '30 5 * * *', 'select public.anonimizar_prestamos_antiguos()');
  else
    raise notice 'pg_cron no está disponible: actívalo en Database → Extensions y vuelve a ejecutar este bloque.';
  end if;
end $$;

commit;
