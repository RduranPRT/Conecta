/**
 * Geografía mínima del prototipo.
 *
 * Las cuatro nociones que el prompt exige distinguir viven en la base:
 *   ubicación física  → perfiles.lat / perfiles.lng
 *   territorio admin. → perfiles.comuna_id (país → región → comuna)
 *   zona de cobertura → tabla coberturas (N comunas)
 *   radio de servicio → perfiles.radio_km
 *
 * Aquí solo está el cálculo de distancia. Cuando el volumen lo pida, esto se
 * reemplaza por PostGIS sin tocar quien lo llama.
 */

export type Punto = { lat: number; lng: number };

const RADIO_TIERRA_KM = 6371;

export function distanciaKm(a: Punto, b: Punto): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

export function formatearDistancia(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1).replace(".", ",")} km`;
  return `${Math.round(km)} km`;
}

/** SQL de haversine, para ordenar por distancia dentro de la consulta. */
export function sqlDistanciaKm(latColumna: string, lngColumna: string, punto: Punto) {
  return `(2 * 6371 * asin(sqrt(
    power(sin(radians(${punto.lat} - ${latColumna}) / 2), 2) +
    cos(radians(${latColumna})) * cos(radians(${punto.lat})) *
    power(sin(radians(${punto.lng} - ${lngColumna}) / 2), 2)
  )))`;
}
