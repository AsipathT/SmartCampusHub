import React, { useEffect, useState } from 'react';
import { Facility } from '../../types/facility';
import { getFacilities } from '../../api/facilityApi';
import { FacilityCard } from './FacilityCard';

const FacilitiesList: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demonstration fetch
    getFacilities(0, 50)
      .then((res) => setFacilities(res.content))
      .catch((err) => console.error("Error fetching", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center p-10 mt-10 text-xl font-semibold text-slate-600 animate-pulse">Loading Facilities Portfolio...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Available Facilities</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          + Add New Facility
        </button>
      </div>

      {facilities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-slate-300">
            <h3 className="text-lg text-slate-700 font-semibold mb-2">No facilities found.</h3>
            <p className="text-slate-500 text-sm">Create the first property to populate the hub inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <FacilityCard key={fac.id} facility={fac} onEdit={(f) => alert(`Edit ${f.name} activated!`)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FacilitiesList;
