/**
 * Reverse geocoding - lat/lng to address components
 * Uses OpenStreetMap Nominatim (free, no API key)
 * zoom=18 for village-level detail in India
 */

export interface GeocodeResult {
  state?: string;
  district?: string;
  block?: string; // tehsil/mandal
  village?: string;
  pincode?: string;
  city?: string;
  raw?: Record<string, string>;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  // zoom=18 gives village/street-level detail for India
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'IRO-Civic-Platform/1.0' },
  });
  if (!res.ok) throw new Error('Geocoding failed');

  const data = (await res.json()) as { address?: Record<string, string> };
  const addr = data.address || {};

  // India hierarchy: state -> district (county) -> subdistrict (tehsil) -> village
  // NEVER use city for district - city often reflects municipal area, not admin district
  const state = addr.state || addr['ISO3166-2-lvl4']?.replace(/^IN-/, '') || addr.state_district;
  // county = district in India; district in OSM can mean city_district/borough
  const district = addr.county || addr.district;
  const block = addr.subdistrict || addr.taluk || addr.tehsil;
  // Village: prefer village/hamlet, then locality, neighbourhood, suburb; town/city for rural
  const village =
    addr.village ||
    addr.hamlet ||
    addr.locality ||
    addr.neighbourhood ||
    addr.suburb ||
    (addr.town && !addr.city ? addr.town : undefined) ||
    addr.municipality;
  const city = addr.city || addr.town || addr.municipality;
  const pincode = addr.postcode;

  return {
    state,
    district,
    block,
    village,
    city,
    pincode,
    raw: addr,
  };
}
