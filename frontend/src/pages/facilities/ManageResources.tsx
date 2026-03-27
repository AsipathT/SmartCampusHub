import React, { useEffect, useState } from 'react';
import { getResources, deleteResource, updateResource } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { Edit2, Trash2, ShieldAlert, Search, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const ManageResources: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Debounced fetch
  useEffect(() => {
    const handler = setTimeout(() => {
       fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [page, search, type]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getResources(page, size, search, type);
      setResources(res.content || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load resources');
      setResources([]);
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
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to soft delete this resource?')) {
      try {
        await deleteResource(id);
        toast.success('Resource moved to trash');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete resource');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
             <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Management Grid</h2>
            <p className="text-slate-500 mt-1">Elevated access: Edit and moderate campus resources safely.</p>
          </div>
        </div>
        <button onClick={() => navigate('/app/facilities/resources/add')} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={18} /> Add Resource
        </button>
      </div>

      <div className="bg-white p-5 rounded-t-2xl border-x border-t border-slate-200 flex flex-col sm:flex-row gap-4">
         <div className="relative flex-1">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input type="text" placeholder="Search by name or location..." value={search} onChange={(e) => {setSearch(e.target.value); setPage(0);}} 
                 className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" />
         </div>
         <div className="relative w-full sm:w-48">
             <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <select value={type} onChange={(e) => {setType(e.target.value); setPage(0);}} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none bg-white">
                <option value="">All Types</option>
                <option value="Hall">Lecture Halls</option>
                <option value="Lab">Laboratories</option>
                <option value="Library">Libraries</option>
                <option value="Sports">Sports Arenas</option>
             </select>
         </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">ID / Name</th>
              <th className="py-4 px-6">Type & Location</th>
              <th className="py-4 px-6">Manage Status</th>
              <th className="py-4 px-6 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 relative">
            {loading && (
               <tr><td colSpan={4} className="h-48 text-center text-slate-500"><div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div><br/>Loading...</td></tr>
            )}
            {!loading && resources.length === 0 && (
               <tr><td colSpan={4} className="py-12 text-center text-slate-500 font-medium tracking-wide">No resources found matching your criteria.</td></tr>
            )}
            {!loading && resources.map((res) => (
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
                     <button onClick={() => navigate(`/app/facilities/resources/manage/edit/${res.id}`)} className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors" title="Edit Resource">
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

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm text-slate-600">
            <div>
               Showing page <span className="font-bold">{page + 1}</span> of <span className="font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(page - 1)} className="p-1.5 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 disabled:opacity-50 transition">
                    <ChevronLeft size={18} />
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="p-1.5 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 disabled:opacity-50 transition">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
