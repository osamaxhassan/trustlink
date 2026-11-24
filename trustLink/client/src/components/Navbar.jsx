import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wrench, Power, Clock, User, Menu, X, LogOut, Shield } from 'lucide-react';
import ProfileModal from './ProfileModal';
import HistoryModal from './HistoryModal';
import SafetyModal from './SafetyModal';
import api from '../services/api';

export default function Navbar({ onOpenAuth, activeAddress }) {
  const { user, logout, setUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVerified = Boolean(user?.technician?.is_verified);

  const handleToggleOnline = async () => {
    if (!user || user.role !== 'TECHNICIAN') return;
    if (!isVerified) {
      return alert('You cannot go online until your CNIC is verified by the admin.');
    }
    const nextStatus = !user.technician?.is_online;
    try {
      await api.post('/auth/toggle-online', { isOnline: nextStatus });
      setUser(prev => ({
        ...prev,
        technician: { ...prev.technician, is_online: nextStatus }
      }));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between z-30 font-sans relative">
      
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-trustGreen flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <span className="font-black text-xl tracking-tight text-trustDark block leading-none">TrustLink</span>
          <span className="text-[10px] text-trustMuted uppercase tracking-wider font-bold block mt-0.5">
            Home Services Platform
          </span>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-2.5">
        {user ? (
          <>
            {/* Safety SOS Button ONLY for Customer */}
            {user.role === 'CUSTOMER' && (
              <button
                onClick={() => setShowSafety(true)}
                className="h-9 px-3.5 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition flex items-center space-x-1.5 shadow-sm"
                title="Safety Center"
              >
                <Shield className="w-4 h-4 fill-red-600" />
                <span>SAFETY</span>
              </button>
            )}

            {/* Technician Availability Toggle */}
            {user.role === 'TECHNICIAN' && (
              <button
                onClick={handleToggleOnline}
                className={`h-9 px-3.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 border ${
                  !isVerified
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : user.technician?.is_online 
                    ? 'bg-emerald-50 text-trustGreen border-emerald-200' 
                    : 'bg-red-50 text-red-500 border-red-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{!isVerified ? 'UNVERIFIED' : user.technician?.is_online ? 'ONLINE' : 'OFFLINE'}</span>
              </button>
            )}

            {/* 30-Day History Button */}
            {user.role !== 'ADMIN' && (
              <button
                onClick={() => setShowHistory(true)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold text-trustDark hover:bg-gray-100 border border-gray-200 transition flex items-center space-x-1.5"
                title="Job History"
              >
                <Clock className="w-4 h-4 text-trustMuted" />
                <span>History</span>
              </button>
            )}

            {/* User Profile Button with Face Avatar */}
            <button
              onClick={() => setShowProfile(true)}
              className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition flex items-center space-x-2 bg-trustNeutral"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Face" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-gray-500" />
                )}
              </div>
              <div className="text-left">
                <span className="text-xs font-extrabold text-trustDark block leading-none">
                  {user.firstName}
                </span>
                <span className="text-[9px] font-bold text-trustMuted uppercase block">
                  {user.role}
                </span>
              </div>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="h-9 px-3 rounded-xl text-xs font-bold text-trustMuted hover:text-red-500 hover:bg-red-50 transition flex items-center"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={onOpenAuth}
            className="h-9 bg-trustDark hover:bg-black text-white px-5 rounded-xl text-xs font-black shadow transition"
          >
            Sign In / Register
          </button>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      <div className="flex md:hidden items-center space-x-2">
        {user && user.role === 'CUSTOMER' && (
          <button
            onClick={() => setShowSafety(true)}
            className="h-8 px-2.5 rounded-lg text-[11px] font-black bg-red-50 text-red-600 border border-red-200 flex items-center space-x-1"
          >
            <Shield className="w-3.5 h-3.5 fill-red-600" />
            <span>SOS</span>
          </button>
        )}

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-trustDark hover:bg-gray-100 rounded-xl transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-xl p-4 md:hidden flex flex-col space-y-3 z-40">
          {user ? (
            <>
              <div 
                onClick={() => { setShowProfile(true); setMobileMenuOpen(false); }}
                className="flex items-center space-x-3 p-3 bg-trustNeutral rounded-2xl border cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Face" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-trustDark">{user.firstName} {user.lastName}</h4>
                  <span className="text-[10px] font-bold text-trustMuted uppercase">{user.role} • View Profile</span>
                </div>
              </div>

              {user.role === 'TECHNICIAN' && (
                <button
                  onClick={handleToggleOnline}
                  className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center space-x-2 border ${
                    !isVerified
                      ? 'bg-gray-100 text-gray-400 border-gray-200'
                      : user.technician?.is_online 
                      ? 'bg-emerald-50 text-trustGreen border-emerald-200' 
                      : 'bg-red-50 text-red-500 border-red-200'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{!isVerified ? 'VERIFICATION REQUIRED' : user.technician?.is_online ? 'STATUS: ONLINE' : 'STATUS: OFFLINE'}</span>
                </button>
              )}

              {user.role !== 'ADMIN' && (
                <button
                  onClick={() => { setShowHistory(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-trustDark flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4 text-trustMuted" />
                  <span>Past 30 Days Job History</span>
                </button>
              )}

              {user.role === 'CUSTOMER' && (
                <button
                  onClick={() => { setShowSafety(true); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4 fill-red-600" />
                  <span>Safety Center & Emergency 15</span>
                </button>
              )}

              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="w-full bg-trustDark text-white py-3 rounded-xl text-xs font-black shadow"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showSafety && <SafetyModal onClose={() => setShowSafety(false)} activeAddress={activeAddress} />}
    </header>
  );
}
