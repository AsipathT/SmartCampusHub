import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../api/authApi';
import { uploadResourceImage } from '../../api/resourceApi';
import toast from 'react-hot-toast';
import { User, Camera, Save, Loader2, Building2 } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadResourceImage(file);
      setProfileImage(url);
      toast.success('Image uploaded temporarily! Click save to keep your new profile picture.');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await updateProfile(user.id, {
        fullName,
        profileImage
      });
      
      updateUser({
        ...user,
        name: response.fullName,
        profileImage: response.profileImage
      });
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">My Profile</h1>
        <p className="text-slate-500 text-sm mb-8">Manage your personal information and preferences.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-50">
            <div className="relative group">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={fullName} 
                  className="w-32 h-32 rounded-3xl object-cover shadow-lg border border-slate-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner">
                  <User size={48} className="text-indigo-300" />
                </div>
              )}
              
              <div 
                className="absolute inset-0 bg-slate-900/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm transition-colors border border-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Camera size={16} className="text-indigo-500" />}
                    {uploadingImage ? 'Uploading...' : 'Upload New Photo'}
                  </button>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage('')}
                      className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
                <p className="text-[10px] text-slate-400 mt-3 font-medium">Recommended: Square JPG or PNG, max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-2 font-medium text-right">Student emails cannot be changed.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Campus Role
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <Building2 size={18} className="text-indigo-400" />
                <span className="text-sm font-bold text-indigo-700 capitalize">{user?.role?.toLowerCase() || 'Student'}</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end pt-6 border-t border-slate-50">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
