import { LocationData } from '../types';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function generateSosShareText(
  riderName: string,
  bikeModel: string,
  plate: string,
  location: LocationData,
  fuelNeeded: string
): string {
  const gmaps = getGoogleMapsUrl(location.latitude, location.longitude);
  return `🚨 EMERGENCY DRY FUEL ALERT 🚨
Rider: ${riderName}
Vehicle: ${bikeModel} (${plate})
Status: Out of fuel (Dry Tank)
Fuel Needed: ${fuelNeeded}
Location: ${location.address} ${location.landmark ? `(Near ${location.landmark})` : ''}
Coordinates: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}
Live Map: ${gmaps}`;
}

export const LOCATION_PRESETS: { name: string; desc: string; data: LocationData }[] = [
  {
    name: 'NH-48 Highway Km 84 (Expressway Outskirt)',
    desc: 'Bypass exit 12, near milestone 84. Low pedestrian traffic.',
    data: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 8,
      address: 'National Highway 48, Mile 84 Bypass',
      landmark: 'Toll Plaza South Exit 2km ahead',
      roadName: 'NH-48 Expressway',
      speed: 0,
      heading: 45,
    },
  },
  {
    name: 'Metro Ring Road Crossway',
    desc: 'Outer Ring junction, shoulder lane breakdown.',
    data: {
      latitude: 12.9279,
      longitude: 77.6271,
      accuracy: 12,
      address: 'Outer Ring Road, 14th Main Cross',
      landmark: 'Opposite Tech Hub Gate 3',
      roadName: 'Outer Ring Road',
      speed: 0,
      heading: 180,
    },
  },
  {
    name: 'Hills Pass Mountain Road',
    desc: 'Remote hairpin curve 9, isolated route.',
    data: {
      latitude: 13.0358,
      longitude: 77.5970,
      accuracy: 25,
      address: 'Valley View Pass Road, Curve 9',
      landmark: 'Scenic Overlook Point #2',
      roadName: 'Valley Ghat Road',
      speed: 0,
      heading: 90,
    },
  },
];
