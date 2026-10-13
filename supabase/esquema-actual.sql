create type rol_usuario as enum ('admin','estudiante');
create sequence if not exists prestamo_seq;
grant usage on schema public to anon, authenticated;

create table public.alimentos(
  sku text not null,
  nombre text not null,
  tipo text,
  unidad text not null,
  zona text,
  vence date,
  stock numeric not null default 0,
  minimo numeric not null default 0,
  conteo numeric,
  lotes jsonb not null default '[]'::jsonb,
  actualizado timestamp with time zone not null default now()
);
create table public.bitacora(
  id bigint generated always as identity not null,
  t timestamp with time zone not null default now(),
  clase text default 'cnt'::text,
  texto text not null,
  apodo text
);
create table public.cnt_asientos(
  id bigint generated always as identity not null,
  numero text not null,
  fecha date not null,
  tipo text not null,
  tercero_id bigint,
  concepto text not null,
  soporte_tipo text,
  soporte_num text,
  donacion boolean not null default false,
  condicionada boolean not null default false,
  especie boolean not null default false,
  valor numeric not null default 0,
  estado text not null default 'activo'::text,
  motivo_anulacion text,
  apodo text,
  t timestamp with time zone not null default now()
);
create table public.cnt_cierres(
  periodo text not null,
  t timestamp with time zone not null default now()
);
create table public.cnt_conciliaciones(
  corte date not null,
  saldo_extracto numeric not null
);
create table public.cnt_cuentas(
  codigo text not null,
  nombre text not null,
  tipo text not null
);
create table public.cnt_extractos(
  id bigint generated always as identity not null,
  fecha date not null,
  descripcion text not null default ''::text,
  valor numeric not null,
  linea_id bigint,
  t timestamp with time zone not null default now()
);
create table public.cnt_lineas(
  id bigint generated always as identity not null,
  asiento_id bigint not null,
  cuenta text not null,
  debito numeric not null default 0,
  credito numeric not null default 0
);
create table public.cnt_precios(
  id bigint generated always as identity not null,
  fecha date not null default CURRENT_DATE,
  sku text,
  nombre text not null,
  unidad text,
  cantidad numeric,
  valor numeric not null,
  asiento_id bigint,
  tercero_id bigint,
  creado timestamp with time zone not null default now(),
  inv_cant numeric not null default 0,
  inv_rev boolean not null default false
);
create table public.cnt_presupuesto(
  periodo text not null,
  cuenta text not null,
  monto numeric not null
);
create table public.cnt_terceros(
  id bigint generated always as identity not null,
  nombre text not null,
  documento text,
  tipo text not null default 'proveedor'::text,
  relacionado boolean not null default false,
  no_obligado boolean not null default false,
  t timestamp with time zone not null default now()
);
create table public.comidas(
  id bigint generated always as identity not null,
  t timestamp with time zone not null default now(),
  tipo text,
  nombre text,
  items jsonb not null default '[]'::jsonb,
  apodo text
);
create table public.config(
  clave text not null,
  valor text not null
);
create table public.estados_implemento(
  clave text not null,
  nombre text not null,
  orden integer not null default 0
);
create table public.implementos(
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  categoria text default ''::text,
  accesorios text default ''::text,
  valor numeric not null default 0,
  dias_plazo integer not null default 3,
  estado text not null default 'disponible'::text,
  condicion text not null default 'bueno'::text,
  creado timestamp with time zone not null default now()
);
create table public.movimientos(
  id bigint generated always as identity not null,
  t timestamp with time zone not null default now(),
  sku text,
  nombre text,
  tipo text,
  unidad text,
  delta numeric not null,
  motivo text default ''::text,
  usuario uuid,
  apodo text,
  asiento_id bigint
);
create table public.perfiles(
  id uuid not null,
  apodo text not null,
  nombre text not null default ''::text,
  apellido text default ''::text,
  telefono text default ''::text,
  correo text default ''::text,
  animal text default ''::text,
  rol rol_usuario not null default 'estudiante'::rol_usuario,
  creado timestamp with time zone not null default now(),
  oculto boolean not null default false
);
create table public.prestamo_eventos(
  id bigint generated always as identity not null,
  t timestamp with time zone not null default now(),
  prestamo_id bigint,
  numero text,
  tipo text not null,
  detalle text default ''::text,
  apodo text
);
create table public.prestamo_items(
  id bigint generated always as identity not null,
  prestamo_id bigint not null,
  implemento_id bigint,
  codigo text,
  nombre text,
  cond_salida text,
  vence timestamp with time zone not null,
  devuelto timestamp with time zone,
  cond_regreso text,
  limpio boolean,
  novedad text default ''::text,
  recibido_por text
);
create table public.prestamos(
  id bigint generated always as identity not null,
  numero text not null,
  nombre text not null,
  documento text not null,
  telefono text default ''::text,
  notas text default ''::text,
  salida timestamp with time zone not null default now(),
  estado text not null default 'activo'::text,
  entregado_por text,
  autoriza_datos timestamp with time zone not null default now()
);
create table public.push_avisos(
  clave text not null,
  t timestamp with time zone not null default now()
);
create table public.push_subs(
  endpoint text not null,
  usuario uuid not null default auth.uid(),
  p256dh text not null,
  auth text not null,
  creado timestamp with time zone not null default now()
);
create table public.tipos(
  nombre text not null,
  zona text,
  orden integer default 0
);
create table public.tipos_implemento(
  nombre text not null,
  creado timestamp with time zone not null default now(),
  orden integer not null default 0
);
create table public.zonas(
  id text not null,
  nombre text not null,
  temp text default ''::text,
  max text default ''::text,
  mala boolean default false,
  orden integer not null default 0
);

alter table public.alimentos add PRIMARY KEY (sku);
alter table public.bitacora add PRIMARY KEY (id);
alter table public.cnt_asientos add PRIMARY KEY (id);
alter table public.cnt_cierres add PRIMARY KEY (periodo);
alter table public.cnt_conciliaciones add PRIMARY KEY (corte);
alter table public.cnt_cuentas add PRIMARY KEY (codigo);
alter table public.cnt_extractos add PRIMARY KEY (id);
alter table public.cnt_lineas add PRIMARY KEY (id);
alter table public.cnt_precios add PRIMARY KEY (id);
alter table public.cnt_presupuesto add PRIMARY KEY (periodo, cuenta);
alter table public.cnt_terceros add PRIMARY KEY (id);
alter table public.comidas add PRIMARY KEY (id);
alter table public.config add PRIMARY KEY (clave);
alter table public.estados_implemento add PRIMARY KEY (clave);
alter table public.implementos add PRIMARY KEY (id);
alter table public.movimientos add PRIMARY KEY (id);
alter table public.perfiles add PRIMARY KEY (id);
alter table public.prestamo_eventos add PRIMARY KEY (id);
alter table public.prestamo_items add PRIMARY KEY (id);
alter table public.prestamos add PRIMARY KEY (id);
alter table public.push_avisos add PRIMARY KEY (clave);
alter table public.push_subs add PRIMARY KEY (endpoint);
alter table public.tipos add PRIMARY KEY (nombre);
alter table public.tipos_implemento add PRIMARY KEY (nombre);
alter table public.zonas add PRIMARY KEY (id);
alter table public.cnt_asientos add UNIQUE (numero);
alter table public.cnt_extractos add UNIQUE (linea_id);
alter table public.implementos add UNIQUE (codigo);
alter table public.perfiles add UNIQUE (apodo);
alter table public.prestamos add UNIQUE (numero);
alter table public.alimentos add FOREIGN KEY (tipo) REFERENCES tipos(nombre) ON UPDATE CASCADE;
alter table public.alimentos add FOREIGN KEY (zona) REFERENCES zonas(id) ON UPDATE CASCADE;
alter table public.cnt_asientos add FOREIGN KEY (tercero_id) REFERENCES cnt_terceros(id);
alter table public.cnt_extractos add FOREIGN KEY (linea_id) REFERENCES cnt_lineas(id);
alter table public.cnt_lineas add FOREIGN KEY (asiento_id) REFERENCES cnt_asientos(id);
alter table public.cnt_lineas add FOREIGN KEY (cuenta) REFERENCES cnt_cuentas(codigo);
alter table public.cnt_precios add FOREIGN KEY (tercero_id) REFERENCES cnt_terceros(id) ON DELETE SET NULL;
alter table public.cnt_precios add FOREIGN KEY (asiento_id) REFERENCES cnt_asientos(id) ON DELETE CASCADE;
alter table public.cnt_presupuesto add FOREIGN KEY (cuenta) REFERENCES cnt_cuentas(codigo);
alter table public.perfiles add FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.prestamo_items add FOREIGN KEY (implemento_id) REFERENCES implementos(id) ON DELETE SET NULL;
alter table public.prestamo_items add FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE;
alter table public.push_subs add FOREIGN KEY (usuario) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.tipos add FOREIGN KEY (zona) REFERENCES zonas(id) ON UPDATE CASCADE;
alter table public.alimentos add CHECK ((unidad = ANY (ARRAY['kg'::text, 'L'::text, 'unid.'::text])));
alter table public.alimentos add CHECK (((nombre !~ '[<>"`]'::text) AND (length(nombre) <= 80))) NOT VALID;
alter table public.alimentos add CHECK (((sku !~ '[<>"''`&]'::text) AND (length(sku) <= 80))) NOT VALID;
alter table public.alimentos add CHECK ((stock >= (0)::numeric));
alter table public.alimentos add CHECK ((minimo >= (0)::numeric));
alter table public.cnt_asientos add CHECK ((estado = ANY (ARRAY['activo'::text, 'anulado'::text])));
alter table public.cnt_asientos add CHECK ((tipo = ANY (ARRAY['ingreso'::text, 'egreso'::text, 'ajuste'::text, 'apertura'::text])));
alter table public.cnt_cierres add CHECK ((periodo ~ '^\d{4}-\d{2}$'::text));
alter table public.cnt_cuentas add CHECK ((tipo = ANY (ARRAY['A'::text, 'P'::text, 'T'::text, 'I'::text, 'G'::text, 'C'::text])));
alter table public.cnt_extractos add CHECK ((valor <> (0)::numeric));
alter table public.cnt_lineas add CHECK ((debito >= (0)::numeric));
alter table public.cnt_lineas add CHECK ((credito >= (0)::numeric));
alter table public.cnt_lineas add CHECK (((debito = (0)::numeric) <> (credito = (0)::numeric)));
alter table public.cnt_precios add CHECK ((valor >= (0)::numeric));
alter table public.cnt_presupuesto add CHECK ((periodo ~ '^\d{4}-\d{2}$'::text));
alter table public.cnt_presupuesto add CHECK ((monto >= (0)::numeric));
alter table public.implementos add CHECK (((dias_plazo >= 1) AND (dias_plazo <= 60)));
alter table public.implementos add CHECK ((valor >= (0)::numeric));
alter table public.perfiles add CHECK (((apodo !~ '[<>"`]'::text) AND (length(apodo) <= 40))) NOT VALID;
alter table public.prestamos add CHECK ((estado = ANY (ARRAY['activo'::text, 'cerrado'::text])));
alter table public.tipos add CHECK ((nombre !~ '[<>"`]'::text)) NOT VALID;
alter table public.zonas add CHECK ((id !~ '[<>"''`&]'::text)) NOT VALID;
alter table public.zonas add CHECK ((nombre !~ '[<>"`]'::text)) NOT VALID;

CREATE INDEX IF NOT EXISTS alimentos_tipo_idx ON public.alimentos USING btree (tipo);
CREATE INDEX IF NOT EXISTS alimentos_zona_idx ON public.alimentos USING btree (zona);
CREATE INDEX IF NOT EXISTS bitacora_t_idx ON public.bitacora USING btree (t DESC);
CREATE INDEX IF NOT EXISTS cnt_asientos_tipo_idx ON public.cnt_asientos USING btree (tipo);
CREATE INDEX IF NOT EXISTS cnt_asientos_tercero_idx ON public.cnt_asientos USING btree (tercero_id);
CREATE INDEX IF NOT EXISTS cnt_asientos_fecha_idx ON public.cnt_asientos USING btree (fecha);
CREATE INDEX IF NOT EXISTS cnt_extractos_linea_idx ON public.cnt_extractos USING btree (linea_id);
CREATE INDEX IF NOT EXISTS cnt_lineas_cuenta_idx ON public.cnt_lineas USING btree (cuenta);
CREATE INDEX IF NOT EXISTS cnt_lineas_asiento_idx ON public.cnt_lineas USING btree (asiento_id);
CREATE INDEX IF NOT EXISTS cnt_precios_sku_idx ON public.cnt_precios USING btree (sku);
CREATE INDEX IF NOT EXISTS cnt_precios_asiento_idx ON public.cnt_precios USING btree (asiento_id);
CREATE INDEX IF NOT EXISTS comidas_t_idx ON public.comidas USING btree (t DESC);
CREATE INDEX IF NOT EXISTS movimientos_sku_idx ON public.movimientos USING btree (sku);
CREATE INDEX IF NOT EXISTS movimientos_asiento_idx ON public.movimientos USING btree (asiento_id) WHERE (asiento_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS movimientos_t_idx ON public.movimientos USING btree (t DESC);
CREATE UNIQUE INDEX IF NOT EXISTS perfiles_apodo_lower_uq ON public.perfiles USING btree (lower(apodo));
CREATE INDEX IF NOT EXISTS prestamo_eventos_t_idx ON public.prestamo_eventos USING btree (t DESC);
CREATE INDEX IF NOT EXISTS prestamo_items_prestamo_id_idx ON public.prestamo_items USING btree (prestamo_id);
CREATE INDEX IF NOT EXISTS prestamo_items_pendientes_idx ON public.prestamo_items USING btree (prestamo_id) WHERE (devuelto IS NULL);
CREATE INDEX IF NOT EXISTS prestamo_items_implemento_id_idx ON public.prestamo_items USING btree (implemento_id);
CREATE INDEX IF NOT EXISTS prestamo_items_impl_idx ON public.prestamo_items USING btree (implemento_id);

alter table public.alimentos enable row level security;
alter table public.bitacora enable row level security;
alter table public.cnt_asientos enable row level security;
alter table public.cnt_cierres enable row level security;
alter table public.cnt_conciliaciones enable row level security;
alter table public.cnt_cuentas enable row level security;
alter table public.cnt_extractos enable row level security;
alter table public.cnt_lineas enable row level security;
alter table public.cnt_precios enable row level security;
alter table public.cnt_presupuesto enable row level security;
alter table public.cnt_terceros enable row level security;
alter table public.comidas enable row level security;
alter table public.config enable row level security;
alter table public.estados_implemento enable row level security;
alter table public.implementos enable row level security;
alter table public.movimientos enable row level security;
alter table public.perfiles enable row level security;
alter table public.prestamo_eventos enable row level security;
alter table public.prestamo_items enable row level security;
alter table public.prestamos enable row level security;
alter table public.push_avisos enable row level security;
alter table public.push_subs enable row level security;
alter table public.tipos enable row level security;
alter table public.tipos_implemento enable row level security;
alter table public.zonas enable row level security;

CREATE OR REPLACE FUNCTION public.borrar_historial(p_tabla text DEFAULT 'todo'::text, p_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not es_admin() then raise exception 'No autorizado'; end if;
  if p_tabla not in ('movimientos','comidas','bitacora','todo') then raise exception 'Tabla inválida'; end if;
  if p_tabla = 'todo' then
    delete from movimientos where true;
    delete from comidas     where true;
    delete from bitacora    where true;
  elsif p_id is null then
    execute format('delete from %I where true', p_tabla);
  else
    execute format('delete from %I where id = $1', p_tabla) using p_id;
  end if;
end $function$;
CREATE OR REPLACE FUNCTION public.borrar_historial_prestamos(p_id bigint DEFAULT NULL::bigint, p_tipo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not es_admin() then raise exception 'No autorizado'; end if;

  if p_id is not null then
    delete from prestamo_eventos where id = p_id;
    return;
  end if;

  if p_tipo is not null and p_tipo not in ('generales','prestamos','todo') then
    raise exception 'Tipo inválido';
  end if;

  if p_tipo = 'generales' then
    delete from prestamo_eventos where tipo = 'edicion';
    return;
  end if;

  if p_tipo = 'prestamos' then
    delete from prestamo_eventos where tipo <> 'edicion';
  else
    delete from prestamo_eventos where true;
  end if;

  delete from prestamo_items
   where prestamo_id in (
     select p.id from prestamos p
      where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id and i.devuelto is null));
  delete from prestamos p
   where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id);
end
$function$;
CREATE OR REPLACE FUNCTION public.cnt_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ select exists(select 1 from perfiles where id=auth.uid() and rol='admin') $function$;
CREATE OR REPLACE FUNCTION public.cnt_anular(p_id bigint, p_motivo text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_f date; v_num text; r record; st numeric; q numeric; rev jsonb := '[]';
begin
  if not cnt_admin() then raise exception 'Solo un admin puede anular asientos'; end if;
  select fecha, numero into v_f, v_num from cnt_asientos where id=p_id and estado='activo' for update;
  if v_f is null then raise exception 'El asiento no existe o ya está anulado'; end if;
  if exists(select 1 from cnt_cierres where periodo=to_char(v_f,'YYYY-MM')) then
    raise exception 'El período % está cerrado', to_char(v_f,'YYYY-MM'); end if;
  update cnt_asientos set estado='anulado', motivo_anulacion=p_motivo where id=p_id;
  for r in select id, sku, nombre, inv_cant from cnt_precios
           where asiento_id=p_id and inv_cant>0 and not inv_rev order by id loop
    select stock into st from alimentos where sku=r.sku for update;
    q := least(r.inv_cant, coalesce(st,0));
    if q > 0 then
      perform inv_mover(r.sku, -q, 'Salida: anulación de la compra '||v_num, p_id);
      rev := rev || jsonb_build_array(jsonb_build_object('sku',r.sku,'nombre',r.nombre,'cantidad',q));
    end if;
    update cnt_precios set inv_rev=true where id=r.id;
  end loop;
  return jsonb_build_object('revertidas',rev);
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_conciliar(p_extracto bigint, p_linea bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v numeric;
begin
  if not cnt_admin() then raise exception 'Solo un admin puede conciliar'; end if;
  if not cnt_ext_libre(p_extracto) then raise exception 'El movimiento del extracto no existe o ya está conciliado'; end if;
  select l.debito-l.credito into v from cnt_lineas l join cnt_asientos a on a.id=l.asiento_id
   where l.id=p_linea and l.cuenta='1110' and a.estado='activo';
  if v is null then raise exception 'La línea no es de bancos o su asiento está anulado'; end if;
  if v <> (select valor from cnt_extractos where id=p_extracto) then raise exception 'Los valores no coinciden'; end if;
  update cnt_extractos set linea_id=p_linea where id=p_extracto;
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_conciliar_nuevo(p_extracto bigint, p_contra text, p_concepto text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare e cnt_extractos; v numeric; v_tipo text; v_num text; v_id bigint; v_lb bigint; v_ap text;
begin
  if not cnt_admin() then raise exception 'Solo un admin puede registrar asientos'; end if;
  if not cnt_ext_libre(p_extracto) then raise exception 'El movimiento del extracto no existe o ya está conciliado'; end if;
  select * into e from cnt_extractos where id=p_extracto;
  if p_contra='1110' or not exists(select 1 from cnt_cuentas where codigo=p_contra) then
    raise exception 'Cuenta de contrapartida no válida'; end if;
  if exists(select 1 from cnt_cierres where periodo=to_char(e.fecha,'YYYY-MM')) then
    raise exception 'El período % está cerrado', to_char(e.fecha,'YYYY-MM'); end if;
  v := abs(e.valor); v_tipo := case when e.valor>0 then 'ingreso' else 'egreso' end;
  perform pg_advisory_xact_lock(7731);
  select apodo into v_ap from perfiles where id=auth.uid();
  v_num := cnt_siguiente_numero(v_tipo, e.fecha);
  insert into cnt_asientos(numero,fecha,tipo,concepto,valor,apodo)
    values(v_num,e.fecha,v_tipo,left(p_concepto,160),v,v_ap) returning id into v_id;
  insert into cnt_lineas(asiento_id,cuenta,debito,credito)
    values(v_id,'1110',case when e.valor>0 then v else 0 end,case when e.valor>0 then 0 else v end) returning id into v_lb;
  insert into cnt_lineas(asiento_id,cuenta,debito,credito)
    values(v_id,p_contra,case when e.valor>0 then 0 else v end,case when e.valor>0 then v else 0 end);
  update cnt_extractos set linea_id=v_lb where id=p_extracto;
  return v_num;
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_costo_alimentos(p_periodo text, p_final numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_fin date; v_libros numeric; v_costo numeric; v_num text; v_lin jsonb;
begin
  if not cnt_admin() then raise exception 'Solo un admin puede registrar el costo'; end if;
  if p_periodo is null or p_periodo !~ '^\d{4}-\d{2}$' then raise exception 'Período no válido'; end if;
  if p_final is null or p_final < 0 then raise exception 'Escribe el inventario final valorado'; end if;
  v_fin := (date_trunc('month', to_date(p_periodo || '-01', 'YYYY-MM-DD')) + interval '1 month' - interval '1 day')::date;
  select coalesce(sum(l.debito - l.credito), 0) into v_libros
    from cnt_lineas l join cnt_asientos a on a.id = l.asiento_id
   where l.cuenta = '1435' and a.estado = 'activo' and a.fecha <= v_fin;
  v_costo := round(v_libros - p_final, 2);
  if v_costo = 0 then return jsonb_build_object('numero', null, 'valor', 0); end if;
  v_lin := case when v_costo > 0
    then jsonb_build_array(jsonb_build_object('cuenta','6105','debito',v_costo,'credito',0),
                           jsonb_build_object('cuenta','1435','debito',0,'credito',v_costo))
    else jsonb_build_array(jsonb_build_object('cuenta','1435','debito',-v_costo,'credito',0),
                           jsonb_build_object('cuenta','6105','debito',0,'credito',-v_costo)) end;
  v_num := cnt_crear_asiento(
    jsonb_build_object('fecha', v_fin, 'tipo', 'ajuste', 'concepto', 'Costo de alimentos consumidos ' || p_periodo),
    v_lin);
  return jsonb_build_object('numero', v_num, 'valor', v_costo);
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_crear_asiento(p_cab jsonb, p_lineas jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  v_num := cnt_siguiente_numero(v_tipo, v_f);
  insert into cnt_asientos(numero,fecha,tipo,tercero_id,concepto,soporte_tipo,soporte_num,donacion,condicionada,especie,valor,apodo)
  values(v_num, v_f, v_tipo, nullif(p_cab->>'tercero_id','')::bigint, p_cab->>'concepto',
         nullif(p_cab->>'soporte_tipo',''), nullif(p_cab->>'soporte_num',''),
         coalesce((p_cab->>'donacion')::boolean,false), coalesce((p_cab->>'condicionada')::boolean,false),
         coalesce((p_cab->>'especie')::boolean,false), v_d, v_ap)
  returning id into v_id;
  insert into cnt_lineas(asiento_id,cuenta,debito,credito)
  select v_id, x->>'cuenta', (x->>'debito')::numeric, (x->>'credito')::numeric from jsonb_array_elements(p_lineas) x;
  return v_num;
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_crear_asiento_precios(p_cab jsonb, p_lineas jsonb, p_precios jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_num text; v_id bigint;
begin
  v_num := cnt_crear_asiento(p_cab, p_lineas);
  select id into v_id from cnt_asientos where numero = v_num and tipo = (p_cab->>'tipo') order by id desc limit 1;
  insert into cnt_precios(fecha, sku, nombre, unidad, cantidad, valor, asiento_id, tercero_id)
  select (p_cab->>'fecha')::date, nullif(x->>'sku',''), left(x->>'nombre',80), nullif(x->>'unidad',''),
         nullif(x->>'cantidad','')::numeric, (x->>'valor')::numeric, v_id, nullif(p_cab->>'tercero_id','')::bigint
  from jsonb_array_elements(coalesce(p_precios,'[]'::jsonb)) x;
  return v_num;
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_eliminar_asientos(p_ids bigint[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a record; r record; st numeric; q numeric; n int := 0; rev jsonb := '[]';
begin
  if not cnt_admin() or not exists(select 1 from perfiles where id = auth.uid() and lower(apodo) = 'joa') then
    raise exception 'Solo Joa puede eliminar movimientos'; end if;
  perform pg_advisory_xact_lock(7731);
  for a in select id, numero, fecha from cnt_asientos where id = any(p_ids) order by id for update loop
    if exists(select 1 from cnt_cierres where periodo = to_char(a.fecha,'YYYY-MM')) then
      raise exception 'El período % está cerrado: ábrelo para eliminar %', to_char(a.fecha,'YYYY-MM'), a.numero; end if;

    for r in select id, sku, nombre, inv_cant from cnt_precios
             where asiento_id = a.id and inv_cant > 0 and not inv_rev order by id loop
      select stock into st from alimentos where sku = r.sku for update;
      q := least(r.inv_cant, coalesce(st, 0));
      if q > 0 then
        perform inv_mover(r.sku, -q, 'Salida: eliminación de ' || a.numero, a.id);
        rev := rev || jsonb_build_array(jsonb_build_object('sku', r.sku, 'nombre', r.nombre, 'cantidad', q));
      end if;
    end loop;
    update cnt_extractos set linea_id = null
     where linea_id in (select id from cnt_lineas where asiento_id = a.id);
    delete from cnt_precios where asiento_id = a.id;
    delete from movimientos where asiento_id = a.id;
    delete from cnt_lineas where asiento_id = a.id;
    delete from cnt_asientos where id = a.id;
    delete from bitacora where clase = 'cnt' and texto like '%' || a.numero || '%';
    n := n + 1;
  end loop;
  return jsonb_build_object('eliminados', n, 'stock', rev);
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_eliminar_tercero(p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare t record;
begin
  if not cnt_admin() then
    raise exception 'Solo un administrador puede eliminar terceros';
  end if;

  select id, nombre into t from cnt_terceros where id = p_id for update;
  if not found then
    raise exception 'El tercero no existe';
  end if;

  if exists (select 1 from cnt_asientos where tercero_id = p_id)
     or exists (select 1 from cnt_precios where tercero_id = p_id) then
    raise exception 'No se puede eliminar a "%": tiene movimientos o precios registrados.', t.nombre;
  end if;

  delete from cnt_terceros where id = p_id;

exception when foreign_key_violation then
  raise exception 'No se puede eliminar a "%": otro registro depende de él.', t.nombre;
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_ext_libre(p_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(select 1 from cnt_extractos e where e.id=p_id and (e.linea_id is null or exists(
    select 1 from cnt_lineas l join cnt_asientos a on a.id=l.asiento_id
    where l.id=e.linea_id and a.estado='anulado'))) $function$;
CREATE OR REPLACE FUNCTION public.cnt_inventario_control()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_l numeric; v_s numeric;
begin
  if not cnt_admin() then raise exception 'Solo un admin'; end if;
  select coalesce(sum(l.debito-l.credito),0) into v_l
    from cnt_lineas l join cnt_asientos a on a.id=l.asiento_id where l.cuenta='1435' and a.estado='activo';
  select coalesce(sum(al.stock*p.pu),0) into v_s from alimentos al
    cross join lateral (select pr.valor/pr.cantidad as pu from cnt_precios pr
      join cnt_asientos a on a.id=pr.asiento_id
      where pr.sku=al.sku and pr.cantidad>0 and a.estado='activo'
      order by pr.fecha desc, pr.id desc limit 1) p;
  return jsonb_build_object('libros',v_l,'stock',v_s,'diferencia',round(v_l-v_s,2));
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_registrar_compra(p_cab jsonb, p_lineas jsonb, p_precios jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_num text; v_id bigint; r record; a alimentos; ent jsonb := '[]'; omi jsonb := '[]';
begin
  v_num := cnt_crear_asiento_precios(p_cab, p_lineas, p_precios);
  select id into v_id from cnt_asientos where numero=v_num order by id desc limit 1;
  for r in select id, sku, nombre, unidad, cantidad from cnt_precios
           where asiento_id=v_id and sku is not null and cantidad>0 order by id loop
    select * into a from alimentos where sku=r.sku;
    if not found then
      omi := omi || jsonb_build_array(jsonb_build_object('nombre',r.nombre,'motivo','ya no existe en Alimentos')); continue; end if;
    if r.unidad is not null and lower(trim(r.unidad)) <> lower(trim(a.unidad)) then
      omi := omi || jsonb_build_array(jsonb_build_object('nombre',a.nombre,'motivo',r.unidad||' ≠ '||a.unidad)); continue; end if;
    perform inv_mover(r.sku, r.cantidad, 'Entrada: compra '||v_num, v_id);
    update cnt_precios set inv_cant=r.cantidad where id=r.id;
    ent := ent || jsonb_build_array(jsonb_build_object('sku',r.sku,'nombre',a.nombre,'cantidad',r.cantidad));
  end loop;
  return jsonb_build_object('numero',v_num,'id',v_id,'entradas',ent,'omitidas',omi);
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_siguiente_numero(p_tipo text, p_fecha date)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_pre text; v_n int;
begin
  v_pre := (case p_tipo when 'ingreso' then 'CI' when 'egreso' then 'CE' when 'apertura' then 'AP' else 'AJ' end)
           || '-' || to_char(p_fecha, 'YYYY-MM') || '-';
  select coalesce(max(substring(numero from '(\d+)$')::int), 0) + 1
    into v_n from cnt_asientos where numero like v_pre || '%';
  return v_pre || lpad(v_n::text, 3, '0');
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_soporte_generado(p_ids bigint[], p_num text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not cnt_admin() then raise exception 'Solo un admin puede marcar documentos soporte'; end if;
  if coalesce(trim(p_num),'') = '' then raise exception 'Falta el número del documento soporte'; end if;
  update cnt_asientos set soporte_tipo = 'doc_soporte', soporte_num = left(trim(p_num),40)
   where id = any(p_ids) and tipo = 'egreso' and estado = 'activo';
end $function$;
CREATE OR REPLACE FUNCTION public.cnt_tercero_no_obligado(p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not cnt_admin() then raise exception 'Solo un admin puede editar terceros'; end if;
  update cnt_terceros set no_obligado = true where id = p_id;
end $function$;
CREATE OR REPLACE FUNCTION public.correo_de_usuario(p_apodo text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
  select coalesce(
    (select u.email::text from auth.users u join perfiles p on p.id = u.id
      where lower(p.apodo) = lower(trim(p_apodo)) limit 1),
    coalesce(nullif(lower(regexp_replace(trim(p_apodo), '[^a-zA-Z0-9]+', '', 'g')), ''), 'x') || '@kokoa.app')
$function$;
CREATE OR REPLACE FUNCTION public.crear_prestamo(p_nombre text, p_documento text, p_telefono text, p_ids bigint[], p_notas text DEFAULT ''::text)
 RETURNS prestamos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end $function$;
CREATE OR REPLACE FUNCTION public.crear_usuario(p_apodo text, p_clave text, p_nombre text, p_apellido text, p_telefono text, p_correo text, p_animal text, p_rol rol_usuario)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions', 'pg_temp'
AS $function$
declare uid uuid := gen_random_uuid(); cod text; em text;
begin
  if not es_admin() then raise exception 'No autorizado'; end if;
  if p_rol = 'admin' and not es_super() then raise exception 'Solo Kokoa o Joa pueden crear admins'; end if;
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
CREATE OR REPLACE FUNCTION public.eliminar_estado_implemento(p_clave text, p_destino text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  if p_clave = p_destino then raise exception 'El destino debe ser distinto'; end if;
  update implementos set estado = p_destino where estado = p_clave;
  delete from estados_implemento where clave = p_clave;
end $function$;
CREATE OR REPLACE FUNCTION public.eliminar_tipo_implemento(p_nombre text, p_destino text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  if p_nombre = coalesce(p_destino,'') then raise exception 'El destino debe ser distinto'; end if;
  update implementos set categoria = coalesce(p_destino,'') where categoria = p_nombre;
  delete from tipos_implemento where nombre = p_nombre;
end $function$;
CREATE OR REPLACE FUNCTION public.eliminar_usuario(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  if not es_admin() then raise exception 'No autorizado'; end if;
  if exists (select 1 from perfiles where id = p_id and lower(apodo) in ('kokoa','joa')) then
    raise exception 'Este usuario no se puede eliminar'; end if;
  delete from auth.users where id = p_id;
end $function$;
CREATE OR REPLACE FUNCTION public.es_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ select exists(select 1 from perfiles where id=auth.uid() and rol='admin') $function$;
CREATE OR REPLACE FUNCTION public.es_super()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(select 1 from perfiles
                 where id = auth.uid() and rol = 'admin' and lower(apodo) in ('kokoa','joa'))
$function$;
CREATE OR REPLACE FUNCTION public.inv_mover(p_sku text, p_delta numeric, p_motivo text, p_asiento bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare a alimentos; resto numeric; l jsonb; nl jsonb := '[]'; q numeric; t numeric; ap text;
begin
  select * into a from alimentos where sku=p_sku for update;
  if not found then raise exception 'El alimento % no existe', p_sku; end if;
  if p_delta > 0 then
    nl := a.lotes || jsonb_build_array(jsonb_build_object('q',p_delta,'exp',null::date));
  else
    if a.stock + p_delta < 0 then raise exception 'Stock insuficiente de %', a.nombre; end if;
    resto := -p_delta;
    for l in select value from jsonb_array_elements(a.lotes) order by value->>'exp' nulls last loop
      q := (l->>'q')::numeric; t := least(resto,q); resto := resto - t;
      if q - t > 0 then nl := nl || jsonb_build_array(jsonb_set(l,'{q}',to_jsonb(q - t))); end if;
    end loop;
  end if;
  update alimentos set stock=stock+p_delta, lotes=nl, actualizado=now() where sku=p_sku;
  select apodo into ap from perfiles where id=auth.uid();
  insert into movimientos(sku,nombre,tipo,unidad,delta,motivo,usuario,apodo,asiento_id)
  values(a.sku,a.nombre,a.tipo,a.unidad,p_delta,p_motivo,auth.uid(),ap,p_asiento);
end $function$;
CREATE OR REPLACE FUNCTION public.limpiar_historial_anual()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin

  delete from movimientos where true;
  delete from comidas     where true;
  delete from bitacora    where true;

  delete from prestamo_eventos where true;
  delete from prestamo_items
   where prestamo_id in (
     select p.id from prestamos p
      where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id and i.devuelto is null));
  delete from prestamos p
   where not exists (select 1 from prestamo_items i where i.prestamo_id = p.id);
end
$function$;
CREATE OR REPLACE FUNCTION public.marcar_limpio(p_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  update implementos set estado='disponible' where id=p_id and estado='por_limpiar';
end $function$;
CREATE OR REPLACE FUNCTION public.nuevo_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into perfiles(id,apodo,nombre,apellido,telefono,correo,animal) values(
    new.id, coalesce(new.raw_user_meta_data->>'apodo', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'nombre',''), coalesce(new.raw_user_meta_data->>'apellido',''),
    coalesce(new.raw_user_meta_data->>'telefono',''), coalesce(new.raw_user_meta_data->>'correo',''),
    coalesce(new.raw_user_meta_data->>'animal',''));
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.ping()
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$ select 'ok' $function$;
CREATE OR REPLACE FUNCTION public.proteger_joa()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if lower(old.apodo) = 'joa' and auth.uid() is not null then
    if auth.uid() <> old.id then raise exception 'Este usuario está protegido'; end if;
    if new.rol is distinct from old.rol
       or new.oculto is distinct from old.oculto
       or lower(new.apodo) <> 'joa' then
      raise exception 'Este usuario está protegido';
    end if;
  end if;
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.proteger_rol()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then return new; end if;
  if new.rol is distinct from old.rol then
    if not es_admin() then raise exception 'Solo un admin puede cambiar roles'; end if;
    if lower(old.apodo) in ('kokoa','joa') then raise exception 'El rol de Kokoa y Joa no se puede cambiar'; end if;
    if new.rol = 'admin' and not es_super() then raise exception 'Solo Kokoa o Joa pueden crear admins'; end if;
  end if;
  if lower(old.apodo) = 'kokoa' and lower(new.apodo) <> 'kokoa' then
    raise exception 'Kokoa no se puede renombrar'; end if;
  if lower(new.apodo) in ('kokoa','joa') and lower(old.apodo) <> lower(new.apodo) then
    raise exception 'Apodo reservado'; end if;
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.registrar_comida(p_tipo text, p_nombre text, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare x jsonb; ap text;
begin
  if auth.uid() is null then raise exception 'Sin sesión'; end if;
  for x in select value from jsonb_array_elements(p_items) loop
    perform registrar_movimiento(x->>'sku', -(x->>'q')::numeric, coalesce(x->>'motivo', p_tipo));
  end loop;
  select apodo into ap from perfiles where id=auth.uid();
  insert into comidas(tipo,nombre,items,apodo) values(p_tipo,p_nombre,p_items,ap);
end $function$;
CREATE OR REPLACE FUNCTION public.registrar_devolucion(p_item bigint, p_condicion text, p_limpio boolean, p_novedad text DEFAULT ''::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end $function$;
CREATE OR REPLACE FUNCTION public.registrar_edicion_prestamos(p_detalle text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not es_admin() then raise exception 'Solo administradores'; end if;
  insert into prestamo_eventos(tipo, detalle, apodo)
  values ('edicion', p_detalle, (select apodo from perfiles where id = auth.uid()));
end $function$;
CREATE OR REPLACE FUNCTION public.registrar_movimiento(p_sku text, p_delta numeric, p_motivo text DEFAULT ''::text, p_vence date DEFAULT NULL::date)
 RETURNS alimentos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end $function$;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;
CREATE OR REPLACE FUNCTION public.validar_codigo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if coalesce(new.raw_user_meta_data->>'codigo','') <> coalesce((select valor from config where clave='codigo_registro'),'#') then
    raise exception 'Código de registro incorrecto';
  end if;
  return new;
end $function$;

revoke all on function public.borrar_historial(text,bigint) from public, anon, authenticated, service_role;
grant execute on function public.borrar_historial(text,bigint) to authenticated;
revoke all on function public.borrar_historial_prestamos(bigint,text) from public, anon, authenticated, service_role;
grant execute on function public.borrar_historial_prestamos(bigint,text) to authenticated;
revoke all on function public.cnt_admin() from public, anon, authenticated, service_role;
grant execute on function public.cnt_admin() to authenticated;
revoke all on function public.cnt_anular(bigint,text) from public, anon, authenticated, service_role;
grant execute on function public.cnt_anular(bigint,text) to authenticated;
revoke all on function public.cnt_conciliar(bigint,bigint) from public, anon, authenticated, service_role;
grant execute on function public.cnt_conciliar(bigint,bigint) to authenticated;
revoke all on function public.cnt_conciliar_nuevo(bigint,text,text) from public, anon, authenticated, service_role;
grant execute on function public.cnt_conciliar_nuevo(bigint,text,text) to authenticated;
revoke all on function public.cnt_costo_alimentos(text,numeric) from public, anon, authenticated, service_role;
grant execute on function public.cnt_costo_alimentos(text,numeric) to authenticated;
revoke all on function public.cnt_crear_asiento(jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.cnt_crear_asiento(jsonb,jsonb) to authenticated;
revoke all on function public.cnt_crear_asiento_precios(jsonb,jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.cnt_crear_asiento_precios(jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.cnt_eliminar_asientos(bigint[]) from public, anon, authenticated, service_role;
grant execute on function public.cnt_eliminar_asientos(bigint[]) to authenticated;
revoke all on function public.cnt_ext_libre(bigint) from public, anon, authenticated, service_role;
revoke all on function public.cnt_inventario_control() from public, anon, authenticated, service_role;
grant execute on function public.cnt_inventario_control() to authenticated;
revoke all on function public.cnt_registrar_compra(jsonb,jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.cnt_registrar_compra(jsonb,jsonb,jsonb) to authenticated;
revoke all on function public.cnt_siguiente_numero(text,date) from public, anon, authenticated, service_role;
revoke all on function public.cnt_soporte_generado(bigint[],text) from public, anon, authenticated, service_role;
grant execute on function public.cnt_soporte_generado(bigint[],text) to authenticated;
revoke all on function public.cnt_tercero_no_obligado(bigint) from public, anon, authenticated, service_role;
grant execute on function public.cnt_tercero_no_obligado(bigint) to authenticated;
revoke all on function public.correo_de_usuario(text) from public, anon, authenticated, service_role;
grant execute on function public.correo_de_usuario(text) to authenticated;
grant execute on function public.correo_de_usuario(text) to anon;
revoke all on function public.crear_prestamo(text,text,text,bigint[],text) from public, anon, authenticated, service_role;
grant execute on function public.crear_prestamo(text,text,text,bigint[],text) to authenticated;
revoke all on function public.crear_usuario(text,text,text,text,text,text,text,rol_usuario) from public, anon, authenticated, service_role;
grant execute on function public.crear_usuario(text,text,text,text,text,text,text,rol_usuario) to authenticated;
revoke all on function public.eliminar_estado_implemento(text,text) from public, anon, authenticated, service_role;
grant execute on function public.eliminar_estado_implemento(text,text) to authenticated;
revoke all on function public.eliminar_tipo_implemento(text,text) from public, anon, authenticated, service_role;
grant execute on function public.eliminar_tipo_implemento(text,text) to authenticated;
revoke all on function public.eliminar_usuario(uuid) from public, anon, authenticated, service_role;
grant execute on function public.eliminar_usuario(uuid) to authenticated;
revoke all on function public.es_admin() from public, anon, authenticated, service_role;
grant execute on function public.es_admin() to authenticated;
revoke all on function public.es_super() from public, anon, authenticated, service_role;
grant execute on function public.es_super() to authenticated;
revoke all on function public.inv_mover(text,numeric,text,bigint) from public, anon, authenticated, service_role;
revoke all on function public.limpiar_historial_anual() from public, anon, authenticated, service_role;
revoke all on function public.marcar_limpio(bigint) from public, anon, authenticated, service_role;
grant execute on function public.marcar_limpio(bigint) to authenticated;
revoke all on function public.nuevo_usuario() from public, anon, authenticated, service_role;
revoke all on function public.ping() from public, anon, authenticated, service_role;
grant execute on function public.ping() to authenticated;
grant execute on function public.ping() to service_role;
grant execute on function public.ping() to anon;
revoke all on function public.proteger_joa() from public, anon, authenticated, service_role;
revoke all on function public.proteger_rol() from public, anon, authenticated, service_role;
revoke all on function public.registrar_comida(text,text,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.registrar_comida(text,text,jsonb) to authenticated;
revoke all on function public.registrar_devolucion(bigint,text,boolean,text) from public, anon, authenticated, service_role;
grant execute on function public.registrar_devolucion(bigint,text,boolean,text) to authenticated;
revoke all on function public.registrar_edicion_prestamos(text) from public, anon, authenticated, service_role;
grant execute on function public.registrar_edicion_prestamos(text) to authenticated;
revoke all on function public.registrar_movimiento(text,numeric,text,date) from public, anon, authenticated, service_role;
grant execute on function public.registrar_movimiento(text,numeric,text,date) to authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role;
revoke all on function public.validar_codigo() from public, anon, authenticated, service_role;

CREATE TRIGGER al_crear_usuario AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION nuevo_usuario();
CREATE TRIGGER validar_codigo BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION validar_codigo();
CREATE TRIGGER proteger_joa BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION proteger_joa();
CREATE TRIGGER proteger_rol BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION proteger_rol();
create event trigger rls_auto_enable on ddl_command_end
  when tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') execute function public.rls_auto_enable();

create policy ver_ali on public.alimentos for SELECT to authenticated
  using (true);
create policy crear_ali on public.alimentos for INSERT to authenticated
  with check (((stock = (0)::numeric) AND (lotes = '[]'::jsonb)));
create policy borrar_ali on public.alimentos for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) IS NOT NULL));
create policy mod_ali on public.alimentos for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) IS NOT NULL))
  with check ((( SELECT auth.uid() AS uid) IS NOT NULL));
create policy add_bit on public.bitacora for INSERT to authenticated
  with check ((apodo = ( SELECT p.apodo
   FROM perfiles p
  WHERE (p.id = ( SELECT auth.uid() AS uid)))));
create policy ver_bit on public.bitacora for SELECT to authenticated
  using (true);
create policy cnt_asientos_sel on public.cnt_asientos for SELECT to public
  using (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_cierres_all on public.cnt_cierres for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_conciliaciones_all on public.cnt_conciliaciones for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_cuentas_all on public.cnt_cuentas for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_extractos_all on public.cnt_extractos for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_lineas_sel on public.cnt_lineas for SELECT to public
  using (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_precios_admin on public.cnt_precios for ALL to authenticated
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_presupuesto_all on public.cnt_presupuesto for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy cnt_terceros_all on public.cnt_terceros for ALL to public
  using (( SELECT cnt_admin() AS cnt_admin))
  with check (( SELECT cnt_admin() AS cnt_admin));
create policy add_com on public.comidas for INSERT to authenticated
  with check ((apodo = ( SELECT p.apodo
   FROM perfiles p
  WHERE (p.id = ( SELECT auth.uid() AS uid)))));
create policy ver_com on public.comidas for SELECT to authenticated
  using (true);
create policy adm_config on public.config for ALL to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy adm_estados_imp_i on public.estados_implemento for INSERT to authenticated
  with check (( SELECT es_admin() AS es_admin));
create policy ver_estados_imp on public.estados_implemento for SELECT to authenticated
  using (true);
create policy adm_estados_imp_u on public.estados_implemento for UPDATE to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy adm_estados_imp_d on public.estados_implemento for DELETE to authenticated
  using (( SELECT es_admin() AS es_admin));
create policy impl_adm_d on public.implementos for DELETE to authenticated
  using (( SELECT es_admin() AS es_admin));
create policy impl_ver on public.implementos for SELECT to authenticated
  using (true);
create policy impl_adm_i on public.implementos for INSERT to authenticated
  with check (( SELECT es_admin() AS es_admin));
create policy impl_adm_u on public.implementos for UPDATE to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy ver_mov on public.movimientos for SELECT to authenticated
  using (true);
create policy editar_perfil on public.perfiles for UPDATE to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_admin() AS es_admin)))
  with check (((id = ( SELECT auth.uid() AS uid)) OR ( SELECT es_admin() AS es_admin)));
create policy ver_perfil on public.perfiles for SELECT to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR (( SELECT es_admin() AS es_admin) AND (NOT oculto))));
create policy ver_pev on public.prestamo_eventos for SELECT to authenticated
  using (true);
create policy ver_pitem on public.prestamo_items for SELECT to authenticated
  using (true);
create policy ver_prest on public.prestamos for SELECT to authenticated
  using (true);
create policy mis_subs on public.push_subs for ALL to authenticated
  using ((usuario = ( SELECT auth.uid() AS uid)))
  with check ((usuario = ( SELECT auth.uid() AS uid)));
create policy adm_tipos_d on public.tipos for DELETE to authenticated
  using (( SELECT es_admin() AS es_admin));
create policy ver_tipos on public.tipos for SELECT to authenticated
  using (true);
create policy adm_tipos_u on public.tipos for UPDATE to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy adm_tipos_i on public.tipos for INSERT to authenticated
  with check (( SELECT es_admin() AS es_admin));
create policy adm_tipos_imp_u on public.tipos_implemento for UPDATE to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy ver_tipos_imp on public.tipos_implemento for SELECT to authenticated
  using (true);
create policy adm_tipos_imp_i on public.tipos_implemento for INSERT to authenticated
  with check (( SELECT es_admin() AS es_admin));
create policy adm_tipos_imp_d on public.tipos_implemento for DELETE to authenticated
  using (( SELECT es_admin() AS es_admin));
create policy ver_zonas on public.zonas for SELECT to authenticated
  using (true);
create policy adm_zonas_d on public.zonas for DELETE to authenticated
  using (( SELECT es_admin() AS es_admin));
create policy adm_zonas_u on public.zonas for UPDATE to authenticated
  using (( SELECT es_admin() AS es_admin))
  with check (( SELECT es_admin() AS es_admin));
create policy adm_zonas_i on public.zonas for INSERT to authenticated
  with check (( SELECT es_admin() AS es_admin));

grant DELETE, INSERT, SELECT on public.alimentos to authenticated;
grant INSERT, SELECT on public.bitacora to authenticated;
grant SELECT on public.cnt_asientos to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_cierres to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_conciliaciones to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_cuentas to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_extractos to authenticated;
grant SELECT on public.cnt_lineas to authenticated;
grant SELECT on public.cnt_precios to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_presupuesto to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.cnt_terceros to authenticated;
grant INSERT, SELECT on public.comidas to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.config to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.estados_implemento to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.implementos to authenticated;
grant SELECT on public.movimientos to authenticated;
grant SELECT on public.perfiles to authenticated;
grant SELECT on public.prestamo_eventos to authenticated;
grant SELECT on public.prestamo_items to authenticated;
grant SELECT on public.prestamos to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.push_subs to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.tipos to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.tipos_implemento to authenticated;
grant DELETE, INSERT, SELECT, UPDATE on public.zonas to authenticated;

grant update(nombre,tipo,unidad,zona,vence,minimo,conteo) on public.alimentos to authenticated;
grant update(apodo,nombre,apellido,telefono,correo,animal,oculto,rol) on public.perfiles to authenticated;

alter publication supabase_realtime add table public.alimentos;
alter publication supabase_realtime add table public.bitacora;
alter publication supabase_realtime add table public.comidas;
alter publication supabase_realtime add table public.estados_implemento;
alter publication supabase_realtime add table public.implementos;
alter publication supabase_realtime add table public.movimientos;
alter publication supabase_realtime add table public.prestamo_eventos;
alter publication supabase_realtime add table public.prestamo_items;
alter publication supabase_realtime add table public.prestamos;
alter publication supabase_realtime add table public.tipos;
alter publication supabase_realtime add table public.tipos_implemento;
alter publication supabase_realtime add table public.zonas;
