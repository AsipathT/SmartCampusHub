import React, { useEffect, useState } from 'react';
import { getAllBookings, updateBookingStatus } from '../../api/bookingApi';
import { Booking } from '../../api/bookingApi';
import { Calendar, Clock, User, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const ManageBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Booking ${status.toLowerCase()} successfully.`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to update status.`);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-500 font-semibold text-lg">Loading Admin Booking Terminal...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
           <ShieldAlert size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Booking Moderation Grid</h2>
          <p className="text-slate-500 mt-1">Review, approve, and resolve facility reservation requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">ID / User</th>
              <th className="py-4 px-6">Resource & Time</th>
              <th className="py-4 px-6">Purpose</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
               <tr><td colSpan={5} className="py-12 text-center text-slate-500 font-medium tracking-wide">No booking requests found in the system.</td></tr>
            ) : bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="text-xs text-slate-400 font-mono pr-2">#{booking.id}</span>
                  <div className="font-bold text-slate-800 flex items-center gap-2 mt-1">
                     <User size={14} className="text-slate-400" />
                     {booking.userName || `User ${booking.userId}`}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-700">{booking.resourceName || `Resource ${booking.resourceId}`}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                     <Calendar size={12} /> {booking.bookingDate} 
                     <span className="mx-1">•</span>
                     <Clock size={12} /> {booking.startTime} - {booking.endTime}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="text-slate-600 text-xs italic max-w-xs truncate" title={booking.purpose}>{booking.purpose}</div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    booking.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                 }`}>
                    {booking.status}
                 </span>
                </td>
                <td className="py-4 px-6 text-right">
                   {booking.status === 'PENDING' ? (
                     <div className="flex justify-end gap-2">
                       <button onClick={() => booking.id && handleUpdateStatus(booking.id, 'APPROVED')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200" title="Approve">
                          <Check size={18} />
                       </button>
                       <button onClick={() => booking.id && handleUpdateStatus(booking.id, 'REJECTED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Reject">
                          <X size={18} />
                       </button>
                     </div>
                   ) : (
                      <span className="text-xs text-slate-400 font-medium">Processed</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
