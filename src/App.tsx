import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { RiderDashboard } from './components/RiderDashboard';
import { PetrolPumpTerminal } from './components/PetrolPumpTerminal';
import { InteractiveMap } from './components/InteractiveMap';
import { SosShareModal } from './components/SosShareModal';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_PETROL_STATIONS } from './data/mockStations';
import { BikeTelemetry, FuelAlert, PetrolStation, DispatchUnit, FuelType } from './types';
import { calculateDistanceKm, LOCATION_PRESETS } from './utils/geo';
import { soundManager } from './utils/audio';

const STORAGE_KEY_BIKE = 'motofuel_bike_state';
const STORAGE_KEY_ALERT = 'motofuel_active_alert';

const DEFAULT_BIKE: BikeTelemetry = {
  bikeId: 'bike-yamaha-mt07',
  model: 'Yamaha MT-07 ABS',
  licensePlate: 'KA-04-MT-7742',
  ownerName: 'Alex Mercer',
  ownerPhone: '+1 (555) 234-5678',
  fuelType: 'Petrol 95',
  tankCapacityLiters: 14,
  currentFuelLiters: 2.2, // ~15% reserve
  fuelPercentage: 15.7,
  isDry: false,
  isReserve: true,
  batteryLevel: 94,
  odometerKm: 12450,
  engineRunning: true,
  location: { ...LOCATION_PRESETS[0].data },
};

export default function App() {
  const [stations, setStations] = useState<PetrolStation[]>(INITIAL_PETROL_STATIONS);
  const [activeView, setActiveView] = useState<'split' | 'rider' | 'station' | 'map'>('split');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Bike State
  const [bike, setBike] = useState<BikeTelemetry>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BIKE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BIKE;
  });

  // Active Emergency Alert State
  const [activeAlert, setActiveAlert] = useState<FuelAlert | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Keep soundManager mute state synced
  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BIKE, JSON.stringify(bike));
    } catch {}
  }, [bike]);

  useEffect(() => {
    try {
      if (activeAlert) {
        localStorage.setItem(STORAGE_KEY_ALERT, JSON.stringify(activeAlert));
      } else {
        localStorage.removeItem(STORAGE_KEY_ALERT);
      }
    } catch {}
  }, [activeAlert]);

  // Calculate nearest petrol station based on bike's current GPS
  const nearestStation = useMemo(() => {
    if (!stations.length) return null;
    let closest = stations[0];
    let minDistance = Infinity;

    stations.forEach((st) => {
      const dist = calculateDistanceKm(
        bike.location.latitude,
        bike.location.longitude,
        st.latitude,
        st.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        closest = st;
      }
    });

    return closest;
  }, [stations, bike.location.latitude, bike.location.longitude]);

  const distanceToNearestStation = useMemo(() => {
    if (!nearestStation) return 0;
    return calculateDistanceKm(
      bike.location.latitude,
      bike.location.longitude,
      nearestStation.latitude,
      nearestStation.longitude
    );
  }, [nearestStation, bike.location.latitude, bike.location.longitude]);

  const [selectedStationId, setSelectedStationId] = useState<string>(
    nearestStation?.id || INITIAL_PETROL_STATIONS[0].id
  );

  // Keep selectedStationId updated to nearest station if no manual override
  useEffect(() => {
    if (nearestStation && !activeAlert) {
      setSelectedStationId(nearestStation.id);
    }
  }, [nearestStation, activeAlert]);

  const currentStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  const distanceToCurrentStation = useMemo(() => {
    return calculateDistanceKm(
      bike.location.latitude,
      bike.location.longitude,
      currentStation.latitude,
      currentStation.longitude
    );
  }, [bike.location, currentStation]);

  // AUTOMATIC DRY FUEL TRIGGER HANDLER
  const triggerDryFuelEmergency = (customLocation?: typeof bike.location) => {
    const loc = customLocation || bike.location;
    const targetStation = nearestStation || stations[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Set bike status to 0 fuel and dry
    setBike((prev) => ({
      ...prev,
      currentFuelLiters: 0,
      fuelPercentage: 0,
      isDry: true,
      isReserve: false,
      engineRunning: false,
      location: loc,
    }));

    // Create Emergency Distress Alert
    const newAlert: FuelAlert = {
      id: `SOS-${Date.now().toString().slice(-6)}`,
      bikeId: bike.bikeId,
      riderName: bike.ownerName,
      riderPhone: bike.ownerPhone,
      bikeModel: bike.model,
      licensePlate: bike.licensePlate,
      fuelType: bike.fuelType,
      requestedFuelLiters: 5,
      location: loc,
      timestamp,
      severity: 'critical_dry',
      status: 'alert_sent',
      targetStationId: targetStation.id,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'system',
          senderName: 'Bike IoT Sensor',
          text: `🚨 CRITICAL: Dry fuel detected (0.0L). Automatic distress broadcasted with GPS coordinates to ${targetStation.name}.`,
          timestamp,
        },
      ],
    };

    setActiveAlert(newAlert);
    setSelectedStationId(targetStation.id);

    // Play sounds
    soundManager.playDryAlertAlarm();
    setTimeout(() => {
      soundManager.playStationIncomingChime();
    }, 600);
  };

  // Fuel Slider Change Handler
  const handleUpdateFuel = (liters: number) => {
    const rounded = Math.max(0, Math.min(bike.tankCapacityLiters, Number(liters.toFixed(1))));
    const pct = Number(((rounded / bike.tankCapacityLiters) * 100).toFixed(1));
    const isDry = rounded <= 0.05;
    const isReserve = rounded > 0.05 && pct <= 15;

    setBike((prev) => ({
      ...prev,
      currentFuelLiters: rounded,
      fuelPercentage: pct,
      isDry,
      isReserve,
      engineRunning: !isDry,
    }));

    // Auto-trigger if dropped to 0
    if (isDry && (!activeAlert || activeAlert.status === 'completed')) {
      triggerDryFuelEmergency();
    } else if (!isDry && activeAlert && activeAlert.status === 'alert_sent') {
      // If user manually refueled before dispatch
      setActiveAlert(null);
    }
  };

  // STATION SOFTWARE ACTIONS
  const handleAcknowledgeAlert = () => {
    if (!activeAlert) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveAlert((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'acknowledged_by_station',
        acknowledgedAt: time,
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'station',
            senderName: `${currentStation.name} Operator`,
            text: `Alert received & acknowledged. Preparing emergency dispatch unit for your coordinates.`,
            timestamp: time,
          },
        ],
      };
    });

    soundManager.playDispatchAssignedTone();
  };

  const handleAssignDispatch = (unit: DispatchUnit, fuelCan: '2L' | '5L' | '10L', customNote: string) => {
    if (!activeAlert) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setActiveAlert((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'dispatch_assigned',
        assignedUnit: unit,
        dispatchedAt: time,
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'station',
            senderName: `${currentStation.brand} Dispatch Desk`,
            text: `🚨 EMERGENCY UNIT DISPATCHED: Driver ${unit.driverName} (${unit.vehicleType} #${unit.vehiclePlate}) is en route carrying ${fuelCan} ${prev.fuelType}. ETA ~${unit.etaMinutes} mins.${customNote ? ` Note: ${customNote}` : ''}`,
            timestamp: time,
          },
        ],
      };
    });

    soundManager.playDispatchAssignedTone();
  };

  const handleUpdateDispatchStatus = (status: 'en_route' | 'arrived' | 'completed') => {
    if (!activeAlert) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let statusText = '';
    if (status === 'en_route') {
      statusText = `Driver ${activeAlert.assignedUnit?.driverName || 'Responder'} is on the road approaching your location.`;
    } else if (status === 'arrived') {
      statusText = `Driver has arrived on scene at your stranded bike. Commencing safe roadside fueling.`;
    } else if (status === 'completed') {
      statusText = `✅ Refueling completed! 5 Liters of ${activeAlert.fuelType} added. Bike ready to ride.`;
    }

    setActiveAlert((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status,
        resolvedAt: status === 'completed' ? time : prev.resolvedAt,
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'station',
            senderName: `${currentStation.brand} Mobile Assist`,
            text: statusText,
            timestamp: time,
          },
        ],
      };
    });

    if (status === 'completed') {
      soundManager.playSuccessChime();
      // Refuel bike back to 5 Liters
      setBike((prev) => ({
        ...prev,
        currentFuelLiters: 5,
        fuelPercentage: Number(((5 / prev.tankCapacityLiters) * 100).toFixed(1)),
        isDry: false,
        isReserve: false,
        engineRunning: true,
      }));
    } else {
      soundManager.playDispatchAssignedTone();
    }
  };

  const handleSendMessageFromRider = (text: string) => {
    if (!activeAlert) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveAlert((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'rider',
            senderName: bike.ownerName,
            text,
            timestamp: time,
          },
        ],
      };
    });
  };

  const handleSendStationMessage = (text: string) => {
    if (!activeAlert) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveAlert((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'station',
            senderName: `${currentStation.name} Operator`,
            text,
            timestamp: time,
          },
        ],
      };
    });
    soundManager.playDispatchAssignedTone();
  };

  const handleCancelAlert = () => {
    setActiveAlert(null);
    setBike((prev) => ({
      ...prev,
      isDry: false,
    }));
  };

  const handleSimulateRefuel = () => {
    soundManager.playSuccessChime();
    setBike((prev) => ({
      ...prev,
      currentFuelLiters: 6,
      fuelPercentage: Number(((6 / prev.tankCapacityLiters) * 100).toFixed(1)),
      isDry: false,
      isReserve: false,
      engineRunning: true,
    }));
    setActiveAlert(null);
  };

  const handleRelocateBike = (lat: number, lng: number) => {
    const updatedLocation = {
      ...bike.location,
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lng.toFixed(5)),
      address: `Roadway Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      landmark: 'Custom Map Pin',
    };

    setBike((prev) => ({
      ...prev,
      location: updatedLocation,
    }));

    if (activeAlert) {
      setActiveAlert((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          location: updatedLocation,
        };
      });
    }
  };

  // Browser Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const newLoc = {
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: `Current GPS Device Location`,
          landmark: `Accuracy: ±${Math.round(accuracy)}m`,
        };
        setBike((prev) => ({
          ...prev,
          location: newLoc,
        }));
        if (activeAlert) {
          setActiveAlert((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              location: newLoc,
            };
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        activeAlert={activeAlert}
        bike={bike}
        onTriggerDryAlert={() => triggerDryFuelEmergency()}
        onResetSystem={handleSimulateRefuel}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: DUAL VIEW (Rider Dashboard + Petrol Pump Terminal Side-by-Side) */}
        {activeView === 'split' && (
          <div className="space-y-6">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-semibold text-neutral-200">
                  Dual Software Simulator
                </span>
                <span className="text-neutral-400">
                  Watch live as the bike triggers dry fuel, transmits distress to the pump terminal, and receives the response on the rider dashboard.
                </span>
              </div>
              <button
                onClick={() => triggerDryFuelEmergency()}
                disabled={bike.isDry}
                className="px-3 py-1.5 rounded-lg font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 transition-colors self-start sm:self-auto"
              >
                {bike.isDry ? 'Dry Tank Alert Active' : 'Simulate 0% Dry Tank'}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column: Rider Personal Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Perspective 1: Rider Personal Dashboard
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {bike.ownerName} ({bike.model})
                  </span>
                </div>
                <RiderDashboard
                  bike={bike}
                  activeAlert={activeAlert}
                  nearestStation={nearestStation}
                  distanceToStation={distanceToNearestStation}
                  onUpdateFuel={handleUpdateFuel}
                  onManualTriggerDry={() => triggerDryFuelEmergency()}
                  onSendMessage={handleSendMessageFromRider}
                  onCancelAlert={handleCancelAlert}
                  onSimulateRefuel={handleSimulateRefuel}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                  onLocateMe={handleLocateMe}
                  isLocating={isLocating}
                />
              </div>

              {/* Right Column: Petrol Pump Station Software */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Perspective 2: Petrol Pump Terminal ("Their Own Software")
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {currentStation.name}
                  </span>
                </div>
                <PetrolPumpTerminal
                  station={currentStation}
                  stations={stations}
                  onSelectStation={setSelectedStationId}
                  activeAlert={activeAlert}
                  distanceToRider={distanceToCurrentStation}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                  onAssignDispatch={handleAssignDispatch}
                  onUpdateDispatchStatus={handleUpdateDispatchStatus}
                  onSendStationMessage={handleSendStationMessage}
                />
              </div>
            </div>

            {/* Embedded Live Map on Dual View */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Live GPS Map & Route Navigation
                </span>
                <span className="text-[11px] text-neutral-500">
                  Showing stranded bike position & nearby emergency fuel stations
                </span>
              </div>
              <InteractiveMap
                bike={bike}
                stations={stations}
                activeAlert={activeAlert}
                onRelocateBike={handleRelocateBike}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: RIDER DASHBOARD ONLY */}
        {activeView === 'rider' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <RiderDashboard
              bike={bike}
              activeAlert={activeAlert}
              nearestStation={nearestStation}
              distanceToStation={distanceToNearestStation}
              onUpdateFuel={handleUpdateFuel}
              onManualTriggerDry={() => triggerDryFuelEmergency()}
              onSendMessage={handleSendMessageFromRider}
              onCancelAlert={handleCancelAlert}
              onSimulateRefuel={handleSimulateRefuel}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
            />

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                My Real-time Location on Map
              </span>
              <InteractiveMap
                bike={bike}
                stations={stations}
                activeAlert={activeAlert}
                onRelocateBike={handleRelocateBike}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: PETROL PUMP TERMINAL ONLY */}
        {activeView === 'station' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <PetrolPumpTerminal
              station={currentStation}
              stations={stations}
              onSelectStation={setSelectedStationId}
              activeAlert={activeAlert}
              distanceToRider={distanceToCurrentStation}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onAssignDispatch={handleAssignDispatch}
              onUpdateDispatchStatus={handleUpdateDispatchStatus}
              onSendStationMessage={handleSendStationMessage}
            />

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                Station Dispatch Radar
              </span>
              <InteractiveMap
                bike={bike}
                stations={stations}
                activeAlert={activeAlert}
                onRelocateBike={handleRelocateBike}
                onLocateMe={handleLocateMe}
                isLocating={isLocating}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: FULL INTERACTIVE MAP RADAR */}
        {activeView === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Live Roadside Fuel Radar & Dispatch Map
                </h2>
                <p className="text-xs text-neutral-400">
                  Interactive OpenStreetMap with live telemetry pins, emergency stations, and mobile dispatch routing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerDryFuelEmergency()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow"
                >
                  Test Dry Tank Alert Here
                </button>
              </div>
            </div>

            <InteractiveMap
              bike={bike}
              stations={stations}
              activeAlert={activeAlert}
              onRelocateBike={handleRelocateBike}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MotoFuel SOS • Real-time Dry Fuel Distress & Emergency Petrol Pump Dispatch</span>
          <span className="font-mono text-neutral-400">
            Current GPS: {bike.location.latitude.toFixed(4)}°, {bike.location.longitude.toFixed(4)}° ({bike.location.address})
          </span>
        </div>
      </footer>

      {/* Modals */}
      <SosShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        bike={bike}
        activeAlert={activeAlert}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        bike={bike}
        onSaveBike={(updated) => setBike((prev) => ({ ...prev, ...updated }))}
      />
    </div>
  );
}
