import React from 'react';
import Modal from '../ui/Modal';

/**
 * Helper to calculate slot duration in minutes and format as "Xh Ym"
 */
const formatSlotDuration = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return '-';
  const parseTime = (tStr) => {
    const parts = tStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };
  try {
    const startMin = parseTime(checkInTime);
    const endMin = parseTime(checkOutTime);
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60; // overnight
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  } catch (e) {
    return '-';
  }
};

const AttendanceDetailModal = ({ isOpen, onClose, record, totalDuration }) => {
  if (!record) return null;

  const slots = record.timeSlots || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Détails du pointage - ${record.date}`}
    >
      <div className="space-y-6">
        {/* Record Overview Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Jour & Type
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-700">
                {record.dayName ? `${record.dayName} ${record.date}` : record.date}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#3b62ad] border border-blue-100">
                {record.dayType || 'PRESENCE'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-right">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Créneaux
              </span>
              <span className="text-base font-extrabold text-slate-800">
                {slots.length}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Durée Totale
              </span>
              <span className="text-base font-extrabold text-[#3b62ad]">
                {totalDuration}
              </span>
            </div>
          </div>
        </div>

        {/* Time Slots Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
            Créneaux horaires extraits
          </h3>
          {slots.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-slate-500">Aucun créneau horaire extrait pour cette journée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Heure d'entrée</th>
                    <th className="py-3 px-4">Heure de sortie</th>
                    <th className="py-3 px-4">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {slots.map((slot, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {slot.checkInTime || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {slot.checkOutTime || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-[#3b62ad] font-bold">
                        {formatSlotDuration(slot.checkInTime, slot.checkOutTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <svg className="w-4 h-4 mr-1.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>La modification des créneaux sera activée en Phase B.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              disabled
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed flex items-center shadow-none opacity-80"
              title="Disponible en Phase B"
            >
              <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
              <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">Phase B</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#3b62ad] text-white hover:bg-[#3b62ad]/90 transition-colors shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AttendanceDetailModal;
