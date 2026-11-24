import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { ShieldCheck, Check, X, Phone, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingTechs, setPendingTechs] = useState([]);
  const [rejectedTechs, setRejectedTechs] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const [rejectingTech, setRejectingTech] = useState(null);
  const [selectedReason, setSelectedReason] = useState('Blurry / Unreadable CNIC Image (Dhundli tasveer)');

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, rejectedRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending-technicians'),
        api.get('/admin/rejected-technicians')
      ]);
      setStats(statsRes.data.data);
      setPendingTechs(pendingRes.data.data);
      setRejectedTechs(rejectedRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleVerify = async (techId) => {
    try {
      await api.patch(`/admin/verify-technician/${techId}`);
      alert('Technician CNIC verified! Account is now active.');
      fetchAdminData();
    } catch (err) {
      alert('Verification failed: ' + err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectingTech) return;
    try {
      await api.patch(`/admin/reject-technician/${rejectingTech.user_id}`, {
        reason: selectedReason
      });
      alert(`Candidate rejected. They will auto-purge in 15 days.`);
      setRejectingTech(null);
      fetchAdminData();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-trustMuted">Loading Platform Console...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <h2 className="text-2xl font-black text-trustDark mb-6 flex items-center space-x-2">
        <ShieldCheck className="w-7 h-7 text-purple-600" />
        <span>System Administration & CNIC Verification Console</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-xs text-trustMuted uppercase font-bold">Verified Technicians</span>
          <p className="text-2xl font-black text-trustGreen mt-1">{stats?.verifiedTechnicians || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-xs text-trustMuted uppercase font-bold">Pending Review</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingTechs.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-xs text-trustMuted uppercase font-bold">Flagged / Rejected</span>
          <p className="text-2xl font-black text-red-600 mt-1">{rejectedTechs.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-xs text-trustMuted uppercase font-bold">Total Platform Jobs</span>
          <p className="text-2xl font-black text-trustDark mt-1">{stats?.totalJobs || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center space-x-3 border-b pb-4 mb-5">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`text-sm font-extrabold pb-1.5 transition-all ${
              activeTab === 'PENDING' 
                ? 'text-trustDark border-b-2 border-trustGreen' 
                : 'text-trustMuted hover:text-black'
            }`}
          >
            Pending CNIC Verification ({pendingTechs.length})
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`text-sm font-extrabold pb-1.5 transition-all ${
              activeTab === 'REJECTED' 
                ? 'text-trustDark border-b-2 border-red-500' 
                : 'text-trustMuted hover:text-black'
            }`}
          >
            Flagged & Rejected Candidates ({rejectedTechs.length})
          </button>
        </div>

        {activeTab === 'PENDING' && (
          pendingTechs.length === 0 ? (
            <p className="text-xs text-trustMuted py-8 text-center">
              All applications have been reviewed. No pending CNIC verification requests.
            </p>
          ) : (
            <div className="divide-y">
              {pendingTechs.map(tech => (
                <div key={tech.user_id} className="py-5 flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-trustDark text-base">{tech.first_name} {tech.last_name}</h4>
                    <p className="text-xs text-trustMuted font-mono font-bold">
                      CNIC: {tech.cnic_number} • Trade: {tech.trade || 'General'}
                    </p>
                    <p className="text-xs text-trustMuted flex items-center">
                      <Phone className="w-3 h-3 mr-1" /> {tech.phone_number}
                    </p>

                    <div className="flex items-center space-x-3 pt-2">
                      {tech.cnic_front_url && (
                        <div>
                          <span className="text-[10px] font-bold text-trustMuted block mb-0.5">CNIC Front</span>
                          <a href={tech.cnic_front_url} target="_blank" rel="noopener noreferrer">
                            <img src={tech.cnic_front_url} alt="CNIC Front" className="w-24 h-16 object-cover rounded-lg border hover:opacity-90 transition shadow-sm" />
                          </a>
                        </div>
                      )}
                      {tech.cnic_back_url && (
                        <div>
                          <span className="text-[10px] font-bold text-trustMuted block mb-0.5">CNIC Back</span>
                          <a href={tech.cnic_back_url} target="_blank" rel="noopener noreferrer">
                            <img src={tech.cnic_back_url} alt="CNIC Back" className="w-24 h-16 object-cover rounded-lg border hover:opacity-90 transition shadow-sm" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setRejectingTech(tech)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 border border-red-200 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject / Flag</span>
                    </button>

                    <button
                      onClick={() => handleVerify(tech.user_id)}
                      className="bg-trustGreen hover:bg-trustGreen-hover text-white text-xs font-extrabold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Verify CNIC</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'REJECTED' && (
          rejectedTechs.length === 0 ? (
            <p className="text-xs text-trustMuted py-8 text-center">No rejected candidates on file.</p>
          ) : (
            <div className="divide-y">
              {rejectedTechs.map(tech => (
                <div key={tech.user_id} className="py-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-trustDark text-sm">{tech.first_name} {tech.last_name}</h4>
                    <p className="text-xs text-red-600 font-medium">Reason: {tech.rejection_reason}</p>
                    <p className="text-xs text-trustMuted font-mono">CNIC: {tech.cnic_number} • Phone: {tech.phone_number}</p>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Auto-Purge in {tech.days_remaining} day(s)</span>
                    </span>
                    <span className="block text-[10px] text-trustMuted mt-1">15-day data retention policy</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {rejectingTech && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-black text-trustDark mb-1">Reject Registration</h3>
            <p className="text-xs text-trustMuted mb-4">
              Select rejection reason for <strong>{rejectingTech.first_name} {rejectingTech.last_name}</strong>:
            </p>

            <div className="space-y-2.5 mb-5 text-xs text-trustDark font-semibold">
              {[
                'Blurry / Unreadable CNIC Image (Dhundli tasveer)',
                'Expired CNIC (Tareekh khatam)',
                'Invalid / Fake CNIC Number format',
                'Name or Photo mismatch with NADRA record',
                'Suspicious / Incomplete documentation'
              ].map(reason => (
                <label key={reason} className="flex items-center space-x-2.5 p-3 rounded-xl border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={e => setSelectedReason(e.target.value)}
                    className="accent-red-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setRejectingTech(null)}
                className="w-1/2 py-2.5 text-xs font-bold text-trustMuted bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
