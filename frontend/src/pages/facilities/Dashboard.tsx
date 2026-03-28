import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getResources } from '../../api/resourceApi';
import { getAllBookings } from '../../api/bookingApi';
import { Building2, AlertTriangle, CheckCircle2, Package, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, maintenance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getResources(0, 500),
      getAllBookings().catch(() => []) 
    ])
    .then(([resourceData, bookingsData]) => {
      const resources = resourceData.content || [];
      
      // Calculate resource stats
      setStats({
        total: resources.length, 
        active: resources.filter((r) => r.status === 'ACTIVE').length,
        maintenance: resources.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_SERVICE').length,
      });

      // Calculate Resource Distribution
      const dist: Record<string, { active: number, maint: number }> = {};
      resources.forEach(r => {
         const type = r.type || 'Other';
         if (!dist[type]) dist[type] = { active: 0, maint: 0 };
         if (r.status === 'ACTIVE') dist[type].active += 1;
         else dist[type].maint += 1;
      });
      const processedDist = Object.entries(dist).map(([k, v]) => ({ name: k, active: v.active, maintenance: v.maint }));
      setDistributionData(processedDist.length > 0 ? processedDist : [
         { name: 'Lecture Halls', active: 0, maintenance: 0 },
         { name: 'Laboratories', active: 0, maintenance: 0 },
         { name: 'Libraries', active: 0, maintenance: 0 },
         { name: 'Sports Complex', active: 0, maintenance: 0 }
      ]);


      // Calculate bookings per day chart data
      const bookingsByDate: Record<string, number> = {};
      bookingsData.forEach(b => {
         const date = b.bookingDate;
         if (date) {
            bookingsByDate[date] = (bookingsByDate[date] || 0) + 1;
         }
      });

      const processedData = Object.entries(bookingsByDate)
         .map(([date, count]) => ({ date, bookings: count }))
         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
         .slice(-7); 

      if (processedData.length === 0) {
         setChartData([{ date: new Date().toISOString().split('T')[0], bookings: 0 }]);
      } else {
         setChartData(processedData);
      }
    })
    .catch((err) => {
      console.error(err);
      toast.error('Failed to load dashboard metrics');
    })
    .finally(() => setLoading(false));
  }, []);

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
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">In Maintenance</p>
            <h3 className="text-3xl font-extrabold text-slate-800">{stats.maintenance}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Chart 1: Distribution */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
            <h4 className="text-sm flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wide mb-6">
               <Building2 size={16} className="text-slate-400" /> Resource Distribution
            </h4>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar name="Active" dataKey="active" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar name="Maintenance" dataKey="maintenance" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2: Bookings per Day */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col">
            <h4 className="text-sm flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wide mb-6">
               <Calendar size={16} className="text-slate-400" /> Bookings per Day (Last 7 Days)
            </h4>
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar name="Number of Bookings" dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};
