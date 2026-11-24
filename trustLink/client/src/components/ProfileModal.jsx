import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Camera, MapPin, User, Check } from 'lucide-react';

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();
  const [address, setAddress] = useState(user?.default_address || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let geocodedLng = null;
      let geocodedLat = null;

      if (address) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            geocodedLat = parseFloat(geoData[0].lat);
            geocodedLng = parseFloat(geoData[0].lon);
          }
        } catch (err) {
          console.error(err);
        }
      }

      const formData = new FormData();
      if (address) formData.append('defaultAddress', address);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (geocodedLng && geocodedLat) {
        formData.append('lng', geocodedLng);
        formData.append('lat', geocodedLat);
      }

      const res = await api.patch('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updated = { ...user, avatar_url: res.data.data.avatar_url, default_address: res.data.data.default_address };
      setUser(updated);
      localStorage.setItem('trustlink_user', JSON.stringify(updated));

      alert('Profile updated successfully!');
      onClose();
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-trustMuted text-xl font-bold">&times;</button>
        <h3 className="text-lg font-black text-trustDark mb-4">My Account Profile</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-trustGreen bg-gray-100 flex items-center justify-center shadow-inner">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Portrait" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer text-white">
                <Camera className="w-6 h-6" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <span className="text-[11px] text-trustMuted mt-1.5 font-bold">Upload Face / Shoulder Photo</span>
          </div>

          <div>
            <label className="text-xs font-bold text-trustDark block mb-1">Full Name</label>
            <input 
              type="text" 
              disabled 
              value={`${user.firstName} ${user.lastName}`} 
              className="w-full text-xs bg-gray-100 border rounded-xl p-2.5 text-trustMuted font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-trustDark block mb-1">City / Base Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-trustGreen absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="e.g. Surjani Town, Karachi or Gulberg, Lahore"
                value={address} 
                onChange={e => setAddress(e.target.value)}
                className="w-full text-xs border rounded-xl pl-9 p-2.5 outline-none focus:ring-1 focus:ring-trustGreen"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-trustGreen hover:bg-trustGreen-hover text-white font-bold py-2.5 rounded-xl text-xs shadow transition-all flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
