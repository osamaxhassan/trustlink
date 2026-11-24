import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import MapView from './components/MapView';
import OfferCard from './components/OfferCard';
import StageTracker from './components/StageTracker';
import AdminDashboard from './components/dashboards/AdminDashboard';
import TechnicianDashboard from './components/dashboards/TechnicianDashboard';
import { socket } from './services/socket';
import api from './services/api';
import { Plus, Radio, MapPin, Camera, X, Image as ImageIcon, Clock, ChevronDown, ChevronUp, ZoomIn, Crosshair, Compass } from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [location, setLocation] = useState({ lat: 25.0298, lng: 67.0682 });
  const [addressText, setAddressText] = useState('Surjani Town, Karachi');
  const [entranceNote, setEntranceNote] = useState('');

  const [technicianLocation, setTechnicianLocation] = useState(null);
  const [technicianName, setTechnicianName] = useState('Technician');

  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [activeContract, setActiveContract] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Found another technician outside app');
  const [showDetails, setShowDetails] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(1800);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(1);
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);

  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
          const data = await res.json();
          if (data && data.display_name) {
            setAddressText(data.display_name.split(',').slice(0, 3).join(','));
          }
        } catch {
          // Fallback gracefully
        }

        setLocatingGPS(false);
        alert(`🎯 Doorstep GPS Locked!\nLat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`);
      },
      () => {
        setLocatingGPS(false);
        alert('Could not retrieve GPS location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchCustomerActiveJob = useCallback(async () => {
    if (!user || user.role !== 'CUSTOMER') return;
    try {
      const res = await api.get('/jobs/customer-active');
      if (res.data.data) {
        const { job: activeJob, bids: activeBids, contract } = res.data.data;
        setJob(activeJob);
        setAddressText(activeJob.address_text);
        setSecondsRemaining(activeJob.remainingSeconds || 1800);

        if (contract) {
          setActiveContract({
            contractId: contract.contract_id,
            visitFee: contract.stage1_visit_fee,
            status: contract.contract_status,
            finalLaborFee: contract.stage2_final_labor,
            stage2VerificationPin: contract.stage2VerificationPin
          });
          setBids([]);
          setTechnicianLocation({ lat: 25.0150, lng: 67.0600 });
          setTechnicianName(contract.technicianName || 'Muhammad Bilal');
        } else {
          setBids(activeBids || []);
          setTechnicianLocation(null);
        }
        socket.emit('join_job_channel', activeJob.job_id);
      } else {
        setJob(null);
        setBids([]);
        setActiveContract(null);
        setTechnicianLocation(null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomerActiveJob();

    socket.on('bid:received', (newBid) => {
      setBids(prev => {
        const filtered = prev.filter(b => b.technicianId !== newBid.technicianId);
        return [{ ...newBid, offerRemainingSeconds: 300 }, ...filtered];
      });
    });

    socket.on('technician:moved', (coords) => {
      setTechnicianLocation(coords);
    });

    return () => {
      socket.off('bid:received');
      socket.off('technician:moved');
    };
  }, [fetchCustomerActiveJob]);

  useEffect(() => {
    if (!job || activeContract) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setJob(null);
          setBids([]);
          alert('30-minute search window expired. Request closed.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [job, activeContract]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!user) return setShowAuthModal(true);

    if (selectedImages.length === 0) {
      return alert('Please attach at least 1 photo of the issue.');
    }

    setSubmitting(true);
    try {
      const fullAddress = entranceNote ? `${addressText} (${entranceNote})` : addressText;

      const formData = new FormData();
      formData.append('customerId', user.userId);
      formData.append('categoryId', Number(category));
      formData.append('title', title);
      formData.append('description', description);
      formData.append('lng', location.lng);
      formData.append('lat', location.lat);
      formData.append('addressText', fullAddress);

      selectedImages.forEach(file => formData.append('images', file));

      await api.post('/jobs/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsPosting(false);
      setSelectedImages([]);
      setImagePreviews([]);
      fetchCustomerActiveJob();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bid) => {
    try {
      const res = await api.post('/contracts/lock-stage1', {
        jobId: job.job_id || job.id,
        bidId: bid.bidId
      });

      setBids([]);
      setActiveContract({
        contractId: res.data.data.contractId,
        visitFee: bid.visitFee,
        stage2VerificationPin: res.data.data.stage2VerificationPin,
        status: 'STAGE_1_EN_ROUTE'
      });

      setTechnicianLocation({ lat: 25.0150, lng: 67.0600 });
      setTechnicianName(bid.name || 'Technician');
    } catch (err) {
      alert('Failed to lock Stage 1: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmCancel = async () => {
    try {
      await api.post('/jobs/cancel', {
        jobId: job.job_id || job.id,
        cancelReason
      });
      setShowCancelModal(false);
      setJob(null);
      setBids([]);
      setActiveContract(null);
      setTechnicianLocation(null);
      alert('Service request cancelled.');
    } catch (err) {
      alert('Cancel failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExpandRadius = async () => {
    if (!job) return;
    try {
      const nextRadius = Math.min(50, (job.search_radius_km || 5.0) + 5.0);
      await api.patch(`/jobs/${job.job_id || job.id}/expand-radius`, { radiusKm: nextRadius });
      setJob(prev => ({ ...prev, search_radius_km: nextRadius }));
      alert(`📡 Search radius expanded to ${nextRadius} km!`);
    } catch {
      setJob(prev => ({ ...prev, search_radius_km: (prev.search_radius_km || 5) + 5 }));
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPercent = ((1800 - secondsRemaining) / 1800) * 100;

  return (
    <div className="h-screen w-screen flex flex-col bg-trustNeutral overflow-hidden font-sans">
      <Navbar onOpenAuth={() => setShowAuthModal(true)} activeAddress={addressText} />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-trustDark mb-1">Why do you want to cancel?</h3>
            <div className="space-y-2 mb-4 text-xs font-medium">
              {[
                'Found another technician outside app',
                'Problem resolved on my own',
                'Technician offers too high',
                'Posted by mistake / No longer needed'
              ].map(reason => (
                <label key={reason} className="flex items-center space-x-2 p-2.5 rounded-xl border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={e => setCancelReason(e.target.value)}
                    className="accent-trustGreen"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-2">
              <button onClick={() => setShowCancelModal(false)} className="w-1/2 py-2 text-xs font-bold bg-gray-100 rounded-xl">Keep</button>
              <button onClick={handleConfirmCancel} className="w-1/2 py-2 text-xs font-bold text-white bg-red-600 rounded-xl">Cancel Request</button>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'ADMIN' ? (
        <div className="flex-1 overflow-y-auto"><AdminDashboard /></div>
      ) : user?.role === 'TECHNICIAN' ? (
        <div className="flex-1 overflow-y-auto"><TechnicianDashboard /></div>
      ) : (
        <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">
          
          <div className="w-full md:w-[420px] lg:w-[460px] h-[55vh] md:h-full bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col z-20 shadow-xl overflow-y-auto p-4">
            
            {activeContract && (
              <StageTracker 
                contract={activeContract} 
                onJobSettled={() => { setJob(null); setBids([]); setActiveContract(null); setTechnicianLocation(null); }}
              />
            )}

            {!job && !isPosting && (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-emerald-50 text-trustGreen rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-trustDark text-lg">In-Home Service Booking</h3>
                <p className="text-xs text-trustMuted mt-1 max-w-[280px] mx-auto">
                  Lock your GPS location or drag the pin. Nearby verified technicians will bid with diagnostic visit fees.
                </p>
                <button
                  onClick={() => setIsPosting(true)}
                  className="mt-5 bg-trustGreen hover:bg-trustGreen-hover text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md inline-flex items-center space-x-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Request Technician Quotes</span>
                </button>
              </div>
            )}

            {isPosting && (
              <form onSubmit={handlePostJob} className="bg-trustNeutral p-4 rounded-xl border mb-4 space-y-3">
                <h3 className="font-black text-trustDark text-sm">Service Details</h3>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] text-trustMuted font-bold">Service Location</label>
                    <button
                      type="button"
                      onClick={handleUseCurrentGPS}
                      disabled={locatingGPS}
                      className="text-[11px] font-bold text-trustGreen hover:underline flex items-center space-x-1"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${locatingGPS ? 'animate-spin' : ''}`} />
                      <span>{locatingGPS ? 'Locating...' : 'Use My GPS'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-trustGreen absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Surjani Town, Sector 4B, Karachi"
                      value={addressText}
                      onChange={e => setAddressText(e.target.value)}
                      className="w-full text-xs border bg-white rounded-xl pl-8 p-2.5 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-trustMuted font-bold block mb-1">Entrance / Gate (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. House L-12, Near Bilal Masjid"
                    value={entranceNote}
                    onChange={e => setEntranceNote(e.target.value)}
                    className="w-full text-xs border bg-white rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-trustMuted font-bold block mb-1">Trade Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full text-xs border bg-white rounded-xl p-2.5 outline-none"
                  >
                    <option value={1}>AC Repair & Maintenance</option>
                    <option value={2}>Plumbing & Pipefitting</option>
                    <option value={3}>Electrician & Wiring</option>
                    <option value={4}>Carpentry & Woodwork</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-trustMuted font-bold block mb-1">Issue Headline</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. AC water leakage"
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-xs border bg-white rounded-xl p-2.5 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-trustMuted font-bold block mb-1">Problem Description</label>
                  <textarea 
                    required 
                    rows="2" 
                    placeholder="Explain symptoms, noise, water leaks..."
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    className="w-full text-xs border bg-white rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-trustDark flex items-center space-x-1">
                      <Camera className="w-3.5 h-3.5 text-trustGreen" />
                      <span>Issue Photos (Limit: 1-4)</span>
                    </label>
                    <span className="text-[10px] font-mono font-bold text-trustMuted">{selectedImages.length}/4</span>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img src={src} alt="Issue" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImages(prev => prev.filter((_, idx) => idx !== i));
                              setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedImages.length < 4 && (
                    <label className="border-2 border-dashed border-gray-300 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
                      <ImageIcon className="w-4 h-4 text-trustMuted mb-0.5" />
                      <span className="text-[10px] text-trustMuted font-medium">Click to attach photos</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={(e) => {
                          const files = Array.from(e.target.files).slice(0, 4 - selectedImages.length);
                          setSelectedImages(prev => [...prev, ...files]);
                          setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>

                <div className="flex space-x-2 pt-1">
                  <button type="button" onClick={() => setIsPosting(false)} className="w-1/2 py-2 text-xs font-bold text-trustMuted bg-gray-200 rounded-xl">Cancel</button>
                  <button type="submit" disabled={submitting} className="w-1/2 py-2 text-xs font-bold text-white bg-trustGreen rounded-xl shadow">{submitting ? 'Broadcasting...' : 'Broadcast Job'}</button>
                </div>
              </form>
            )}

            {job && !activeContract && (
              <div className="mb-4">
                <div className="bg-trustYellow p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-amber-700 animate-pulse" />
                      <span className="text-xs font-bold text-amber-900">Broadcasting: {job.search_radius_km || '5.0'} km Radius</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-900 bg-white/80 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                    </div>
                  </div>

                  <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden mb-2.5">
                    <div className="bg-amber-600 h-full transition-all duration-1000" style={{ width: `${100 - progressPercent}%` }} />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-bold text-amber-950">{bids.length} offer(s) received</span>
                    
                    <button
                      onClick={handleExpandRadius}
                      className="text-amber-900 bg-white border border-amber-300 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-amber-50 flex items-center space-x-1"
                    >
                      <ZoomIn className="w-3 h-3" />
                      <span>Widen (+5 km)</span>
                    </button>

                    <button onClick={() => setShowCancelModal(true)} className="text-red-700 hover:text-red-800 font-bold underline text-[11px]">Cancel</button>
                  </div>
                </div>

                <div className="mt-2 bg-white border rounded-xl p-3">
                  <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between text-xs font-bold text-trustDark">
                    <span>View Ticket Details: {job.title}</span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showDetails && (
                    <div className="mt-2.5 pt-2.5 border-t text-xs text-trustMuted space-y-1.5">
                      <p><strong className="text-trustDark">Description:</strong> {job.description}</p>
                      <p><strong className="text-trustDark">Location:</strong> {job.address_text}</p>
                      <p><strong className="text-trustDark">Coordinates:</strong> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</p>
                      {job.mediaUrls && job.mediaUrls.length > 0 && (
                        <div className="flex space-x-2 pt-1">
                          {job.mediaUrls.map((url, i) => (
                            <img key={i} src={url} alt="Problem" className="w-12 h-12 object-cover rounded border" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!activeContract && bids.map((bid, index) => (
              <OfferCard key={index} bid={bid} onAccept={handleAcceptBid} />
            ))}

          </div>

          <div className="flex-1 h-[45vh] md:h-full relative">
            <MapView 
              userLocation={location} 
              technicianLocation={technicianLocation}
              customerName={user?.firstName || 'Customer'}
              technicianName={technicianName}
              isDraggable={!activeContract}
              showCustomerPin={Boolean(user && user.role === 'CUSTOMER')}
              onSelectLocation={(coords) => setLocation(coords)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
