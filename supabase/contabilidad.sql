create or replace function cnt_admin() returns boolean
language sql stable security definer set search_path=public as
$$ select exists(select 1 from perfiles where id=auth.uid() and rol='admin') $$;

create table if not exists cnt_cuentas(
  codigo text primary key, nombre text not null,
  tipo text not null check(tipo in('A','P','T','I','G','C')));

create table if not exists cnt_terceros(
  id bigint generated always as identity primary key,
  nombre text not null, documento text, tipo text not null default 'proveedor',
  relacionado boolean not null default false, no_obligado boolean not null default false,
  t timestamptz not null default now());

create table if not exists cnt_asientos(
  id bigint generated always as identity primary key,
  numero text not null unique, fecha date not null,
  tipo text not null check(tipo in('ingreso','egreso','ajuste','apertura')),
  tercero_id bigint references cnt_terceros(id),
  concepto text not null, soporte_tipo text, soporte_num text,
  donacion boolean not null default false, condicionada boolean not null default false,
  especie boolean not null default false, valor numeric not null default 0,
  estado text not null default 'activo' check(estado in('activo','anulado')),
  motivo_anulacion text, apodo text, t timestamptz not null default now());

create table if not exists cnt_lineas(
  id bigint generated always as identity primary key,
  asiento_id bigint not null references cnt_asientos(id),
  cuenta text not null references cnt_cuentas(codigo),
  debito numeric not null default 0 check(debito>=0),
  credito numeric not null default 0 check(credito>=0),
  check((debito=0)<>(credito=0)));

create table if not exists cnt_cierres(
  periodo text primary key check(periodo ~ '^\d{4}-\d{2}$'), t timestamptz not null default now());

alter table cnt_cuentas enable row level security;
alter table cnt_terceros enable row level security;
alter table cnt_asientos enable row level security;
alter table cnt_lineas enable row level security;
alter table cnt_cierres enable row level security;

drop policy if exists cnt_cuentas_all on cnt_cuentas;
create policy cnt_cuentas_all on cnt_cuentas for all using(cnt_admin()) with check(cnt_admin());
drop policy if exists cnt_terceros_all on cnt_terceros;
create policy cnt_terceros_all on cnt_terceros for all using(cnt_admin()) with check(cnt_admin());
drop policy if exists cnt_cierres_all on cnt_cierres;
create policy cnt_cierres_all on cnt_cierres for all using(cnt_admin()) with check(cnt_admin());
drop policy if exists cnt_asientos_sel on cnt_asientos;
create policy cnt_asientos_sel on cnt_asientos for select using(cnt_admin());
drop policy if exists cnt_lineas_sel on cnt_lineas;
create policy cnt_lineas_sel on cnt_lineas for select using(cnt_admin());

create or replace function cnt_crear_asiento(p_cab jsonb, p_lineas jsonb) returns text
language plpgsql security definer set search_path=public as $$
declare
  v_f date := (p_cab->>'fecha')::date; v_tipo text := p_cab->>'tipo';
  v_d numeric; v_c numeric; v_id bigint; v_num text; v_ap text;
begin
  if not cnt_admin() then raise exception 'Solo un admin puede registrar asientos'; end if;
  if exists(select 1 from cnt_cierres where periodo = to_char(v_f,'YYYY-MM')) then
    raise exception 'El período % está cerrado', to_char(v_f,'YYYY-MM'); end if;
  select coalesce(sum((x->>'debito')::numeric),0), coalesce(sum((x->>'credito')::numeric),0)
    into v_d, v_c from jsonb_array_elements(p_lineas) x;
  if jsonb_array_length(p_lineas) < 2 or v_d <= 0 or round(v_d,2) <> round(v_c,2) then
    raise exception 'El asiento no cuadra: débitos % y créditos %', v_d, v_c; end if;
  perform pg_advisory_xact_lock(7731);
  select apodo into v_ap from perfiles where id = auth.uid();
  select (case v_tipo when 'ingreso' then 'CI' when 'egreso' then 'CE' when 'apertura' then 'AP' else 'AJ' end)
         || '-' || lpad((count(*)+1)::text,5,'0') into v_num from cnt_asientos where tipo = v_tipo;
  insert into cnt_asientos(numero,fecha,tipo,tercero_id,concepto,soporte_tipo,soporte_num,donacion,condicionada,especie,valor,apodo)
  values(v_num, v_f, v_tipo, nullif(p_cab->>'tercero_id','')::bigint, p_cab->>'concepto',
         nullif(p_cab->>'soporte_tipo',''), nullif(p_cab->>'soporte_num',''),
         coalesce((p_cab->>'donacion')::boolean,false), coalesce((p_cab->>'condicionada')::boolean,false),
         coalesce((p_cab->>'especie')::boolean,false), v_d, v_ap)
  returning id into v_id;
  insert into cnt_lineas(asiento_id,cuenta,debito,credito)
  select v_id, x->>'cuenta', (x->>'debito')::numeric, (x->>'credito')::numeric from jsonb_array_elements(p_lineas) x;
  return v_num;
end $$;

create or replace function cnt_anular(p_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path=public as $$
declare v_f date;
begin
  if not cnt_admin() then raise exception 'Solo un admin puede anular asientos'; end if;
  select fecha into v_f from cnt_asientos where id = p_id and estado = 'activo';
  if v_f is null then raise exception 'El asiento no existe o ya está anulado'; end if;
  if exists(select 1 from cnt_cierres where periodo = to_char(v_f,'YYYY-MM')) then
    raise exception 'El período % está cerrado', to_char(v_f,'YYYY-MM'); end if;
  update cnt_asientos set estado='anulado', motivo_anulacion=p_motivo where id = p_id;
end $$;

grant execute on function cnt_crear_asiento(jsonb,jsonb) to authenticated;
grant execute on function cnt_anular(bigint,text) to authenticated;

insert into cnt_cuentas(codigo,nombre,tipo) values
 ('1105','Caja','A'),('1110','Bancos','A'),('1305','Cuentas por cobrar','A'),('1435','Inventario de alimentos','A'),
 ('2205','Proveedores','P'),('2365','Retención en la fuente','P'),('2408','Impuesto nacional al consumo','P'),('2505','Nómina por pagar','P'),
 ('3105','Fondo social','T'),('3305','Asignaciones permanentes','T'),('3310','Fondos con destinación específica (donaciones condicionadas)','T'),
 ('4105','Donaciones sin condición','I'),('4106','Donaciones en especie','I'),('4210','Cuotas de recuperación','I'),('4215','Ventas gravadas con impuesto al consumo','I'),
 ('5105','Honorarios y servicios','G'),('5110','Nómina y seguridad social','G'),('5115','Servicios públicos','G'),('5120','Arriendo','G'),
 ('5125','Mantenimiento','G'),('5130','Transporte','G'),('5195','Otros gastos','G'),
 ('6105','Costo de alimentos usados en raciones','C')
on conflict (codigo) do nothing;
