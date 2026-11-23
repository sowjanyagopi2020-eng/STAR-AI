import React, { useState } from 'react';
import { Bus, MapPin, Phone, Users, ShieldAlert, CheckCircle2, Navigation } from 'lucide-react';
import { BusRoute } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';

interface TransportViewProps {
  buses: BusRoute[];
}

export const TransportView: React.FC<TransportViewProps> = ({ buses }) => {
  const [selectedBus, setSelectedBus] = useState<BusRoute>(buses[0]);
  const [sosSentBusId, setSosSentBusId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Transport & Live GPS Fleet
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time vehicle telemetry, driver allocation, route progression, and student transit security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success">GPS Satellite Sync Active</Badge>
        </div>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buses.map(bus => (
          <div
            key={bus.id}
            onClick={() => setSelectedBus(bus)}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
              selectedBus.id === bus.id
                ? 'bg-blue-50/50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{bus.routeNumber}</h4>
                  <p className="text-[11px] font-mono text-slate-500">{bus.busNumber}</p>
                </div>
              </div>
              <Badge variant={bus.liveStatus === 'On Route' ? 'success' : 'neutral'}>
                {bus.liveStatus}
              </Badge>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Driver:</span>
                <span className="font-medium text-slate-900 dark:text-white">{bus.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span>Occupancy:</span>
                <span className="font-mono text-slate-900 dark:text-white font-medium">
                  {bus.activeStudents} / {bus.capacity} seats ({Math.round((bus.activeStudents / bus.capacity) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Current Location:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{bus.currentStop}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Route Detail & Telemetry Viewport */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Route Tracker: {selectedBus.routeNumber} ({selectedBus.busNumber})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Driver: {selectedBus.driverName} · Emergency Contact: {selectedBus.driverPhone}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-500">Live Speed:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              {selectedBus.speedKmh} KM/H
            </span>
          </div>
        </div>

        {/* Route Stops Sequence */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-slate-400">Waypoint & Stop Schedule</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {selectedBus.stops.map((stop, idx) => {
              const isPast = idx === 0 || idx === 1;
              const isCurrent = stop.name === selectedBus.currentStop;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Stop #{idx + 1}</span>
                    <span className="font-mono text-[10px] text-slate-500">{stop.time}</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{stop.name}</p>
                  <span
                    className={`text-[10px] font-semibold block ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isPast
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? 'Current Location' : isPast ? 'Departed' : 'Upcoming'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Emergency Protocol Notice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            {sosSentBusId === selectedBus.id
              ? `SOS Emergency beacon active for ${selectedBus.busNumber} — Transport Depot notified.`
              : 'Speed Governor Status: Certified Max 50 KM/H'}
          </span>
          <button
            onClick={() => setSosSentBusId(selectedBus.id)}
            className="px-3 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold rounded border border-rose-200 dark:border-rose-900 hover:bg-rose-100 shrink-0"
          >
            {sosSentBusId === selectedBus.id ? 'SOS Beacon Dispatched ✓' : 'Emergency SOS Beacon'}
          </button>
        </div>
      </div>
    </div>
  );
};
