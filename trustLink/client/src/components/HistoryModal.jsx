import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Clock, Star, Receipt, User } from 'lucide-react';

export default function HistoryModal({ onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get('/contracts/history');
        if (isMounted) setHistory(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-trustMuted text-xl font-bold">&times;</button>

        <div className="flex items-center space-x-2 mb-1">
          <Clock className="w-5 h-5 text-trustGreen" />
          <h3 className="text-lg font-black text-trustDark">Last 30 Days Job History</h3>
        </div>
        <p className="text-[11px] text-trustMuted mb-4">
          Privacy Protected: Phone numbers and physical addresses are omitted from past records.
        </p>

        {loading ? (
          <p className="text-xs text-trustMuted py-10 text-center">Loading completed jobs...</p>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-trustMuted">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-bold">No completed jobs in the past 30 days.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y pr-1">
            {history.map((item) => (
              <div key={item.contractId} className="py-3.5 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center flex-shrink-0">
                    {item.otherPartyAvatar ? (
                      <img src={item.otherPartyAvatar} alt="Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-trustGreen bg-emerald-50 px-2 py-0.5 rounded">
                      {item.categoryName}
                    </span>
                    <h4 className="text-xs font-black text-trustDark mt-1">{item.title}</h4>
                    <p className="text-[11px] text-trustMuted">Participant: {item.otherPartyName}</p>
                    {item.rating && (
                      <div className="flex items-center space-x-1 text-[11px] text-amber-500 font-bold mt-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{item.rating} Stars</span>
                        {item.reviewText && <span className="text-trustMuted font-normal italic">• "{item.reviewText}"</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-trustGreen block">
                    Rs. {Number(item.totalAmount).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-trustMuted block mt-0.5">
                    {new Date(item.completedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
