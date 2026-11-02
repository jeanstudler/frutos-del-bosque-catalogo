// Frutos del Bosque: función de Netlify con acceso privado, SOLO LECTURA, a Airtable.
const BASE = 'appahdL1aANYpyxk5';
const TABLE = 'tblTLVGFoUwg6mI8O';
const F = Object.freeze({
  name: 'fldfPYUrlza8K2ThJ',
  internalName: 'fldvVwNOpXU2DiPqv',
  group: 'fld7uZ0SvtCnyq4dm',
  description: 'fldjfr2m8GYmvsOUD',
  price: 'fldngcDG24POWwQDX',
  status: 'fldLpmr6iTo7uA7wu',
  stock: 'fldEmF8dmuJK4KRC3',
  visible: 'fldbzWAmvfmLs7e87',
  photo: 'fldRDRR1u7iDxfqft',
  sun: 'fldJY8TmH07p6d5QZ',
  water: 'fldpLKiidFe6vdCRD',
  cold: 'fld1apRORVBwWAUie',
  adultHeight: 'fldI9feTloESRbfHq',
  uses: 'fld1pzfxEQ2fGZCnU',
});
const str = (x) => typeof x === 'string' ? x.trim() : '';
const selected = (x) => str(typeof x === 'string' ? x : x?.name);
const integer = (x) => Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0;
const realPhoto = (files) => {
  if (!Array.isArray(files)) return '';
  const image = files.find(f => f && (str(f.type).startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(str(f.filename))));
  const url = image?.thumbnails?.large?.url || image?.url || '';
  return /^https:\/\//i.test(url) ? url : '';
};
async function getApprovedRows(token) {
  const results = [];
  let offset, pages = 0;
  do {
    const url = new URL('https://api.airtable.com/v0/' + BASE + '/' + TABLE);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    for (const key of Object.values(F)) url.searchParams.append('fields[]', key);
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Airtable status ' + response.status);
    const result = await response.json();
    if (!Array.isArray(result.records)) throw new Error('Respuesta Airtable inesperada');
    results.push(...result.records);
    offset = result.offset || undefined;
    if (++pages >= 30 && offset) throw new Error('Límite de paginación');
  } while (offset);
  return results;
}
const publicItems = rows => rows.flatMap(record => {
  const f = record.fields || {};
  const stock = integer(f[F.stock]);
  const price = Number(f[F.price]);
  const image = realPhoto(f[F.photo]);
  // NUNCA usar cantidad de seguimiento ni precio sugerido para publicar.
  if (f[F.visible] !== true || selected(f[F.status]) !== 'Disponible' ||
      stock <= 0 || !Number.isFinite(price) || price <= 0 || !image) return [];
  const name = str(f[F.name]) || str(f[F.internalName]);
  if (!name) return [];
  return [{
    id: record.id,
    name,
    category: selected(f[F.group]) || 'Otras plantas',
    description: str(f[F.description]) || 'Consultanos por las características de esta planta.',
    price, stock, image,
    care: {
      sun: str(f[F.sun]), water: str(f[F.water]),
      cold: str(f[F.cold]), adultHeight: str(f[F.adultHeight]),
      uses: str(f[F.uses])
    }
  }];
}).sort((a,b) => a.name.localeCompare(b.name, 'es'));
let memo = null, inFlight = null;
async function catalogue(token) {
  if (memo && Date.now() - memo.at < 60000) return memo.response;
  if (!inFlight) inFlight = getApprovedRows(token).then(rows => {
    const response = { ok: true, consultedAt: new Date().toISOString(), items: publicItems(rows) };
    memo = { at: Date.now(), response };
    return response;
  }).finally(() => { inFlight = null; });
  return inFlight;
}
const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});
export default async function handler(request) {
  if (request.method !== 'GET') return json({ ok: false, error: 'Método no permitido' }, 405);
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return json({ ok: false, error: 'El catálogo todavía no está conectado a Airtable.' }, 503);
  try {
    return json(await catalogue(token));
  } catch (error) {
    console.error('No se pudo consultar Airtable:', error?.message);
    return json({ ok: false, error: 'No pudimos consultar la disponibilidad. Probá más tarde.' }, 503);
  }
}
export const config = { path: '/api/catalogo' };
