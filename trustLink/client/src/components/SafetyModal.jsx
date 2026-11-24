import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, PhoneCall, UserPlus, Users, Trash2, ArrowLeft, ChevronRight, CheckCircle, Navigation, Lock, AlertTriangle } from 'lucide-react';

export default function SafetyModal({ onClose, activeAddress }) {
  const [view, setView] = useState('MAIN');
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/safety/contacts');
        if (active) setContacts(res.data.data || []);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await api.post('/safety/contacts', { name, phone });
      setName('');
      setPhone('');
      setAdding(false);
      const res = await api.get('/safety/contacts');
      setContacts(res.data.data || []);
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.delete(`/safety/contacts/${id}`);
      const res = await api.get('/safety/contacts');
      setContacts(res.data.data || []);
    } catch (err) {
      alert('Failed to remove: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center space-x-2">
            {view !== 'MAIN' && (
              <button onClick={() => setView('MAIN')} className="p-1 text-trustMuted hover:text-trustDark mr-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-trustDark leading-tight">TrustLink Safety Center</h3>
              <p className="text-[10px] text-trustMuted">Protection & In-Home Protocols</p>
            </div>
          </div>
          <button onClick={onClose} className="text-trustMuted text-2xl font-bold hover:text-black">&times;</button>
        </div>

        {view === 'MAIN' && (
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setView('EMERGENCY_15')}
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 p-4 rounded-2xl flex flex-col items-center justify-center transition shadow-sm"
              >
                <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center mb-1.5 shadow">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="font-black text-sm text-red-700">Emergency 15</span>
                <span className="text-[10px] text-red-500 font-semibold">Police Helpline</span>
              </button>

              <button
                onClick={() => setView('CONTACTS')}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-trustDark p-4 rounded-2xl flex flex-col items-center justify-center transition"
              >
                <div className="w-10 h-10 bg-trustDark text-white rounded-full flex items-center justify-center mb-1.5 shadow">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-black text-sm">Trusted Contacts</span>
                <span className="text-[10px] text-trustMuted font-semibold">{contacts.length} added (Max: 4)</span>
              </button>
            </div>

            <div className="bg-trustNeutral p-3.5 rounded-2xl border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-trustDark">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-trustGreen" />
                  <span>CNIC-Verified Technicians</span>
                </span>
                <span className="text-[10px] text-trustGreen font-extrabold uppercase">Enforced</span>
              </div>
              <p className="text-[11px] text-trustMuted">
                All service providers undergo physical NADRA CNIC document and face verification before entering customer homes.
              </p>
            </div>

            <button
              onClick={() => setView('GUIDELINES')}
              className="w-full flex items-center justify-between p-3.5 border rounded-2xl hover:bg-gray-50 transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-trustGreen flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-trustDark">In-Home Safety Guidelines</h4>
                  <p className="text-[10px] text-trustMuted">How to safely book and oversee repairs at home</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-trustMuted" />
            </button>
          </div>
        )}

        {view === 'EMERGENCY_15' && (
          <div className="space-y-4 flex-1">
            <div className="text-center py-2">
              <span className="text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full">
                Pakistan Police Helpline
              </span>
              <h4 className="text-2xl font-black text-trustDark mt-3">15: Police Emergency</h4>
              <p className="text-xs text-trustMuted mt-1 max-w-xs mx-auto">
                Be ready to tell the emergency dispatcher your current location and what happened.
              </p>
            </div>

            <div className="bg-gray-50 border p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs text-trustDark">
              <Navigation className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-trustMuted uppercase font-bold block">Your Active Job Location</span>
                <span className="font-bold">{activeAddress || 'Surjani Town, Karachi, Pakistan'}</span>
              </div>
            </div>

            <div className="pt-3">
              <a
                href="tel:15"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg transition"
              >
                <PhoneCall className="w-5 h-5" />
                <span>CALL 15 POLICE HELPLINE</span>
              </a>
            </div>
          </div>
        )}

        {view === 'CONTACTS' && (
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-trustDark">Trusted Family Contacts</h4>
                <p className="text-[10px] text-trustMuted">Contacts who can assist you in case of in-home emergency</p>
              </div>
              {!adding && contacts.length < 4 && (
                <button
                  onClick={() => setAdding(true)}
                  className="text-xs font-bold text-trustGreen hover:underline flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {adding && (
              <form onSubmit={handleAddContact} className="bg-trustNeutral p-3.5 rounded-2xl border space-y-2.5">
                <input
                  type="text"
                  required
                  placeholder="Contact Name (e.g. Asif Bhai)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-white outline-none font-bold"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number (e.g. +923001234567)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs border rounded-xl p-2.5 bg-white outline-none font-mono"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="w-1/2 py-2 text-xs font-bold text-trustMuted bg-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 text-xs font-bold text-white bg-trustGreen rounded-xl shadow"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y max-h-56 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-xs text-trustMuted text-center py-6">No emergency contacts saved yet.</p>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-trustDark">{c.name}</h5>
                      <a href={`tel:${c.phone}`} className="text-xs font-mono text-trustGreen flex items-center space-x-1">
                        <PhoneCall className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </a>
                    </div>
                    <button onClick={() => handleDeleteContact(c.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'GUIDELINES' && (
          <div className="space-y-3 flex-1 text-xs">
            <h4 className="font-extrabold text-sm text-trustDark mb-2">How to Oversee Home Repairs Safely:</h4>
            
            <div className="p-3 bg-gray-50 rounded-2xl border space-y-1">
              <span className="font-bold text-trustDark flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-trustGreen" />
                <span>1. Verify Face & CNIC Badge</span>
              </span>
              <p className="text-trustMuted text-[11px] pl-5">
                Ensure the technician's face matches the portrait photo on the TrustLink offer card before opening the door.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border space-y-1">
              <span className="font-bold text-trustDark flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-trustGreen" />
                <span>2. Keep Stage-2 PIN Private</span>
              </span>
              <p className="text-trustMuted text-[11px] pl-5">
                Never share the 4-digit PIN upfront. Only reveal it once you both agree on the final repair labor.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border space-y-1">
              <span className="font-bold text-trustDark flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-trustGreen" />
                <span>3. Ensure a Family Member is Present</span>
              </span>
              <p className="text-trustMuted text-[11px] pl-5">
                Avoid having a stranger inside your house alone. Have another family member accompany you in the room.
              </p>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border space-y-1">
              <span className="font-bold text-trustDark flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>4. Report Offline Cash Deals</span>
              </span>
              <p className="text-trustMuted text-[11px] pl-5">
                If a technician asks you to cancel the app ticket to do work outside the system, decline immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
