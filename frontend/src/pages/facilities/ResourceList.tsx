import React, { useEffect, useState } from 'react';
import { getResources } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { Search, Filter, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await getResources(0, 50);
      setResources(res.content || []);
    } catch (err) {
      toast.error('Failed to load resources. Showing local mock data.');
      // Stub data to ensure UI displays when backend is empty/failing
      setResources([
        { id: 1, name: 'Main Auditorium', type: 'Hall', capacity: 500, location: 'Block A', status: 'ACTIVE', availabilityTime: '08:00 - 20:00' },
        { id: 2, name: 'Chemistry Lab G1', type: 'Lab', capacity: 30, location: 'Science Block', status: 'OUT_OF_SERVICE', availabilityTime: 'N/A' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = resources.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Resource Catalogue</h2>
          <p className="text-slate-500 mt-1">Browse and filter campus facilities and assets.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Search name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500" 
             />
          </div>
          <button className="flex items-center justify-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-center">Capacity</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(resource => (
                  <tr key={resource.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100/50 overflow-hidden">
                           {resource.imageUrl ? (
                             <img src={`http://localhost:8080${resource.imageUrl}`} alt={resource.name} className="w-full h-full object-cover" />
                           ) : (
                             <Box size={20} />
                           )}
                        </div>
                        <span className="font-bold text-slate-800">{resource.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">{resource.type}</td>
                    <td className="py-4 px-6 text-center text-slate-600">{resource.capacity}</td>
                    <td className="py-4 px-6 text-slate-500">{resource.location}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full border ${
                        resource.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : resource.status === 'MAINTENANCE'
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link to={`/resources/${resource.id}`} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors text-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                   <tr>
                     <td colSpan={6} className="py-12 text-center text-slate-500">No resources found matching criteria.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
             <span>Showing {filtered.length} results</span>
             <div className="flex gap-2">
               <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white transition-colors" disabled>Previous</button>
               <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white transition-colors" disabled>Next</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
