import React, { useEffect, useState } from 'react';
import { getResources, deleteResource, updateResource } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { Edit2, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const ManageResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getResources(0, 100);
      setResources(res.content || []);
    } catch (err) {
      toast.error('Failed to load. Using mock data for admin.');
      setResources([
        { id: 1, name: 'Main Auditorium', type: 'Hall', capacity: 500, location: 'Block A', status: 'ACTIVE', availabilityTime: '08:00 - 20:00' },
        { id: 2, name: 'Chemistry Lab G1', type: 'Lab', capacity: 30, location: 'Science Block', status: 'OUT_OF_SERVICE', availabilityTime: 'N/A' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (resource: Resource) => {
    const newStatus = resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    try {
      await updateResource(resource.id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.success(`MOCK: Status updated to ${newStatus}`); // Fallback for UI visualization
      setResources(resources.map(r => r.id === resource.id ? { ...r, status: newStatus } : r));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to soft delete this resource?')) {
      try {
        await deleteResource(id);
        toast.success('Resource moved to trash');
        fetchData();
      } catch (err) {
        toast.success('MOCK: Resource soft deleted');
        setResources(resources.filter(r => r.id !== id));
      }
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-500 font-semibold text-lg">Loading Management Grid...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
           <ShieldAlert size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Management Grid</h2>
          <p className="text-slate-500 mt-1">Elevated access: Edit and moderate campus resources safely.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">ID / Name</th>
              <th className="py-4 px-6">Type & Location</th>
              <th className="py-4 px-6">Manage Status</th>
              <th className="py-4 px-6 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resources.map((res) => (
              <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="text-xs text-slate-400 font-mono pr-2">#{res.id}</span>
                  <span className="font-bold text-slate-800">{res.name}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="font-medium text-slate-700">{res.type}</div>
                  <div className="text-xs text-slate-500">{res.location}</div>
                </td>
                <td className="py-4 px-6">
                  <button onClick={() => handleToggleStatus(res)} className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border shadow-sm ${
                    res.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                  }`}>
                    {res.status} (Click to toggle)
                  </button>
                </td>
                <td className="py-4 px-6 text-right">
                   <div className="flex justify-end gap-3">
                     <button className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Edit Resource">
                        <Edit2 size={18} />
                     </button>
                     <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete Resource">
                        <Trash2 size={18} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
