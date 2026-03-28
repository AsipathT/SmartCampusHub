import React from 'react';
import { Facility } from '../../types/facility';
import { StatusBadge } from '../common/StatusBadge';

export const FacilityCard: React.FC<{ facility: Facility, onEdit?: (f: Facility) => void }> = ({ facility, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden group">
      <div className="h-48 bg-slate-100 overflow-hidden relative border-b border-gray-100">
        <img 
          src={facility.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
          alt={facility.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={facility.status} />
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-800 mb-1">{facility.name}</h3>
        <p className="text-sm text-slate-500 mb-4">{facility.location} • max {facility.capacity} pax</p>
        
        <div className="flex justify-between items-center text-sm text-slate-600 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {facility.availableFrom.substring(0,5)} - {facility.availableTo.substring(0,5)}
          </span>
          <span className="font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
            {facility.type.replace('_', ' ')}
          </span>
        </div>
        
        {onEdit && (
          <button 
            onClick={() => onEdit(facility)} 
            className="mt-4 w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 font-medium transition-colors cursor-pointer"
          >
            Manage Facility
          </button>
        )}
      </div>
    </div>
  );
};
