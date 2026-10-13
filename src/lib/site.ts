export type Franja = readonly [abre: string, cierra: string];

const SEMANA: Franja = ['11:30', '20:00'];

export const SITE = {
  nombre: 'La Kokoa',
  largo: 'Kocina Komunitaria Amplia · Chucho León Patiño',
  lema: 'Proceso estudiantil autónomo de soberanía alimentaria',
  descripcion: 'Proceso estudiantil autónomo de soberanía alimentaria en la Universidad Nacional de Colombia, sede Bogotá.',
  direccion: 'Ave Cra 30 #45-03, Bogotá',
  instagram: 'https://www.instagram.com/kokoa_chucholeon',
  whatsapp: '',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Kokoa+Chucho+Leon+Bogota',
  zona: 'America/Bogota',
  horarios: { 0: null, 1: SEMANA, 2: SEMANA, 3: SEMANA, 4: SEMANA, 5: SEMANA, 6: null } as Record<number, Franja | null>,
};

export const SUPABASE = {
  url: 'https://wqpwqiwkvwdfcvywatmc.supabase.co',
  clavePublica: 'sb_publishable_16usfkk9hH5DyHxY7KGS_Q_YDqcmdXD',
};

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (p = '/') => base + p;

export interface Enlace {
  ruta: string;
  etiqueta: string;
}

export const NAV: readonly Enlace[] = [
  { ruta: '/', etiqueta: 'Inicio' },
  { ruta: '/acerca/', etiqueta: 'Acerca' },
  { ruta: '/menu/', etiqueta: 'Menú' },
  { ruta: '/horarios/', etiqueta: 'Horarios' },
  { ruta: '/opiniones/', etiqueta: 'Opiniones' },
  { ruta: '/contacto/', etiqueta: 'Contacto' },
  { ruta: '/apoya/', etiqueta: 'Apoya' },
];
