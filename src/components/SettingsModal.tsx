import React, { useState } from 'react';
import { X, Sparkles, MapPin, Bike, Fuel, Save } from 'lucide-react';
import { BikeTelemetry, FuelType } from '../types';
import { LOCATION_PRESETS } from '../utils/geo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: BikeTelemetry;
  onSaveBike: (updated: Partial<BikeTelemetry>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  bike,
  onSaveBike,
}) => {
  if (!isOpen) return null;

  const [ownerName, setOwnerName] = useState(bike.ownerName);
  const [ownerPhone, setOwnerPhone] = useState(bike.ownerPhone);
  const [model, setModel] = useState(bike.model);
  const [licensePlate, setLicensePlate] = useState(bike.licensePlate);
  const [fuelType, setFuelType] = useState<FuelType>(bike.fuelType);
  const [tankCapacity, setTankCapacity] = useState(bike.tankCapacityLiters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBike({
      ownerName,
      ownerPhone,
      model,
      licensePlate,
      fuelType,
      tankCapacityLiters: tankCapacity,
    });
    onClose();
  };

  const handleSelectPreset = (presetIdx: number) => {
    const selected = LOCATION_PRESETS[presetIdx];
    if (selected) {
      onSaveBike({
        location: { ...selected.data },
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Bike IoT & Location Simulator
              </h3>
              <p className="text-xs text-neutral-400">
                Configure rider profile, vehicle specs, and location presets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Quick Location Presets */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Quick Location Simulation Presets:
            </label>
            <div className="space-y-1.5">
              {LOCATION_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className="w-full text-left p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs transition-colors"
                >
                  <span className="font-bold text-neutral-200 block">{preset.name}</span>
                  <span className="text-neutral-500 text-[11px]">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-3 space-y-3">
            <span className="text-xs font-semibold text-neutral-300 block">
              Vehicle & Rider Profile
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Rider Name:</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Bike Model:</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">License Plate:</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Fuel Type:</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as FuelType)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none"
                >
                  <option value="Petrol 95">Petrol 95</option>
                  <option value="Petrol 91">Petrol 91</option>
                  <option value="Premium Unleaded">Premium Unleaded</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Tank Capacity (L):</label>
                <input
                  type="number"
                  min="5"
                  max="35"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg p-2 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
