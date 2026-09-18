import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BikeTelemetry, PetrolStation, FuelAlert } from '../types';
import { calculateDistanceKm, formatCoordinates, formatDistance } from '../utils/geo';
import { MapPin, Navigation, Fuel, Crosshair, AlertTriangle, RefreshCw } from 'lucide-react';

interface InteractiveMapProps {
  bike: BikeTelemetry;
  stations: PetrolStation[];
  activeAlert: FuelAlert | null;
  onRelocateBike: (lat: number, lng: number) => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  bike,
  stations,
  activeAlert,
  onRelocateBike,
  onLocateMe,
  isLocating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const bikeMarkerRef = useRef<L.Marker | null>(null);
  const stationMarkersRef = useRef<L.Marker[]>([]);
  const vanMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [bike.location.latitude, bike.location.longitude],
      zoom: 14,
      zoomControl: true,
    });

    // Dark styled / Clean CartoDB / OSM tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Map click handler to relocate bike for rapid testing
    map.on('click', (e: L.LeafletMouseEvent) => {
      onRelocateBike(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update bike marker & stations on changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update Bike Marker
    const isDry = bike.isDry || (activeAlert && activeAlert.status !== 'completed' && activeAlert.status !== 'cancelled');

    const bikeIconHtml = `
      <div class="relative flex items-center justify-center">
        ${isDry ? '<div class="absolute w-12 h-12 rounded-full bg-rose-500/40 animate-ping"></div>' : ''}
        <div class="w-9 h-9 rounded-full ${isDry ? 'bg-rose-600 border-2 border-white' : 'bg-neutral-900 border-2 border-amber-400'} text-white flex items-center justify-center shadow-xl">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
    `;

    const customBikeIcon = L.divIcon({
      html: bikeIconHtml,
      className: 'custom-bike-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!bikeMarkerRef.current) {
      bikeMarkerRef.current = L.marker([bike.location.latitude, bike.location.longitude], {
        icon: customBikeIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      bikeMarkerRef.current.setLatLng([bike.location.latitude, bike.location.longitude]);
      bikeMarkerRef.current.setIcon(customBikeIcon);
    }

    bikeMarkerRef.current.bindPopup(`
      <div class="p-1 font-sans">
        <b class="text-neutral-900">${bike.model} (${bike.licensePlate})</b>
        <div class="text-xs text-neutral-600 mt-1">Status: <span class="${isDry ? 'text-red-600 font-bold' : 'text-green-600'}">${isDry ? 'OUT OF FUEL (DRY)' : 'Fuel OK'}</span></div>
        <div class="text-xs text-neutral-500 font-mono mt-0.5">${bike.location.latitude.toFixed(5)}, ${bike.location.longitude.toFixed(5)}</div>
        <div class="text-[11px] text-neutral-500 mt-1 italic">${bike.location.address}</div>
      </div>
    `);

    // Clean old station markers
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    // Add Petrol Stations
    stations.forEach((st) => {
      const dist = calculateDistanceKm(
        bike.location.latitude,
        bike.location.longitude,
        st.latitude,
        st.longitude
      );

      const isTarget = activeAlert && activeAlert.targetStationId === st.id;

      const stationHtml = `
        <div class="relative flex flex-col items-center">
          <div class="w-8 h-8 rounded-lg ${isTarget ? 'bg-blue-600 border-2 border-white animate-bounce' : 'bg-amber-500 border border-neutral-950'} text-neutral-950 flex items-center justify-center shadow-lg font-bold">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="mt-1 px-1.5 py-0.5 rounded bg-neutral-900/90 text-white text-[10px] font-mono whitespace-nowrap shadow border border-neutral-700">
            ${st.brand} • ${formatDistance(dist)}
          </span>
        </div>
      `;

      const stationIcon = L.divIcon({
        html: stationHtml,
        className: 'station-marker',
        iconSize: [40, 48],
        iconAnchor: [20, 24],
      });

      const sm = L.marker([st.latitude, st.longitude], { icon: stationIcon }).addTo(map);
      sm.bindPopup(`
        <div class="p-1 font-sans">
          <b class="text-neutral-900">${st.name}</b>
          <div class="text-xs text-neutral-600">${st.address}</div>
          <div class="text-xs text-blue-600 font-bold mt-1">Distance to bike: ${formatDistance(dist)}</div>
          <div class="text-[11px] text-neutral-500">Emergency units available: ${st.dispatchUnits.length}</div>
        </div>
      `);
      stationMarkersRef.current.push(sm);
    });

    // Update Route Line & Van Animation
    if (activeAlert?.assignedUnit && ['dispatch_assigned', 'en_route', 'arrived'].includes(activeAlert.status)) {
      const station = stations.find(s => s.id === activeAlert.targetStationId) || stations[0];
      const startPt: [number, number] = [station.latitude, station.longitude];
      const endPt: [number, number] = [bike.location.latitude, bike.location.longitude];

      // Draw dashed route
      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline([startPt, endPt], {
          color: '#3b82f6',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.85,
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs([startPt, endPt]);
      }

      // Calculate simulated van position halfway or en route
      const factor = activeAlert.status === 'arrived' ? 1.0 : activeAlert.status === 'en_route' ? 0.65 : 0.25;
      const vanLat = startPt[0] + (endPt[0] - startPt[0]) * factor;
      const vanLng = startPt[1] + (endPt[1] - startPt[1]) * factor;

      const vanHtml = `
        <div class="relative flex items-center justify-center animate-pulse">
          <div class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2a1 1 0 001-1m-6 0a1 1 0 01-1-1V9" />
            </svg>
          </div>
        </div>
      `;

      const vanIcon = L.divIcon({
        html: vanHtml,
        className: 'van-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!vanMarkerRef.current) {
        vanMarkerRef.current = L.marker([vanLat, vanLng], { icon: vanIcon, zIndexOffset: 900 }).addTo(map);
      } else {
        vanMarkerRef.current.setLatLng([vanLat, vanLng]);
      }

      vanMarkerRef.current.bindPopup(`
        <div class="p-1 font-sans">
          <b class="text-blue-700">Mobile Rescue Van: ${activeAlert.assignedUnit.driverName}</b>
          <div class="text-xs text-neutral-600">Plate: ${activeAlert.assignedUnit.vehiclePlate}</div>
          <div class="text-xs text-emerald-600 font-bold">En Route to Stranded Bike</div>
        </div>
      `);
    } else {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      if (vanMarkerRef.current) {
        vanMarkerRef.current.remove();
        vanMarkerRef.current = null;
      }
    }
  }, [bike, stations, activeAlert]);

  const handleCenterOnBike = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([bike.location.latitude, bike.location.longitude], 15, {
        duration: 1.2,
      });
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-xl">
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleCenterOnBike}
          className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 shadow-lg backdrop-blur transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Center map on bike"
        >
          <Crosshair className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Center Bike</span>
        </button>

        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 shadow-lg backdrop-blur transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Acquire real GPS coordinates"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin text-amber-400' : 'text-blue-400'}`} />
          <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Real GPS'}</span>
        </button>
      </div>

      {/* Bottom Telemetry Badge */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-md bg-neutral-950/90 backdrop-blur border border-neutral-800 p-3 rounded-xl shadow-xl pointer-events-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${bike.isDry ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
            <div>
              <span className="font-bold text-white block">
                {bike.isDry ? 'Dry Tank Emergency' : 'Bike Position Live'}
              </span>
              <span className="font-mono text-neutral-400 text-[11px]">
                {formatCoordinates(bike.location.latitude, bike.location.longitude)}
              </span>
            </div>
          </div>

          <span className="text-[10px] text-neutral-500 hidden sm:block">
            Click anywhere on map to reposition bike
          </span>
        </div>
      </div>
    </div>
  );
};
