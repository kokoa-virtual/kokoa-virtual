export const SITE = {
  nombre: 'La Kokoa',
  largo: 'Kocina Komunitaria Amplia · Chucho León Patiño',
  descripcion: 'Proceso estudiantil autónomo de soberanía alimentaria en la Universidad Nacional de Colombia, sede Bogotá.',
  direccion: 'Ave Cra 30 #45-03, Bogotá',
  instagram: 'https://www.instagram.com/kokoa_chucholeon',
  whatsapp: '',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Kokoa+Chucho+Leon+Bogota',
  zona: 'America/Bogota',
  horarios: { 0: null, 1: ['11:30', '20:00'], 2: ['11:30', '20:00'], 3: ['11:30', '20:00'], 4: ['11:30', '20:00'], 5: ['11:30', '20:00'], 6: null } as Record<number, string[] | null>,
};
export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (p = '/') => base + p;
export const NAV: [string, string][] = [['/', 'Inicio'], ['/acerca/', 'Acerca'], ['/menu/', 'Menú'], ['/horarios/', 'Horarios'], ['/opiniones/', 'Opiniones'], ['/contacto/', 'Contacto'], ['/apoya/', 'Apoya']];
