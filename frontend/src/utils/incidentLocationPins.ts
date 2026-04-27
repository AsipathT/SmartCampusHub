export type LatLng = { lat: number; lng: number };

export const SLIIT_LOCATION_OPTIONS = [
  { value: 'MAIN_BUILDING', label: 'Main Building (Administration)' },
  { value: 'BLOCK_A', label: 'Block A — Computing & IT' },
  { value: 'BLOCK_B', label: 'Block B — Engineering' },
  { value: 'BLOCK_C', label: 'Block C — Business Faculty' },
  { value: 'LIBRARY', label: 'Library & Learning Commons' },
  { value: 'STUDENT_CENTER', label: 'Student Center / Cafeteria' },
  { value: 'AUDITORIUM', label: 'Main Auditorium' },
  { value: 'SPORTS_COMPLEX', label: 'Sports Complex / Grounds' },
  { value: 'PARKING_A', label: 'Car Park A' },
  { value: 'PARKING_B', label: 'Car Park B' },
  { value: 'MAIN_GATE', label: 'Main Gate / Security Post' },
  { value: 'HOSTEL_ZONE', label: 'Student Accommodation / Hostel Zone' },
  { value: 'OPEN_LECTURE_AREA', label: 'Open Lecture / Courtyard Areas' },
  { value: 'LAB_COMPLEX', label: 'Laboratory Complex (Computing Labs)' },
] as const;

/**
 * Canonical pin coordinates for each incident location option around SLIIT Malabe.
 * These values are used both when creating new tickets and when rendering legacy
 * tickets that do not yet have explicit pin coordinates saved.
 */
const LOCATION_PIN_BY_VALUE: Record<string, LatLng> = {
  MAIN_BUILDING: { lat: 6.91495, lng: 79.9723 },
  BLOCK_A: { lat: 6.9152, lng: 79.97262 },
  BLOCK_B: { lat: 6.91506, lng: 79.97295 },
  BLOCK_C: { lat: 6.9147, lng: 79.97304 },
  LIBRARY: { lat: 6.91445, lng: 79.97256 },
  STUDENT_CENTER: { lat: 6.9143, lng: 79.97214 },
  AUDITORIUM: { lat: 6.9154, lng: 79.97208 },
  SPORTS_COMPLEX: { lat: 6.91395, lng: 79.97185 },
  PARKING_A: { lat: 6.91426, lng: 79.97338 },
  PARKING_B: { lat: 6.91388, lng: 79.97272 },
  MAIN_GATE: { lat: 6.91402, lng: 79.9737 },
  HOSTEL_ZONE: { lat: 6.91334, lng: 79.97234 },
  OPEN_LECTURE_AREA: { lat: 6.91458, lng: 79.97195 },
  LAB_COMPLEX: { lat: 6.91534, lng: 79.97252 },
};

const LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  SLIIT_LOCATION_OPTIONS.map((opt) => [opt.label, opt.value])
);

function guessValueFromText(locationText: string): string | null {
  const text = locationText.toLowerCase();
  if (text.includes('main building') || text.includes('administration')) return 'MAIN_BUILDING';
  if (text.includes('block a') || text.includes('computing') || text.includes('it')) return 'BLOCK_A';
  if (text.includes('block b') || text.includes('engineering')) return 'BLOCK_B';
  if (text.includes('block c') || text.includes('business')) return 'BLOCK_C';
  if (text.includes('library')) return 'LIBRARY';
  if (text.includes('student center') || text.includes('cafeteria')) return 'STUDENT_CENTER';
  if (text.includes('auditorium')) return 'AUDITORIUM';
  if (text.includes('sports')) return 'SPORTS_COMPLEX';
  if (text.includes('car park a') || text.includes('parking a')) return 'PARKING_A';
  if (text.includes('car park b') || text.includes('parking b')) return 'PARKING_B';
  if (text.includes('main gate') || text.includes('security post')) return 'MAIN_GATE';
  if (text.includes('hostel') || text.includes('accommodation')) return 'HOSTEL_ZONE';
  if (text.includes('courtyard') || text.includes('open lecture')) return 'OPEN_LECTURE_AREA';
  if (text.includes('lab') || text.includes('laboratory')) return 'LAB_COMPLEX';
  return null;
}

/**
 * Resolves a campus pin from either a dropdown location value, a dropdown label, or
 * a legacy location text saved in older tickets.
 */
export function resolveIncidentLocationPin(location: string | null | undefined): LatLng | null {
  if (!location) return null;
  const direct = LOCATION_PIN_BY_VALUE[location];
  if (direct) return direct;
  const fromLabel = LABEL_TO_VALUE[location];
  if (fromLabel) return LOCATION_PIN_BY_VALUE[fromLabel] ?? null;
  const guessed = guessValueFromText(location);
  return guessed ? LOCATION_PIN_BY_VALUE[guessed] ?? null : null;
}

export function resolveIncidentLocationLabel(locationValue: string | null | undefined): string | null {
  if (!locationValue) return null;
  const found = SLIIT_LOCATION_OPTIONS.find((opt) => opt.value === locationValue);
  return found ? found.label : null;
}

