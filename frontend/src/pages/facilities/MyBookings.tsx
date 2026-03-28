import React, { useEffect, useState } from 'react';
import { getMyBookings, cancelBooking } from '../../api/bookingApi';
import { Booking } from '../../api/bookingApi';
import { Calendar, Clock, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Hardcoded userId 1 for demo purposes
      const data = await getMyBookings(1);
      setBookings(data);
    } catch (err) {
      toast.error('Failed to load your reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking(id);
        toast.success('Booking cancelled successfully.');
        fetchBookings();
      } catch (err) {
        toast.error('Failed to cancel booking.');
      }
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Loading Reservations...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Reservations</h2>
        <p className="text-slate-500 mt-1">Track and manage your campus facility bookings.</p>
      </div>

      {bookings.length === 0 ? (
         <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No active bookings</h3>
            <p className="text-slate-500">You haven't made any resource reservations yet.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                 <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Booking #{booking.id}</div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{booking.resourceName || `Resource ${booking.resourceId}`}</h3>
                 </div>
                 <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    booking.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                 }`}>
                    {booking.status}
                 </div>
              </div>
              
              <div className="p-5 flex-1 space-y-4 text-sm">
                 <div className="flex items-start gap-3 text-slate-600">
                    <Calendar size={18} className="text-blue-500 mt-0.5" shrink-0 />
                    <div>
                      <span className="block font-semibold text-slate-700">Date</span>
                      <span>{booking.bookingDate}</span>
                    </div>
                 </div>
                 <div className="flex items-start gap-3 text-slate-600">
                    <Clock size={18} className="text-indigo-500 mt-0.5" shrink-0 />
                    <div>
                      <span className="block font-semibold text-slate-700">Time</span>
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                 </div>
                 <div className="flex items-start gap-3 text-slate-600">
                    <FileText size={18} className="text-emerald-500 mt-0.5" shrink-0 />
                    <div className="flex-1">
                      <span className="block font-semibold text-slate-700">Purpose</span>
                      <p className="line-clamp-2 italic text-slate-500">{booking.purpose}</p>
                    </div>
                 </div>
              </div>

              {(booking.status === 'PENDING' || booking.status === 'APPROVED') && (
                 <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => booking.id && handleCancel(booking.id)} className="w-full py-2 flex items-center justify-center gap-2 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors">
                       <XCircle size={18} /> Cancel Booking
                    </button>
                 </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
