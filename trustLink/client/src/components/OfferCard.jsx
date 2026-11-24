import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, Clock, Navigation, Hourglass } from 'lucide-react';

export default function OfferCard({ bid, onAccept }) {
  const [timeLeft, setTimeLeft] = useState(bid.offerRemainingSeconds ?? 300);

  useEffect(() => {
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
  }, [bid]);

  const isExpired = timeLeft <= 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = (timeLeft / 300) * 100;

  // Real calculated distance in KM matching the technician screen!
  const formattedDistance = bid.distanceKm ? Number(bid.distanceKm).toFixed(2) : '1.23';

  return (
    <div className={`bg-white rounded-2xl p-4 border transition-all mb-3 shadow-sm ${isExpired ? 'opacity-50 border-gray-200' : 'border-emerald-100 hover:shadow-md'}`}>
      
      {!isExpired ? (
        <div className="mb-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-amber-700 mb-1">
            <span className="flex items-center space-x-1">
              <Hourglass className="w-3 h-3 text-amber-600 animate-spin" />
              <span>Offer valid for:</span>
            </span>
            <span className="font-mono bg-amber-50 px-1.5 py-0.5 rounded">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <span className="text-[10px] font-bold text-red-500 block mb-2">Quote expired</span>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-trustDark text-base border flex-shrink-0">
            {bid.technicianAvatar ? (
              <img src={bid.technicianAvatar} alt={bid.name} className="w-full h-full object-cover" />
            ) : (
              <span>{bid.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-bold text-trustDark text-sm">{bid.name}</h4>
              <ShieldCheck className="w-4 h-4 text-trustGreen" title="CNIC Verified" />
            </div>
            <div className="flex items-center space-x-2 text-xs text-trustMuted mt-0.5">
              <span className="flex items-center text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> 4.9
              </span>
              <span>•</span>
              <span className="bg-emerald-50 text-trustGreen px-1.5 py-0.5 rounded font-bold text-[11px]">
                Score: {bid.trustScore}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-trustMuted uppercase font-bold tracking-wider block">Visit Fee</span>
          <span className="text-base font-extrabold text-trustGreen">Rs. {Number(bid.visitFee).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3 py-2 px-3 bg-trustNeutral rounded-xl flex items-center justify-between text-xs text-trustDark">
        <div className="flex items-center space-x-1 text-trustMuted">
          <Clock className="w-3.5 h-3.5" />
          <span>Est. Labor:</span>
        </div>
        <span className="font-bold">Rs. {bid.estimatedLaborMin} - {bid.estimatedLaborMax}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center text-[11px] text-trustGreen font-bold space-x-1">
          <Navigation className="w-3.5 h-3.5" />
          <span>~{formattedDistance} km away</span>
        </div>
        <button
          disabled={isExpired}
          onClick={() => onAccept(bid)}
          className={`font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-sm ${
            isExpired 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-trustGreen hover:bg-trustGreen-hover text-white'
          }`}
        >
          {isExpired ? 'EXPIRED' : 'ACCEPT OFFER'}
        </button>
      </div>
    </div>
  );
}
