import React, { useState } from 'react';
import { createResource, uploadResourceImage } from '../../api/resourceApi';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const AddResource: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Hall', capacity: 0, location: '', status: 'ACTIVE' as 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE', availabilityTime: '08:00 - 20:00', imageUrl: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || formData.capacity < 1) {
      return toast.error('Please fill out all required fields correctly.');
    }

    setLoading(true);
    try {
      let imageUrl = formData.imageUrl;
      if (selectedFile) {
        toast.success(`Uploading image...`);
        imageUrl = await uploadResourceImage(selectedFile);
      }
      
      const payload = { ...formData, imageUrl };
      await createResource(payload);

      toast.success('Resource registered successfully!');
      navigate('/resources');
    } catch (err) {
      toast.error('Failed to register resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Add New Resource</h2>
        <p className="text-slate-500 mt-1">Register a new facility or asset into the campus portfolio.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column - Details */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Resource Name <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="e.g. Main Auditorium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Hall">Hall</option>
                  <option value="Lab">Lab</option>
                  <option value="Library">Library</option>
                  <option value="Sports">Sports Facility</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Capacity <span className="text-red-500">*</span></label>
                <input type="number" required min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Location / Building <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Science Block, Room 101" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Availability Time</label>
                <select value={formData.availabilityTime} onChange={e => setFormData({...formData, availabilityTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="08:00 - 18:00">08:00 - 18:00 (Standard)</option>
                  <option value="08:00 - 20:00">08:00 - 20:00 (Extended)</option>
                  <option value="00:00 - 23:59">00:00 - 23:59 (24 Hours)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'OUT_OF_SERVICE' | 'MAINTENANCE'})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="ACTIVE">Active (Ready)</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column - Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Resource Image (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 transition-colors bg-slate-50 relative group h-64">
              {imagePreview ? (
                 <div className="absolute inset-0 p-2">
                   <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-sm" />
                   <button type="button" onClick={() => setImagePreview(null)} className="absolute top-4 right-4 bg-slate-900/60 p-1.5 rounded-full text-white hover:bg-slate-900 transition backdrop-blur-sm">
                     <X size={16} />
                   </button>
                 </div>
              ) : (
                <div className="space-y-1 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 mb-3 shadow-sm border border-slate-100">
                    <Upload size={24} />
                  </div>
                  <div className="flex flex-col text-sm text-slate-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-bold text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </label>
                    <p className="mt-1 text-xs text-slate-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/resources')} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2 text-sm font-semibold shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 transition-colors">
            <Save size={18} /> {loading ? 'Saving...' : 'Save Resource'}
          </button>
        </div>
      </form>
    </div>
  );
};
