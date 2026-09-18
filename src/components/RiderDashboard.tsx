import React, { useState } from 'react';
import { 
  Fuel, 
  MapPin, 
  AlertTriangle, 
  Send, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  ShieldAlert, 
  Truck, 
  User, 
  Flame, 
  Sparkles,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { BikeTelemetry, FuelAlert, PetrolStation } from '../types';
import { formatCoordinates, formatDistance, getGoogleMapsUrl } from '../utils/geo';

interface RiderDashboardProps {
  bike: BikeTelemetry;
  activeAlert: FuelAlert | null;
  nearestStation: PetrolStation | null;
  distanceToStation: number;
  onUpdateFuel: (liters: number) => void;
  onManualTriggerDry: () => void;
  onSendMessage: (text: string) => void;
  onCancelAlert: () => void;
  onSimulateRefuel: () => void;
  onOpenShareModal: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export const RiderDashboard: React.FC<RiderDashboardProps> = ({
  bike,
  activeAlert,
  nearestStation,
  distanceToStation,
  onUpdateFuel,
  onManualTriggerDry,
  onSendMessage,
  onCancelAlert,
  onSimulateRefuel,
  onOpenShareModal,
  onLocateMe,
  isLocating,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const isDry = bike.isDry || (activeAlert && activeAlert.status !== 'completed' && activeAlert.status !== 'cancelled');

  const handleCopyCoords = () => {
    const text = `${bike.location.latitude.toFixed(6)}, ${bike.location.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const steps = [
    { key: 'alert_sent', label: 'Alert Sent to Pump', icon: AlertTriangle },
    { key: 'acknowledged_by_station', label: 'Pump Acknowledged', icon: CheckCircle2 },
    { key: 'dispatch_assigned', label: 'Van Assigned', icon: Truck },
    { key: 'en_route', label: 'Fuel En Route', icon: Navigation },
    { key: 'arrived', label: 'Arrived at Bike', icon: MapPin },
    { key: 'completed', label: 'Refueled', icon: Fuel },
  ];

  const getStepIndex = (status?: string) => {
    if (!status || status === 'idle') return -1;
    switch (status) {
      case 'alert_sent': return 0;
      case 'acknowledged_by_station': return 1;
      case 'dispatch_assigned': return 2;
      case 'en_route': return 3;
      case 'arrived':
      case 'refueling_in_progress': return 4;
      case 'completed': return 5;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(activeAlert?.status);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Rider Personal Dashboard
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono">
                  {bike.licensePlate}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {bike.model} • Connected via IoT Smart Fuel Sensor (v2.4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="rider-locate-btn"
              onClick={onLocateMe}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
              title="Detect current device GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Update My GPS'}</span>
            </button>

            <button
              id="rider-share-sos-btn"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Location</span>
            </button>
          </div>
        </div>
      </div>

      {/* EMERGENCY ALERT ACTIVE CARD (Only when Dry or Alert is active) */}
      {isDry && (
        <div className="rounded-2xl p-4 sm:p-5 border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-900 shadow-xl relative overflow-hidden">
          {/* Top urgency banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-rose-900/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-bounce">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white tracking-wider uppercase animate-pulse">
                    EMERGENCY DRY FUEL SOS
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    ID: #{activeAlert ? activeAlert.id.slice(-6) : 'SYS-01'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Alert Transmitted to {nearestStation ? nearestStation.name : 'Nearest Petrol Pump'}
                </h3>
                <p className="text-xs text-rose-200/80">
                  Your bike tank is completely dry. Your exact GPS coordinates and distress packet were broadcasted to their dispatch software.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSimulateRefuel}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors"
              >
                Simulate Refueled
              </button>
              <button
                onClick={onCancelAlert}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
              >
                Cancel SOS
              </button>
            </div>
          </div>

          {/* Location Details on Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1 font-semibold text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Broadcasted Location
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  GPS Active (±{bike.location.accuracy || 10}m)
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {bike.location.address}
              </p>
              {bike.location.landmark && (
                <p className="text-xs text-neutral-400">
                  Landmark: <span className="text-neutral-200">{bike.location.landmark}</span>
                </p>
              )}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="font-mono text-neutral-300">
                  {formatCoordinates(bike.location.latitude, bike.location.longitude)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyCoords}
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="Copy GPS coordinates"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={getGoogleMapsUrl(bike.location.latitude, bike.location.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="Open on Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Station Dispatch Progress Card */}
            <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-semibold text-neutral-300">
                  Assigned Petrol Pump
                </span>
                <span className="text-amber-400 font-medium font-mono">
                  {formatDistance(distanceToStation)} away
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {nearestStation?.name || 'Local Highway Petrol Pump'}
              </p>
              {activeAlert?.assignedUnit ? (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      {activeAlert.assignedUnit.driverName} ({activeAlert.assignedUnit.vehicleType})
                    </span>
                    <span className="font-mono text-emerald-400">
                      ETA: ~{activeAlert.assignedUnit.etaMinutes} mins
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-neutral-300">
                    <span>Vehicle: {activeAlert.assignedUnit.vehiclePlate}</span>
                    <span>Carrying: 5L {activeAlert.fuelType}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Waiting for pump operator to assign mobile fuel unit...</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Status Tracker Progress */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Live Emergency Response Pipeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div 
                    key={step.key}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <div className="flex justify-center mb-1.5">
                      <Icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce text-amber-400' : isPassed ? 'text-emerald-400' : 'text-neutral-600'}`} />
                    </div>
                    <span className="text-[11px] font-medium leading-tight block">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* BIKE TELEMETRY & FUEL LEVEL CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fuel Gauge & Sensor Telemetry */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Bike IoT Fuel Telemetry
              </h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              bike.isDry
                ? 'bg-rose-500 text-white animate-pulse'
                : bike.isReserve
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {bike.isDry ? 'TANK DRY (0%)' : bike.isReserve ? 'RESERVE FUEL' : 'NORMAL LEVEL'}
            </span>
          </div>

          {/* Big Fuel Level Meter */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {bike.currentFuelLiters.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-400 ml-1">
                  / {bike.tankCapacityLiters} Liters
                </span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black ${
                  bike.isDry ? 'text-rose-500' : bike.isReserve ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {bike.fuelPercentage.toFixed(0)}%
                </span>
                <span className="text-xs text-neutral-500 block">
                  Est. Range: ~{Math.round(bike.currentFuelLiters * 28)} km
                </span>
              </div>
            </div>

            {/* Visual Fuel Bar */}
            <div className="w-full h-4 bg-neutral-950 rounded-full p-0.5 border border-neutral-800 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  bike.isDry
                    ? 'w-0'
                    : bike.fuelPercentage < 15
                    ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                    : bike.fuelPercentage < 35
                    ? 'bg-amber-500 shadow-md shadow-amber-500/50'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(bike.fuelPercentage, 0)}%` }}
              />
            </div>
          </div>

          {/* Interactive Fuel Control Slider */}
          <div className="p-3.5 bg-neutral-950/60 rounded-xl border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">
                Simulate Sensor Fuel Level
              </span>
              <span className="text-neutral-400 font-mono">
                {bike.currentFuelLiters.toFixed(1)} L
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={bike.tankCapacityLiters}
              step="0.2"
              value={bike.currentFuelLiters}
              onChange={(e) => onUpdateFuel(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>0L (Dry Trigger)</span>
              <span>Reserve (1.5L)</span>
              <span>Full ({bike.tankCapacityLiters}L)</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onUpdateFuel(0)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 transition-colors"
              >
                Set 0L (Trigger Dry Alert)
              </button>
              <button
                onClick={() => onUpdateFuel(1.5)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors"
              >
                Set Reserve (1.5L)
              </button>
              <button
                onClick={() => onUpdateFuel(bike.tankCapacityLiters)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 transition-colors"
              >
                Set Full Tank
              </button>
            </div>
          </div>

          {/* Vehicle Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
              <span className="text-neutral-500 block">Fuel Type</span>
              <span className="font-semibold text-neutral-200">{bike.fuelType}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
              <span className="text-neutral-500 block">Engine State</span>
              <span className={`font-semibold ${bike.isDry ? 'text-rose-400' : 'text-emerald-400'}`}>
                {bike.isDry ? 'Cutoff (Dry)' : 'Running OK'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
              <span className="text-neutral-500 block">Battery IoT</span>
              <span className="font-semibold text-neutral-200">{bike.batteryLevel}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
              <span className="text-neutral-500 block">Odometer</span>
              <span className="font-semibold text-neutral-200">{bike.odometerKm.toLocaleString()} km</span>
            </div>
          </div>
        </div>

        {/* Real-time Dispatch Chat & Operator Messages */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Pump Dispatch Comms
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                {activeAlert ? 'Live Connected' : 'Standby'}
              </span>
            </div>

            {/* Chat message bubbles */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {!activeAlert || activeAlert.messages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
                  <p>When dry fuel occurs, the petrol pump operator's messages and delivery alerts appear here.</p>
                </div>
              ) : (
                activeAlert.messages.map((msg) => {
                  const isRider = msg.sender === 'rider';
                  const isSystem = msg.sender === 'system';
                  return (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        isSystem
                          ? 'bg-neutral-950 border border-neutral-800 text-neutral-400 text-center'
                          : isRider
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 ml-4'
                          : 'bg-neutral-800 border border-neutral-700 text-neutral-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400">
                        <span className="font-semibold text-neutral-300">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isDry ? 'Send note to station (e.g. Landmark)' : 'Available when alert active'}
                disabled={!isDry}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isDry || !chatInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
