import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Wrench, Phone, Lock, Camera, X } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('CUSTOMER');

  const [phone, setPhone] = useState('+923001111111');
  const [password, setPassword] = useState('Password@123');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cnic, setCnic] = useState('');
  const [category, setCategory] = useState(1);

  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFrontChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicFront(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnicBack(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(phone, password);
        onClose();
      } else {
        const formData = new FormData();
        formData.append('phoneNumber', phone);
        formData.append('password', password);
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('role', role);

        if (role === 'TECHNICIAN') {
          formData.append('cnicNumber', cnic);
          formData.append('categoryId', Number(category));

          if (!cnicFront || !cnicBack) {
            setLoading(false);
            return setError('Please attach photos for both Front and Back of your CNIC.');
          }

          formData.append('cnicFront', cnicFront);
          formData.append('cnicBack', cnicBack);
        }

        await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        await login(phone, password);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 flex justify-center items-center font-sans">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-trustGreen rounded-xl flex items-center justify-center text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-trustDark">TrustLink Access</h2>
          </div>
          <button onClick={onClose} className="text-trustMuted text-2xl font-bold hover:text-black">&times;</button>
        </div>

        {!isLogin && (
          <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`py-2 text-xs font-black rounded-xl transition-all ${role === 'CUSTOMER' ? 'bg-white shadow text-trustDark' : 'text-trustMuted'}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole('TECHNICIAN')}
              className={`py-2 text-xs font-black rounded-xl transition-all ${role === 'TECHNICIAN' ? 'bg-white shadow text-trustDark' : 'text-trustMuted'}`}
            >
              Technician (CNIC)
            </button>
          </div>
        )}

        {isLogin && (
          <div className="mb-4 bg-trustNeutral p-2.5 rounded-xl text-xs flex justify-between items-center border">
            <span className="text-trustMuted font-medium">Quick Fill:</span>
            <div className="space-x-1.5 font-bold">
              <button 
                type="button"
                onClick={() => { setPhone('+923001111111'); setPassword('Password@123'); }}
                className="px-2 py-1 bg-white border rounded-lg text-trustDark"
              >
                Customer
              </button>
              <button 
                type="button"
                onClick={() => { setPhone('+923215555555'); setPassword('Password@123'); }}
                className="px-2 py-1 bg-white border rounded-lg text-trustGreen"
              >
                Tech (Bilal)
              </button>
              <button 
                type="button"
                onClick={() => { setPhone('+923339999999'); setPassword('Password@123'); }}
                className="px-2 py-1 bg-trustDark text-white rounded-lg"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm outline-none"
              />
              <input
                type="text"
                required
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] text-trustMuted font-bold block mb-1">Phone Number (E.164)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-trustMuted absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="+923001234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border rounded-xl pl-9 p-2.5 text-sm outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-trustMuted font-bold block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-trustMuted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border rounded-xl pl-9 p-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {!isLogin && role === 'TECHNICIAN' && (
            <>
              <div>
                <label className="text-[11px] text-trustMuted font-bold block mb-1">CNIC Number</label>
                <input
                  type="text"
                  required
                  placeholder="35201-1234567-1"
                  value={cnic}
                  onChange={e => setCnic(e.target.value)}
                  className="w-full border rounded-xl p-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-trustMuted font-bold block mb-1">Primary Trade Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full border rounded-xl p-2.5 text-sm outline-none bg-white font-medium"
                >
                  <option value={1}>AC Repair & Services</option>
                  <option value={2}>Plumbing & Sanitary</option>
                  <option value={3}>Electrician & Wiring</option>
                  <option value={4}>Carpentry & Woodwork</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="text-[11px] text-trustDark font-bold block mb-1.5">
                  Upload CNIC Photos (Front & Back)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-trustMuted block mb-1 font-semibold">Front Side</span>
                    {frontPreview ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border">
                        <img src={frontPreview} alt="Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setCnicFront(null); setFrontPreview(null); }}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition aspect-video">
                        <Camera className="w-4 h-4 text-trustGreen mb-1" />
                        <span className="text-[10px] font-bold text-trustDark">Front</span>
                        <input type="file" accept="image/*" onChange={handleFrontChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-trustMuted block mb-1 font-semibold">Back Side</span>
                    {backPreview ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border">
                        <img src={backPreview} alt="Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setCnicBack(null); setBackPreview(null); }}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition aspect-video">
                        <Camera className="w-4 h-4 text-trustGreen mb-1" />
                        <span className="text-[10px] font-bold text-trustDark">Back</span>
                        <input type="file" accept="image/*" onChange={handleBackChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-trustGreen hover:bg-trustGreen-hover text-white font-extrabold py-3 rounded-2xl text-sm shadow-md transition-all mt-3"
          >
            {loading ? 'Processing...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="text-center text-xs text-trustMuted mt-4">
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-trustDark font-bold underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
