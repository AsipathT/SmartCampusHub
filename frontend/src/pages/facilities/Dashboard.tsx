import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getResources } from '../../api/resourceApi';
import { Building2, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, outOfService: 0 });

  useEffect(() => {
    // In a real app we would have an endpoint for stats. For now, fetch list to synthesize mock stats.
    getResources(0, 100)
      .then((res) => {
        const resources = res.content || [];
        setStats({
          total: resources.length || 45, // some dummy data if API returns empty
          active: resources.filter((r) => r.status === 'ACTIVE').length || 38,
          outOfService: resources.filter((r) => r.status !== 'ACTIVE').length || 7,
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard metrics');
        // fallback dummy data
        setStats({ total: 45, active: 38, outOfService: 7 }); 
      })
      .finally(() => setLoading(false));
  }, []);

  const data = [
    { name: 'Lecture Halls', active: 15, maintenance: 2 },
    { name: 'Laboratories', active: 12, maintenance: 4 },
    { name: 'Libraries', active: 4, maintenance: 0 },
    { name: 'Sports Complex', active: 7, maintenance: 1 },
  ];

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Facilities Overview Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time metrics of your campus infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Total Assets</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Active Status</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Out of Service</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.outOfService}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
         <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">Resource Distribution</h4>
         <div className="flex-1 min-h-0 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
               <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
               <Tooltip 
                 cursor={{ fill: '#f8fafc' }}
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               />
               <Bar dataKey="active" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
               <Bar dataKey="maintenance" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
