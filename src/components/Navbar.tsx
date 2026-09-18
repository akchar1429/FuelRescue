import React from 'react';
import { 
  Fuel, 
  Radio, 
  MapPin, 
  Volume2, 
  VolumeX, 
  Flame, 
  Columns, 
  User, 
  Building2, 
  Map as MapIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FuelAlert, BikeTelemetry } from '../types';

interface NavbarProps {
  activeView: 'split' | 'rider' | 'station' | 'map';
  setActiveView: (view: 'split' | 'rider' | 'station' | 'map') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  activeAlert: FuelAlert | null;
  bike: BikeTelemetry;
  onTriggerDryAlert: () => void;
  onResetSystem: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  isMuted,
  setIsMuted,
  activeAlert,
  bike,
  onTriggerDryAlert,
  onResetSystem,
  onOpenSettings,
}) => {
  const isEmergency = bike.isDry || (activeAlert && activeAlert.status !== 'completed' && activeAlert.status !== 'cancelled');

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Core Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isEmergency 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse' 
                  : 'bg-amber-500 text-neutral-950 font-bold'
              }`}>
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    MotoFuel <span className="text-amber-400">SOS</span>
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    Dual Terminal System
                  </span>
                </div>
                <p className="text-xs text-neutral-400 hidden sm:block">
                  Automatic Dry Fuel IoT Trigger & Petrol Pump Dispatch Station
                </p>
              </div>
            </div>

            {/* Emergency Pill Mobile */}
            {isEmergency && (
              <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/80 text-rose-300 border border-rose-700 rounded-full text-xs font-semibold animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>DRY TANK</span>
              </div>
            )}
          </div>

          {/* Perspective View Selector */}
          <div className="flex items-center bg-neutral-900 p-1 rounded-xl border border-neutral-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              id="nav-view-split"
              onClick={() => setActiveView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeView === 'split'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>

            <button
              id="nav-view-rider"
              onClick={() => setActiveView('rider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeView === 'rider'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Rider Dashboard</span>
            </button>

            <button
              id="nav-view-station"
              onClick={() => setActiveView('station')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeView === 'station'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Petrol Pump Terminal</span>
              {activeAlert && activeAlert.status === 'alert_sent' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              id="nav-view-map"
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeView === 'map'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>GPS Radar</span>
            </button>
          </div>

          {/* Actions & Simulation Trigger */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Audio Toggle */}
            <button
              id="nav-mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Quick Dry Trigger Button */}
            {!isEmergency ? (
              <button
                id="quick-dry-trigger-btn"
                onClick={onTriggerDryAlert}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition-transform active:scale-95 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Simulate Dry Fuel</span>
              </button>
            ) : (
              <button
                id="reset-simulation-btn"
                onClick={onResetSystem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
                title="Reset fuel tank and resolve rescue"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refuel & Reset</span>
              </button>
            )}

            {/* Settings/Profile Trigger */}
            <button
              id="bike-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Bike & Location Settings"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
