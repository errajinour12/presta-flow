import React, { useState, useEffect } from 'react';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import rapportService from '../../services/rapportService';

const Rapports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Set default dates to current month (1st of month to today/end of month)
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    setStartDate(`${year}-${month}-01`);
    setEndDate(`${year}-${month}-${day}`);
  }, []);

  // Update object URL when pdfBlob changes
  useEffect(() => {
    if (!pdfBlob) {
      setPdfUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlob]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPdfBlob(null);

    if (!startDate || !endDate) {
      setErrorMessage('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }

    if (startDate > endDate) {
      setErrorMessage('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }

    setLoading(true);

    try {
      const blob = await rapportService.generateReport({ startDate, endDate });
      setPdfBlob(blob);
    } catch (error) {
      let msg = 'Une erreur est survenue lors de la génération du rapport.';
      if (error.response && error.response.data) {
        try {
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const parsed = JSON.parse(text);
            if (parsed && parsed.message) {
              msg = parsed.message;
            }
          } else if (error.response.data.message) {
            msg = error.response.data.message;
          }
        } catch (e) {
          // Keep fallback msg
        }
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Rapport_Pointage_${startDate}_${endDate}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PrestataireDashboardLayout
      title="Rapports de Pointage"
      subtitle="Générez et téléchargez votre rapport officiel d'assiduité et de pointage au format PDF."
    >
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">

        {/* Period Selection Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <form onSubmit={handleGenerateReport} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all"
                  required
                />
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 text-sm">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center px-6 py-3.5 bg-[#3b62ad] text-white text-sm font-semibold rounded-2xl hover:bg-[#325394] focus:outline-none focus:ring-4 focus:ring-[#3b62ad]/20 transition-all disabled:opacity-60 shadow-md shadow-[#3b62ad]/10"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Générer le rapport
                  </>
                )}
              </button>

              {pdfUrl && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center px-6 py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-2xl hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 transition-all shadow-md shadow-emerald-600/10"
                >
                  <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger le PDF
                </button>
              )}
            </div>
          </form>
        </div>

        {/* PDF Preview Section */}
        {pdfUrl && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-slate-800">Aperçu du Rapport</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                Généré avec succès
              </span>
            </div>

            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              <iframe
                src={pdfUrl}
                className="w-full h-[700px] border-none"
                title="Prévisualisation du Rapport PDF"
              />
            </div>
          </div>
        )}
      </div>
    </PrestataireDashboardLayout>
  );
};

export default Rapports;
