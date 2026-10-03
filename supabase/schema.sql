create type rol_usuario as enum ('admin','estudiante');

create table perfiles(
  id uuid primary key references auth.users(id) on delete cascade,
  apodo text not null unique,
  nombre text not null default '', apellido text default '', telefono text default '',
  correo text default '', animal text default '',
  rol rol_usuario not null default 'estudiante',
  oculto boolean not null default false,
  creado timestamptz not null default now());

create function es_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from perfiles where id=auth.uid() and rol='admin') $$;

create function nuevo_usuario() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into perfiles(id,apodo,nombre,apellido,telefono,correo,animal) values(
    new.id, coalesce(new.raw_user_meta_data->>'apodo', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'nombre',''), coalesce(new.raw_user_meta_data->>'apellido',''),
    coalesce(new.raw_user_meta_data->>'telefono',''), coalesce(new.raw_user_meta_data->>'correo',''),
    coalesce(new.raw_user_meta_data->>'animal',''));
  return new;
end $$;
create function validar_codigo() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if coalesce(new.raw_user_meta_data->>'codigo','') <> coalesce((select valor from config where clave='codigo_registro'),'#') then
    raise exception 'Código de registro incorrecto';
  end if;
  return new;
end $$;
create trigger validar_codigo before insert on auth.users for each row execute function validar_codigo();
create trigger al_crear_usuario after insert on auth.users for each row execute function nuevo_usuario();

create function proteger_rol() returns trigger language plpgsql as $$
begin
  if new.rol is distinct from old.rol and auth.uid() is not null then
    if not es_admin() then raise exception 'Solo un admin puede cambiar roles'; end if;
    if lower(old.apodo)='kokoa' then raise exception 'El rol de Kokoa no se puede cambiar'; end if;
  end if;
  return new;
end $$;
create trigger proteger_rol before update on perfiles for each row execute function proteger_rol();

create table zonas(id text primary key, nombre text not null, temp text default '', max text default '', mala boolean default false, orden int not null default 0);
create table tipos(nombre text primary key, zona text references zonas(id) on update cascade, orden int default 0);

create table alimentos(
  sku text primary key, nombre text not null,
  tipo text references tipos(nombre) on update cascade,
  unidad text not null check (unidad in ('kg','L','unid.')),
  zona text references zonas(id) on update cascade,
  vence date,
  stock numeric not null default 0 check (stock >= 0),
  minimo numeric not null default 0 check (minimo >= 0),
  conteo numeric,
  lotes jsonb not null default '[]',
  actualizado timestamptz not null default now());

create table movimientos(
  id bigint generated always as identity primary key,
  t timestamptz not null default now(),
  sku text, nombre text, tipo text, unidad text,
  delta numeric not null, motivo text default '',
  usuario uuid, apodo text);
create index on movimientos(t desc);

create table comidas(id bigint generated always as identity primary key, t timestamptz not null default now(),
  tipo text, nombre text, items jsonb not null default '[]', apodo text);
create table config(clave text primary key, valor text not null);
create table bitacora(id bigint generated always as identity primary key, t timestamptz not null default now(),
  clase text default 'cnt', texto text not null, apodo text);

create function registrar_movimiento(p_sku text, p_delta numeric, p_motivo text default '', p_vence date default null)
returns alimentos language plpgsql security definer set search_path=public as $$
declare a alimentos; ap text; resto numeric; l jsonb; nl jsonb := '[]'; q numeric; t numeric;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if p_delta is null or p_delta = 0 then raise exception 'Cantidad inválida'; end if;
  select * into a from alimentos where sku=p_sku for update;
  if not found then raise exception 'El alimento no existe'; end if;
  if p_delta > 0 then
    nl := a.lotes || jsonb_build_array(jsonb_build_object('q',p_delta,'exp',p_vence));
  else
    resto := -p_delta;
    for l in select value from jsonb_array_elements(a.lotes) order by value->>'exp' nulls last loop
      q := (l->>'q')::numeric; t := least(resto,q); resto := resto - t;
      if q - t > 0 then nl := nl || jsonb_build_array(jsonb_set(l,'{q}',to_jsonb(q - t))); end if;
    end loop;
  end if;
  update alimentos set stock=stock+p_delta, lotes=nl, actualizado=now() where sku=p_sku returning * into a;
  select apodo into ap from perfiles where id=auth.uid();
  insert into movimientos(sku,nombre,tipo,unidad,delta,motivo,usuario,apodo)
    values(a.sku,a.nombre,a.tipo,a.unidad,p_delta,p_motivo,auth.uid(),ap);
  return a;
end $$;

create function registrar_comida(p_tipo text, p_nombre text, p_items jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare x jsonb; ap text;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  for x in select value from jsonb_array_elements(p_items) loop
    perform registrar_movimiento(x->>'sku', -(x->>'q')::numeric, coalesce(x->>'motivo', p_tipo));
  end loop;
  select apodo into ap from perfiles where id=auth.uid();
  insert into comidas(tipo,nombre,items,apodo) values(p_tipo,p_nombre,p_items,ap);
end $$;

create function eliminar_usuario(p_id uuid) returns void language plpgsql security definer set search_path=public,auth as $$
begin
  if p_id <> auth.uid() and not es_admin() then raise exception 'No autorizado'; end if;
  if exists (select 1 from perfiles where id=p_id and lower(apodo)='kokoa') then raise exception 'Kokoa no se puede eliminar'; end if;
  delete from auth.users where id=p_id;
end $$;

create function correo_de_usuario(p_apodo text) returns text language sql stable security definer set search_path=public,auth as
$$ select u.email::text from auth.users u join perfiles p on p.id=u.id where lower(p.apodo)=lower(trim(p_apodo)) limit 1 $$;
create function ping() returns text language sql as $$ select 'ok' $$;

alter table perfiles enable row level security;  alter table zonas enable row level security;
alter table tipos enable row level security;     alter table alimentos enable row level security;
alter table movimientos enable row level security; alter table comidas enable row level security;
alter table bitacora enable row level security;
alter table config enable row level security;

create policy ver_perfil   on perfiles for select to authenticated using (id=auth.uid() or (es_admin() and not oculto));
create policy editar_perfil on perfiles for update to authenticated using (id=auth.uid() or es_admin()) with check (id=auth.uid() or es_admin());

create policy ver_zonas  on zonas for select to authenticated using (true);
create policy adm_zonas  on zonas for all to authenticated using (es_admin()) with check (es_admin());
create policy ver_tipos  on tipos for select to authenticated using (true);
create policy adm_tipos  on tipos for all to authenticated using (es_admin()) with check (es_admin());

create policy ver_ali    on alimentos for select to authenticated using (true);
create policy crear_ali  on alimentos for insert to authenticated with check (stock=0 and lotes='[]'::jsonb);
create policy mod_ali    on alimentos for update to authenticated using (true) with check (true);
create policy borrar_ali on alimentos for delete to authenticated using (true);
revoke all on all tables in schema public from anon;
revoke update on alimentos from authenticated;
grant update(nombre,tipo,unidad,zona,vence,minimo,conteo) on alimentos to authenticated;
revoke insert,update,delete on movimientos, comidas from authenticated;

create policy adm_config on config for all to authenticated using (es_admin()) with check (es_admin());
create policy ver_mov on movimientos for select to authenticated using (true);
create policy ver_com on comidas     for select to authenticated using (true);
create policy ver_bit on bitacora    for select to authenticated using (true);
create policy add_bit on bitacora    for insert to authenticated with check (true);
create policy add_com on comidas     for insert to authenticated with check (true);

revoke execute on all functions in schema public from public;
grant execute on function registrar_movimiento, registrar_comida, eliminar_usuario, es_admin to authenticated;
grant execute on function ping, correo_de_usuario to anon, authenticated;

alter publication supabase_realtime add table alimentos, movimientos, comidas, bitacora, zonas, tipos;

insert into zonas(id,nombre,orden) values('B','Congelador',0),('C','Despensa seca',1);
insert into config values('codigo_registro','CAMBIA-ESTE-CODIGO');
insert into tipos(nombre,zona,orden) values('Verduras y frutas','B',1),('Proteínas vegetales','B',2),('Lácteos vegetales','B',3),
 ('Congelados','B',4),('Granos y legumbres','C',5),('Aceites y condimentos','C',6);

grant usage on schema public to anon, authenticated;
grant select, update on perfiles to authenticated;
grant select on movimientos, comidas, bitacora to authenticated;
grant insert on bitacora, comidas to authenticated;
grant select, insert, update, delete on config to authenticated;
grant select, insert, delete on alimentos to authenticated;
grant select, insert, update, delete on zonas, tipos to authenticated;
create or replace function crear_usuario(p_apodo text, p_clave text, p_nombre text, p_apellido text, p_telefono text, p_correo text, p_animal text, p_rol rol_usuario)
returns void language plpgsql security definer set search_path=public,auth,extensions as $$
declare uid uuid := gen_random_uuid(); cod text; em text;
begin
  if not es_admin() then raise exception 'No autorizado'; end if;
  if length(coalesce(p_clave,'')) < 8 then raise exception 'La clave debe tener mínimo 8 caracteres'; end if;
  if exists (select 1 from perfiles where lower(apodo)=lower(trim(p_apodo))) then raise exception 'Ese apodo ya está en uso'; end if;
  em := lower(regexp_replace(trim(p_apodo),'[^a-zA-Z0-9]+','','g')) || '@kokoa.app';
  if em = '@kokoa.app' or exists (select 1 from auth.users where email=em) then em := left(uid::text,8) || '@kokoa.app'; end if;
  select valor into cod from config where clave='codigo_registro';
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
  update perfiles set rol=p_rol where id=uid;
end $$;
revoke execute on function crear_usuario(text,text,text,text,text,text,text,rol_usuario) from public;
grant execute on function crear_usuario(text,text,text,text,text,text,text,rol_usuario) to authenticated;
