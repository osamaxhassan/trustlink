import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../services/socket';
import api from '../../services/api';
import MapView from '../MapView';
import { Radio, CheckCircle2, Navigation, RefreshCw, MapPin, Phone, Wrench, Hourglass, ShieldAlert, Star } from 'lucide-react';

function TechnicianJobCard({ job, onSendQuote }) {
  const [timeLeft, setTimeLeft] = useState(job.myBidRemainingSeconds ?? 300);

  useEffect(() => {
    if (job.myBidStatus !== 'SUBMITTED') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [job]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = (timeLeft / 300) * 100;
  const isOfferExpired = job.myBidStatus === 'SUBMITTED' && timeLeft <= 0;

  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow transition-all mb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 mr-4">
          <span className="text-xs font-bold text-trustGreen bg-emerald-50 px-2.5 py-0.5 rounded-md">
            ~{job.distanceKm || '1.8'} km away • {job.categoryName || 'Trade'}
          </span>
          <h4 className="font-bold text-trustDark text-base mt-2">{job.title}</h4>
          <p className="text-xs text-trustMuted mt-1">{job.description}</p>

          {job.mediaUrls && job.mediaUrls.length > 0 && (
            <div className="flex items-center space-x-2 mt-3">
              {job.mediaUrls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="Evidence" className="w-14 h-14 object-cover rounded-lg border hover:opacity-90 shadow-sm" />
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 font-mono mt-2 flex items-center">
            <Navigation className="w-3.5 h-3.5 mr-1 text-trustGreen" /> {job.addressText}
          </p>
        </div>

        {job.myBidStatus === 'SUBMITTED' && !isOfferExpired ? (
          <div className="text-right w-48">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 mb-1.5">
              <span className="text-xs font-black text-trustGreen block">
                ✓ Offer Sent (Rs. {job.myVisitFee})
              </span>
              <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold mt-1">
                <span className="flex items-center">
                  <Hourglass className="w-3 h-3 mr-0.5 animate-spin" />
                  <span>Expires in:</span>
                </span>
                <span className="font-mono">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
              </div>
              <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-amber-500 h-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-trustMuted block">Customer deciding...</span>
          </div>
        ) : isOfferExpired ? (
          <div className="text-right">
            <span className="text-xs font-bold text-red-500 block mb-1">Offer Expired</span>
            <button
              onClick={() => onSendQuote(job)}
              className="bg-trustDark hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow"
            >
              Re-quote
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSendQuote(job)}
            className="bg-trustGreen hover:bg-trustGreen-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow"
          >
            Send Quote
          </button>
        )}
      </div>
    </div>
  );
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [incomingJobs, setIncomingJobs] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(Boolean(user?.technician?.is_verified));
  const [liveTrustScore, setLiveTrustScore] = useState(user?.technician?.base_trust_score || '70.00');

  const [myLocation, setMyLocation] = useState({ lat: 25.0150, lng: 67.0600 });
  const [customerLocation, setCustomerLocation] = useState(null);

  const [visitFee, setVisitFee] = useState('500');
  const [laborMin, setLaborMin] = useState('1000');
  const [laborMax, setLaborMax] = useState('2500');
  const [bidding, setBidding] = useState(false);

  const [finalLabor, setFinalLabor] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [approving, setApproving] = useState(false);

  const fetchTechData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsRes, tripRes] = await Promise.all([
        api.get('/jobs/available-for-tech'),
        api.get('/contracts/technician-active')
      ]);
      
      setIncomingJobs(jobsRes.data.data || []);
      const trip = tripRes.data.data || null;
      setActiveTrip(trip);

      if (trip) {
        socket.emit('join_job_channel', trip.jobId);
        setCustomerLocation({ lat: 25.0298, lng: 67.0682 });
      }

      if (jobsRes.data.isVerified !== undefined) {
        setIsVerified(jobsRes.data.isVerified);
      }

      if (jobsRes.data.trustScore !== undefined) {
        setLiveTrustScore(jobsRes.data.trustScore);
      }
    } catch (err) {
      console.error('Failed to load technician state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechData();

    socket.on('job:new_nearby', (newJob) => {
      if (!isVerified) return;
      setIncomingJobs(prev => {
        const exists = prev.some(j => j.jobId === newJob.jobId);
        return exists ? prev : [newJob, ...prev];
      });
    });

    socket.on('job:stage1_locked', (data) => {
      alert(`🎉 Offer Accepted! Customer locked Stage 1 for Rs. ${data.visitFee}.`);
      setActiveTrip({
        contractId: data.contractId,
        jobId: data.jobId,
        visitFee: data.visitFee,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        addressText: data.addressText,
        title: data.title,
        status: 'STAGE_1_EN_ROUTE'
      });
      setCustomerLocation({ lat: 25.0298, lng: 67.0682 });
      setIncomingJobs(prev => prev.filter(j => j.jobId !== data.jobId));
      socket.emit('join_job_channel', data.jobId);
    });

    socket.on('job:settled', (data) => {
      alert(`💰 Payment of Rs. ${data.totalPaid} confirmed! Rating: ${data.rating}★. Updated Trust Score: ${data.updatedTrustScore}`);
      setLiveTrustScore(data.updatedTrustScore);
      setActiveTrip(null);
      setCustomerLocation(null);
      fetchTechData();
    });

    return () => {
      socket.off('job:new_nearby');
      socket.off('job:stage1_locked');
      socket.off('job:settled');
    };
  }, [isVerified, fetchTechData]);

  // Live GPS watching with user.userId dependency satisfied
  useEffect(() => {
    if (!activeTrip || activeTrip.status !== 'STAGE_1_EN_ROUTE' || !user?.userId) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(coords);
          socket.emit('technician:stream_gps', {
            jobId: activeTrip.jobId,
            technicianId: user.userId,
            lat: coords.lat,
            lng: coords.lng
          });
        },
        (err) => console.log('Tech GPS stream error:', err.message),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeTrip, user?.userId]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    setBidding(true);

    try {
      await api.post('/bids/submit', {
        jobId: selectedJob.jobId,
        technicianId: user.userId,
        visitFee: Number(visitFee),
        estimatedLaborMin: Number(laborMin),
        estimatedLaborMax: Number(laborMax)
      });

      setIncomingJobs(prev => prev.map(j => {
        if (j.jobId === selectedJob.jobId) {
          return { 
            ...j, 
            myBidStatus: 'SUBMITTED', 
            myVisitFee: Number(visitFee),
            myBidRemainingSeconds: 300 
          };
        }
        return j;
      }));

      setSelectedJob(null);
    } catch (err) {
      alert('Failed to place bid: ' + (err.response?.data?.message || err.message));
    } finally {
      setBidding(false);
    }
  };

  const handleMarkArrived = async () => {
    try {
      await api.post('/contracts/mark-arrived', { contractId: activeTrip.contractId });
      setActiveTrip(prev => ({ ...prev, status: 'STAGE_1_ARRIVED' }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleStage2Submit = async (e) => {
    e.preventDefault();
    setApproving(true);
    try {
      await api.post('/contracts/approve-stage2', {
        contractId: activeTrip.contractId,
        finalLaborFee: Number(finalLabor),
        enteredPin: customerPin
      });
      alert('✅ Stage 2 Locked! Work is recorded.');
      setActiveTrip(prev => ({ ...prev, status: 'STAGE_2_IN_PROGRESS', finalLaborFee: finalLabor }));
    } catch (err) {
      alert('Verification Failed: ' + (err.response?.data?.message || 'Check PIN.'));
    } finally {
      setApproving(false);
    }
  };

  const filteredAvailableJobs = incomingJobs.filter(
    j => !activeTrip || Number(j.jobId) !== Number(activeTrip.jobId)
  );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto font-sans">
      {!isVerified && (
        <div className="p-4 rounded-2xl border mb-6 flex items-start space-x-3 bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-extrabold">Account Under Review</h4>
            <p className="text-xs mt-0.5">Your CNIC is being verified. You will receive jobs once approved.</p>
          </div>
        </div>
      )}

      <div className="bg-trustDark text-white p-6 rounded-2xl mb-6 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs text-trustGreen font-bold uppercase tracking-wider">Technician Console</span>
          <h2 className="text-2xl font-black mt-1">{user.firstName} {user.lastName}</h2>
          <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
            <span className="flex items-center text-trustGreen font-extrabold">
              <Star className="w-3.5 h-3.5 fill-current mr-1" /> Trust Score: {Number(liveTrustScore).toFixed(2)}
            </span>
            <span>•</span>
            <span>Status: {isVerified ? (user.technician?.is_online ? 'Ready for Jobs' : 'Offline') : 'Not Ready (Unverified)'}</span>
          </div>
        </div>
        <button onClick={fetchTechData} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {activeTrip && (
        <div className="bg-white border-2 border-trustGreen rounded-3xl p-6 shadow-md mb-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold text-trustGreen bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                Active Job Order #{activeTrip.contractId}
              </span>
              <h3 className="font-extrabold text-trustDark text-xl mt-2">{activeTrip.title}</h3>
              <p className="text-xs text-trustMuted">Diagnostic Fee Guaranteed: Rs. {activeTrip.visitFee}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-trustMuted block">Customer</span>
              <span className="text-sm font-bold text-trustDark">{activeTrip.customerName}</span>
              <a href={`tel:${activeTrip.customerPhone}`} className="text-xs text-trustGreen font-bold flex items-center justify-end mt-0.5">
                <Phone className="w-3 h-3 mr-1" /> {activeTrip.customerPhone}
              </a>
            </div>
          </div>

          <div className="my-4 bg-trustNeutral p-3 rounded-xl flex items-center space-x-2 text-xs text-trustDark">
            <MapPin className="w-4 h-4 text-trustGreen flex-shrink-0" />
            <span className="font-bold">{activeTrip.addressText}</span>
          </div>

          {customerLocation && (
            <div className="h-64 w-full rounded-2xl overflow-hidden border mb-4 relative shadow-inner">
              <MapView
                userLocation={customerLocation}
                technicianLocation={myLocation}
                customerName={activeTrip.customerName}
                technicianName={user.firstName}
                isDraggable={false}
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-red-600 shadow border flex items-center space-x-1 z-[1000]">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Streaming Live GPS to Customer</span>
              </div>
            </div>
          )}

          {activeTrip.status === 'STAGE_1_EN_ROUTE' && (
            <button
              onClick={handleMarkArrived}
              className="w-full bg-trustDark hover:bg-black text-white font-bold py-3.5 rounded-xl text-sm shadow transition"
            >
              📍 I Have Arrived at Customer Location
            </button>
          )}

          {activeTrip.status === 'STAGE_1_ARRIVED' && (
            <form onSubmit={handleStage2Submit} className="bg-trustNeutral p-4 rounded-xl border mt-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-trustDark mb-3">
                <Wrench className="w-4 h-4 text-trustGreen" />
                <span>On-Site Stage 2 Price Agreement</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-trustMuted block mb-1">Final Agreed Labor (Rs.)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={finalLabor}
                    onChange={e => setFinalLabor(e.target.value)}
                    className="w-full text-sm border rounded-lg p-2.5 bg-white outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-trustMuted block mb-1">Ask Customer for 4-Digit PIN</label>
                  <input
                    type="text"
                    maxLength="4"
                    required
                    placeholder="PIN from customer screen"
                    value={customerPin}
                    onChange={e => setCustomerPin(e.target.value)}
                    className="w-full text-sm border rounded-lg p-2.5 bg-white outline-none font-mono tracking-widest text-center font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={approving}
                className="w-full bg-trustGreen hover:bg-trustGreen-hover text-white font-bold py-2.5 rounded-xl text-sm shadow"
              >
                {approving ? 'Verifying PIN...' : 'Verify PIN & Lock Stage 2 Work'}
              </button>
            </form>
          )}

          {activeTrip.status === 'STAGE_2_IN_PROGRESS' && (
            <div className="p-3 bg-emerald-50 rounded-xl text-trustGreen text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Stage 2 Approved: Final Labor Rs. {activeTrip.finalLaborFee || finalLabor} locked. Perform repair.</span>
            </div>
          )}
        </div>
      )}

      <h3 className="font-bold text-trustDark text-lg mb-3 flex items-center space-x-2">
        <Radio className="w-5 h-5 text-trustGreen animate-pulse" />
        <span>Available Service Requests ({filteredAvailableJobs.length})</span>
      </h3>

      {filteredAvailableJobs.length === 0 ? (
        <div className="bg-white border rounded-2xl p-8 text-center text-trustMuted">
          <p className="text-sm font-medium">No pending tickets matching your trade right now.</p>
        </div>
      ) : (
        filteredAvailableJobs.map(job => (
          <TechnicianJobCard key={job.jobId} job={job} onSendQuote={(j) => setSelectedJob(j)} />
        ))
      )}

      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h4 className="text-base font-bold text-trustDark mb-1">Submit Reverse Quote</h4>
            <p className="text-xs text-trustMuted mb-4">Set diagnostic visit fee and estimated labor range.</p>

            <form onSubmit={handlePlaceBid}>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div>
                  <label className="text-[10px] text-trustMuted block mb-1">Visit Fee (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={visitFee}
                    onChange={e => setVisitFee(e.target.value)}
                    className="w-full text-xs border rounded-lg p-2 bg-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-trustMuted block mb-1">Est. Labor Min</label>
                  <input
                    type="number"
                    required
                    value={laborMin}
                    onChange={e => setLaborMin(e.target.value)}
                    className="w-full text-xs border rounded-lg p-2 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-trustMuted block mb-1">Est. Labor Max</label>
                  <input
                    type="number"
                    required
                    value={laborMax}
                    onChange={e => setLaborMax(e.target.value)}
                    className="w-full text-xs border rounded-lg p-2 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 text-xs text-trustMuted bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bidding}
                  className="px-5 py-2 text-xs font-bold text-white bg-trustGreen hover:bg-trustGreen-hover rounded-xl shadow"
                >
                  {bidding ? 'Sending...' : 'Transmit Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
