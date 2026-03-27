import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResourceById } from '../../api/resourceApi';
import { Resource } from '../../types/resource';
import { MapPin, Users, Clock, ArrowLeft, Image as ImageIcon, CheckCircle2, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBooking } from '../../api/bookingApi';

export const ResourceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getResourceById(id)
        .then(setResource)
        .catch(() => {
           toast.error('Could not fetch details. Using mock data for demo.', { id: 'fetch-err' });
           // Mock Data
           setResource({
             id: parseInt(id), name: 'Main Auditorium', type: 'Hall', capacity: 500, location: 'Block A, Floor 1', 
             status: 'ACTIVE', availabilityTime: 'Everyday 08:00 - 20:00',
             imageUrl: 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
           });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="p-12 text-center text-slate-500 font-semibold animate-pulse">Loading detailed view...</div>;
  if (!resource) return <div className="p-12 text-center text-red-500 font-bold">Resource not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in-up">
       <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-6">
         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Catalogue
       </button>

       <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          {/* Header Banner Image */}
          <div className="h-64 sm:h-80 md:h-96 w-full bg-slate-100 relative group border-b border-slate-100">
             {resource.imageUrl ? (
               <img src={`http://localhost:8080${resource.imageUrl}`} alt={resource.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon size={64} className="mb-4 opacity-50" />
                  <span className="font-medium tracking-wide">No Media Available</span>
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10"></div>
             
             <div className="absolute bottom-6 left-8 z-20">
                <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3 inline-block shadow-sm">
                  {resource.type}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">{resource.name}</h1>
             </div>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 space-y-8">
               <section>
                 <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Description & Notes</h3>
                 <p className="text-slate-600 leading-relaxed text-lg">
                   {resource.description || `The ${resource.name} is a state-of-the-art facility located seamlessly within the ${resource.location}. Designed to support the academic and extracurricular needs of the Smart Campus structure, it ensures high reliability and comfort for up to ${resource.capacity} occupants.`}
                 </p>
               </section>
             </div>

             <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-10">
               <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Specifications</h4>
                  
                  <div className="flex items-center gap-4 text-slate-700 mb-5 pb-5 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5 tracking-wide">LOCATION</p>
                      <p className="font-bold">{resource.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-700 mb-5 pb-5 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5 tracking-wide">MAX CAPACITY</p>
                      <p className="font-bold">{resource.capacity} Persons</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-700 mb-5 pb-5 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-0.5 tracking-wide">AVAILABILITY</p>
                      <p className="font-bold">{resource.availabilityTime || 'Not specified'}</p>
                    </div>
                  </div>
               </div>

               <div className="pt-2">
                 <p className="text-xs text-slate-500 font-semibold mb-2 tracking-wide uppercase">Operational Status</p>
                 <div className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border shadow-sm ${
                    resource.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    resource.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {resource.status === 'ACTIVE' && <CheckCircle2 size={18} />} 
                    <span className="tracking-wide">SYSTEM {resource.status.replace(/_/g, ' ')}</span>
                 </div>
                 
                 {resource.status === 'ACTIVE' && (
                    <button onClick={() => setShowModal(true)} className="mt-6 w-full py-4 rounded-xl bg-blue-600 text-white font-bold tracking-wide hover:bg-blue-700 transition-colors shadow-md flex justify-center items-center gap-2">
                       <Calendar size={20} /> BOOK THIS RESOURCE
                    </button>
                 )}
               </div>
             </div>
          </div>
       </div>

        {/* Booking Modal */}
        {showModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                 <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">Book {resource.name}</h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                       <X size={24} />
                    </button>
                 </div>
                 
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    setBookingLoading(true);
                    try {
                       // We assume userId is 1 for currently logged in demo user
                       await createBooking({ ...bookingData, resourceId: resource.id, userId: 1 });
                       toast.success('Booking requested successfully!');
                       setShowModal(false);
                       setBookingData({ bookingDate: '', startTime: '', endTime: '', purpose: ''});
                    } catch (err: any) {
                       toast.error(err.response?.data?.error || 'Failed to request booking');
                    } finally {
                       setBookingLoading(false);
                    }
                 }} className="p-6 space-y-4">
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                       <input type="date" required value={bookingData.bookingDate} onChange={e => setBookingData({...bookingData, bookingDate: e.target.value})} 
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                         <input type="time" required value={bookingData.startTime} onChange={e => setBookingData({...bookingData, startTime: e.target.value})} 
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                       </div>
                       <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                         <input type="time" required value={bookingData.endTime} onChange={e => setBookingData({...bookingData, endTime: e.target.value})} 
                           className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Purpose</label>
                       <textarea required rows={3} value={bookingData.purpose} onChange={e => setBookingData({...bookingData, purpose: e.target.value})} 
                         className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Briefly describe the purpose of booking..."></textarea>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                       <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
                       <button type="submit" disabled={bookingLoading} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-70 transition-colors">
                          {bookingLoading ? 'Submitting...' : 'Submit Request'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}
    </div>
  );
};
