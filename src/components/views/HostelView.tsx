import React, { useState } from 'react';
import { Building2, Bed, Users, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import { HostelRoom } from '../../types/school.ts';
import { Badge } from '../common/Badge.tsx';

interface HostelViewProps {
  rooms: HostelRoom[];
}

export const HostelView: React.FC<HostelViewProps> = ({ rooms }) => {
  const [selectedBlock, setSelectedBlock] = useState('All');

  const filteredRooms = rooms.filter(
    r => selectedBlock === 'All' || r.block.includes(selectedBlock)
  );

  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupied, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Hostel & Residential Accommodation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Boarding wings, room allocation, bed occupancy, warden oversight, and mess nutrition.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-500">Total Occupancy:</span>
          <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {occupiedBeds} / {totalBeds} Beds ({Math.round((occupiedBeds / totalBeds) * 100)}%)
          </span>
        </div>
      </div>

      {/* Block Filter */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start text-xs font-semibold">
        {['All', 'Sirius', 'Polaris', 'Vega'].map(b => (
          <button
            key={b}
            onClick={() => setSelectedBlock(b)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              selectedBlock === b
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {b === 'All' ? 'All Blocks' : `${b} Wing`}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredRooms.map(room => {
          const isFull = room.occupied === room.capacity;
          return (
            <div
              key={room.id}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-sm text-slate-900 dark:text-white">
                    {room.roomNumber}
                  </span>
                  <Badge variant={isFull ? 'danger' : 'success'}>
                    {isFull ? 'Full' : 'Available'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{room.block}</p>
                <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {room.roomType}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Occupancy:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {room.occupied}/{room.capacity}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Mess Menu Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Nutritional Dining & Mess Menu (Today)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Breakfast (07:00 – 08:15 AM)</span>
            <p className="font-semibold text-slate-900 dark:text-white mt-1">
              Fresh Organic Fruits, Scrambled Eggs / Oatmeal, Whole Grain Toast, Fresh Juice
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Lunch (12:30 – 01:45 PM)</span>
            <p className="font-semibold text-slate-900 dark:text-white mt-1">
              Herb Grilled Chicken / Paneer Tikka, Brown Rice, Steamed Seasonal Veggies, Lentil Soup
            </p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Dinner (07:30 – 09:00 PM)</span>
            <p className="font-semibold text-slate-900 dark:text-white mt-1">
              Mediterranean Pasta / Vegetable Lasagna, Garden Greens Salad, Warm Soup, Fresh Berry Yogurt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
