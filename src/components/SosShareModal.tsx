import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Phone, MessageSquare, ShieldAlert } from 'lucide-react';
import { BikeTelemetry, FuelAlert } from '../types';
import { generateSosShareText, getGoogleMapsUrl } from '../utils/geo';

interface SosShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: BikeTelemetry;
  activeAlert: FuelAlert | null;
}

export const SosShareModal: React.FC<SosShareModalProps> = ({
  isOpen,
  onClose,
  bike,
  activeAlert,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const sosText = generateSosShareText(
    bike.ownerName,
    bike.model,
    bike.licensePlate,
    bike.location,
    `${bike.fuelType} (Out of Fuel)`
  );

  const gmapsUrl = getGoogleMapsUrl(bike.location.latitude, bike.location.longitude);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(sosText)}`;
  const smsUrl = `sms:?body=${encodeURIComponent(sosText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sosText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Share Emergency GPS Distress
              </h3>
              <p className="text-xs text-neutral-400">
                Dispatch your exact coordinates to roadside assistance or contacts
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 whitespace-pre-line leading-relaxed select-all">
            {sosText}
          </div>

          {/* Quick Sharing Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </a>

            <a
              href={smsUrl}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Send Quick SMS</span>
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Distress Payload'}</span>
            </button>

            <a
              href={gmapsUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium transition-colors flex items-center justify-center"
              title="Open Google Maps in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
