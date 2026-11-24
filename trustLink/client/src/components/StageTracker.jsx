import React, { useState } from 'react';
import { CheckCircle2, Receipt, Star, ThumbsUp, Wrench } from 'lucide-react';
import api from '../services/api';

export default function StageTracker({ contract, onJobSettled }) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [settling, setSettling] = useState(false);

  const visitFee = Number(contract.visitFee || contract.stage1_visit_fee || 500);
  const laborFee = Number(contract.finalLaborFee || contract.stage2_final_labor || 0);
  const totalPayable = visitFee + laborFee;
  const pin = contract.stage2VerificationPin || contract.stage2_pin || '1234';

  const handleCompleteAndPay = async (e) => {
    e.preventDefault();
    setSettling(true);
    try {
      await api.post('/contracts/complete', {
        contractId: contract.contractId || contract.contract_id,
        rating,
        reviewText
      });
      alert('🎉 Payment confirmed & Review submitted! Thank you for using TrustLink.');
      setShowRatingModal(false);
      if (onJobSettled) onJobSettled();
    } catch (err) {
      alert('Settlement failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-md mb-4 font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-xs font-bold text-trustGreen bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Stage 1 Locked
          </span>
          <h3 className="font-extrabold text-trustDark text-lg mt-1.5">Technician Dispatched</h3>
          <p className="text-xs text-trustMuted">Diagnostic Fee of Rs. {visitFee} is guaranteed.</p>
        </div>
      </div>

      {contract.status !== 'STAGE_2_IN_PROGRESS' && contract.status !== 'SETTLED' ? (
        <div className="mt-4 space-y-3">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center">
            <span className="text-xs font-extrabold text-amber-900 uppercase tracking-widest block mb-1">
              Your Stage 2 Verification PIN
            </span>
            <div className="inline-block bg-white px-6 py-2 rounded-xl shadow-sm border border-amber-200 my-1">
              <span className="text-3xl font-mono font-black text-trustDark tracking-[0.3em]">
                {pin}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 mt-2 font-medium">
              Tell or show this PIN to the technician <strong>only after</strong> you agree on the final on-site repair price.
            </p>
          </div>

          <div className="p-3 bg-trustNeutral rounded-xl flex items-center space-x-2 text-xs text-trustMuted border">
            <Wrench className="w-4 h-4 text-trustGreen flex-shrink-0" />
            <span>Technician is inspecting hardware. Once they enter this PIN, work will officially lock.</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-emerald-50 rounded-xl flex items-center space-x-2 text-trustGreen text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Stage 2 Approved: Final Labor locked at Rs. {laborFee}. Repair in progress.</span>
          </div>

          <div className="bg-trustNeutral p-3.5 rounded-xl border space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-trustDark pb-1 border-b">
              <Receipt className="w-4 h-4 text-trustGreen" />
              <span>Payment Summary (Cash on Delivery)</span>
            </div>
            <div className="flex justify-between text-trustMuted">
              <span>Diagnostic / Visit Fee:</span>
              <span>Rs. {visitFee}</span>
            </div>
            <div className="flex justify-between text-trustMuted">
              <span>Approved Labor Fee:</span>
              <span>Rs. {laborFee}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-trustDark pt-1.5 border-t">
              <span>Total Payable Amount:</span>
              <span className="text-trustGreen text-base">Rs. {totalPayable}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRatingModal(true)}
            className="w-full bg-trustGreen hover:bg-trustGreen-hover text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>COMPLETE JOB & SETTLE PAYMENT</span>
          </button>
        </div>
      )}

      {showRatingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <h3 className="text-lg font-black text-trustDark">Work Completed!</h3>
            <p className="text-xs text-trustMuted mt-1">
              Please pay <strong className="text-trustGreen text-sm">Rs. {totalPayable}</strong> cash to the technician and leave your rating.
            </p>

            <div className="flex justify-center space-x-2 my-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows="3"
              placeholder="Leave feedback on technician's work, punctuality, and cleanliness..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className="w-full text-xs border rounded-xl p-3 mb-4 outline-none focus:ring-1 focus:ring-trustGreen"
            />

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-trustMuted bg-gray-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteAndPay}
                disabled={settling}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-trustGreen hover:bg-trustGreen-hover rounded-xl shadow"
              >
                {settling ? 'Submitting...' : 'Confirm & Finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
