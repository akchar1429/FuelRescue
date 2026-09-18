import React, { useState } from 'react';
import { 
  Building2, 
  AlertCircle, 
  Truck, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Navigation, 
  Send, 
  Fuel, 
  Flame, 
  Radio, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  Package,
  Layers
} from 'lucide-react';
import { PetrolStation, FuelAlert, DispatchUnit, FuelType } from '../types';
import { formatCoordinates, formatDistance, getGoogleMapsUrl } from '../utils/geo';

interface PetrolPumpTerminalProps {
  station: PetrolStation;
  stations: PetrolStation[];
  onSelectStation: (stationId: string) => void;
  activeAlert: FuelAlert | null;
  distanceToRider: number;
  onAcknowledgeAlert: () => void;
  onAssignDispatch: (unit: DispatchUnit, fuelCan: '2L' | '5L' | '10L', customNote: string) => void;
  onUpdateDispatchStatus: (status: 'en_route' | 'arrived' | 'completed') => void;
  onSendStationMessage: (text: string) => void;
}

export const PetrolPumpTerminal: React.FC<PetrolPumpTerminalProps> = ({
  station,
  stations,
  onSelectStation,
  activeAlert,
  distanceToRider,
  onAcknowledgeAlert,
  onAssignDispatch,
  onUpdateDispatchStatus,
  onSendStationMessage,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>(station.dispatchUnits[0]?.id || '');
  const [selectedCan, setSelectedCan] = useState<'2L' | '5L' | '10L'>('5L');
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [operatorMsg, setOperatorMsg] = useState<string>('');
  const [isStationOnline, setIsStationOnline] = useState<boolean>(true);

  const isAlertForThisStation = activeAlert && (activeAlert.targetStationId === station.id || !activeAlert.targetStationId);
  const isPendingAcknowledge = isAlertForThisStation && activeAlert.status === 'alert_sent';
  const isAwaitingDispatch = isAlertForThisStation && activeAlert.status === 'acknowledged_by_station';
  const isDispatched = isAlertForThisStation && ['dispatch_assigned', 'en_route', 'arrived', 'refueling_in_progress'].includes(activeAlert.status);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const unit = station.dispatchUnits.find(u => u.id === selectedUnitId) || station.dispatchUnits[0];
    if (!unit) return;
    onAssignDispatch(unit, selectedCan, dispatchNote);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorMsg.trim()) return;
    onSendStationMessage(operatorMsg.trim());
    setOperatorMsg('');
  };

  const quickAlertTemplates = [
    'Mobile fuel unit has departed station. Look out for hazard lights.',
    'Driver is 2 minutes away on the shoulder lane.',
    'Driver has arrived at your bike. Beginning safety refueling.',
    '5 Liters filled successfully. Payment received, have a safe trip!',
  ];

  return (
    <div className="space-y-4">
      {/* Station Terminal Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {station.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  Station Terminal Software
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {station.address} • Hotline: {station.phone}
              </p>
            </div>
          </div>

          {/* Station Switcher & Status */}
          <div className="flex items-center gap-2">
            <select
              value={station.id}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.brand}: {s.name.slice(0, 22)}...
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsStationOnline(!isStationOnline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isStationOnline 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isStationOnline ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
              <span>{isStationOnline ? 'Station Online' : 'Standby'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE INCOMING INCIDENT CONSOLE */}
      {isAlertForThisStation && activeAlert && activeAlert.status !== 'completed' && activeAlert.status !== 'cancelled' ? (
        <div className="rounded-2xl p-4 sm:p-5 border border-rose-500/50 bg-gradient-to-br from-rose-950/40 via-neutral-900 to-neutral-900 shadow-xl space-y-4">
          {/* Urgency Alert Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500 text-white uppercase tracking-wider">
                    INCOMING DRY FUEL EMERGENCY
                  </span>
                  <span className="text-xs text-rose-300 font-mono">
                    Dist: ~{formatDistance(distanceToRider)}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Biker stranded with empty tank. Requires mobile roadside fuel delivery.
                </p>
              </div>
            </div>

            {/* Acknowledge Button */}
            {isPendingAcknowledge && (
              <button
                id="station-ack-btn"
                onClick={onAcknowledgeAlert}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer animate-pulse"
              >
                <CheckCircle className="w-4 h-4" />
                <span>ACKNOWLEDGE & ACCEPT INCIDENT</span>
              </button>
            )}
          </div>

          {/* Incident Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Stranded Rider Info */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider block">
                Stranded Rider & Vehicle
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{activeAlert.riderName}</span>
                <a
                  href={`tel:${activeAlert.riderPhone}`}
                  className="flex items-center gap-1 text-blue-400 hover:underline font-mono"
                >
                  <Phone className="w-3 h-3" />
                  {activeAlert.riderPhone}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-neutral-500 block">Bike:</span>
                  <span className="text-neutral-200 font-medium">{activeAlert.bikeModel}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Plate:</span>
                  <span className="text-neutral-200 font-mono">{activeAlert.licensePlate}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Required Fuel:</span>
                  <span className="text-amber-400 font-semibold">{activeAlert.fuelType}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Current Tank:</span>
                  <span className="text-rose-400 font-bold">0.0 Liters (DRY)</span>
                </div>
              </div>
            </div>

            {/* GPS Location Transmitted */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-semibold uppercase tracking-wider">
                  GPS Location Transmitted
                </span>
                <span className="text-emerald-400 font-mono">
                  {formatDistance(distanceToRider)} from station
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {activeAlert.location.address}
              </p>
              {activeAlert.location.landmark && (
                <p className="text-xs text-neutral-400">
                  Landmark: <span className="text-neutral-200">{activeAlert.location.landmark}</span>
                </p>
              )}
              <div className="flex items-center justify-between pt-1 font-mono text-neutral-300">
                <span>{formatCoordinates(activeAlert.location.latitude, activeAlert.location.longitude)}</span>
                <a
                  href={getGoogleMapsUrl(activeAlert.location.latitude, activeAlert.location.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Map</span>
                </a>
              </div>
            </div>
          </div>

          {/* DISPATCH ACTION FORM (When acknowledged) */}
          {isAwaitingDispatch && (
            <form onSubmit={handleDispatchSubmit} className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dispatch Emergency Mobile Fuel Unit to Rider
                  </h4>
                </div>
                <span className="text-xs text-amber-400">
                  Will transmit instant alert to Rider's Dashboard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Unit Picker */}
                <div>
                  <label className="text-neutral-400 block mb-1">Select Driver / Vehicle:</label>
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg p-2 focus:outline-none focus:border-amber-500"
                  >
                    {station.dispatchUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.driverName} ({unit.vehicleType} - {unit.vehiclePlate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fuel Can Size */}
                <div>
                  <label className="text-neutral-400 block mb-1">Emergency Jerry Can Size:</label>
                  <div className="flex gap-2">
                    {(['2L', '5L', '10L'] as const).map(can => (
                      <button
                        type="button"
                        key={can}
                        onClick={() => setSelectedCan(can)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          selectedCan === can
                            ? 'bg-amber-500 text-neutral-950 border-amber-500'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
                        }`}
                      >
                        {can}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dispatch Button */}
                <div className="flex items-end">
                  <button
                    id="station-dispatch-submit-btn"
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md transition-transform active:scale-95"
                  >
                    Dispatch Now & Alert Rider
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ACTIVE DISPATCH PROGRESS TRACKER */}
          {isDispatched && activeAlert.assignedUnit && (
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-blue-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-bold text-white">
                      Unit Dispatched: {activeAlert.assignedUnit.driverName} ({activeAlert.assignedUnit.vehiclePlate})
                    </span>
                    <span className="text-[11px] text-blue-300 ml-2">
                      Carrying: {selectedCan} {activeAlert.fuelType} • ETA ~{activeAlert.assignedUnit.etaMinutes} mins
                    </span>
                  </div>
                </div>

                {/* Step updater controls */}
                <div className="flex items-center gap-1.5">
                  {activeAlert.status === 'dispatch_assigned' && (
                    <button
                      onClick={() => onUpdateDispatchStatus('en_route')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                      Update: Driver En Route
                    </button>
                  )}
                  {activeAlert.status === 'en_route' && (
                    <button
                      onClick={() => onUpdateDispatchStatus('arrived')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                    >
                      Update: Arrived at Bike
                    </button>
                  )}
                  {activeAlert.status === 'arrived' && (
                    <button
                      onClick={() => onUpdateDispatchStatus('completed')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                    >
                      Complete Refueling & Finish Rescue
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Station Operator Comms / Quick Alerts to Rider */}
          <div className="pt-2 border-t border-neutral-800/80">
            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider block mb-2">
              Send Alert Message From Station Software To Rider's Dashboard
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickAlertTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendStationMessage(template)}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-left transition-colors"
                >
                  "{template.slice(0, 38)}..."
                </button>
              ))}
            </div>

            <form onSubmit={handleSendCustomMessage} className="flex gap-2">
              <input
                type="text"
                value={operatorMsg}
                onChange={(e) => setOperatorMsg(e.target.value)}
                placeholder="Type official station dispatch message to rider..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!operatorMsg.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Alert</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Standby Monitoring Card */
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Emergency Distress Frequency Active (Listening)
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
              Station is monitoring automatic dry fuel IoT signals within a 15 km radius. When a rider's tank reaches 0%, their distress signal will strobe here immediately.
            </p>
          </div>
          <div className="text-xs text-neutral-500 font-mono">
            Station Status: Online • 2 Emergency Units on Standby
          </div>
        </div>
      )}

      {/* Station Capacity, Inventory & Fleet Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Emergency Fuel Cans Inventory */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              Emergency Cans
            </span>
            <span className="text-emerald-400 font-mono font-bold">In Stock</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">2L Can</span>
              <span className="font-bold text-white">{station.availableCans['2L']} left</span>
            </div>
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">5L Can</span>
              <span className="font-bold text-white">{station.availableCans['5L']} left</span>
            </div>
            <div className="p-2 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-400 block text-[10px]">10L Can</span>
              <span className="font-bold text-white">{station.availableCans['10L']} left</span>
            </div>
          </div>
        </div>

        {/* Station Rescue Fleet */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-400" />
              Active Rescue Units
            </span>
            <span className="text-blue-400 font-mono">{station.dispatchUnits.length} Ready</span>
          </div>
          <div className="space-y-1.5 pt-1 text-xs">
            {station.dispatchUnits.map(unit => (
              <div key={unit.id} className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-200">{unit.driverName}</span>
                <span className="text-neutral-400 font-mono">{unit.vehiclePlate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Station Pricing & Response */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-emerald-400" />
              Fuel Tariffs
            </span>
            <span className="text-neutral-400 text-[11px]">Avg ETA: {station.responseTimeAvgMin}m</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-neutral-300">
            <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex justify-between">
              <span className="text-neutral-400">Petrol 95:</span>
              <span className="font-mono text-white">${station.fuelPrices['Petrol 95']}/L</span>
            </div>
            <div className="p-1.5 rounded bg-neutral-950 border border-neutral-800 flex justify-between">
              <span className="text-neutral-400">Petrol 91:</span>
              <span className="font-mono text-white">${station.fuelPrices['Petrol 91']}/L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
