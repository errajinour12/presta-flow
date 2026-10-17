import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';

/**
 * ImageViewerModal
 *
 * Reusable image preview modal built on top of Modal.jsx.
 *
 * Props:
 *   isOpen      {boolean}             – Controls modal visibility
 *   onClose     {function}            – Callback when modal is closed
 *   loadImage   {() => Promise<Blob>} – Async function that fetches the image blob
 *   title       {string}              – Optional modal header title
 */
const ImageViewerModal = ({ isOpen, onClose, loadImage, title = "Image originale" }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Load image when modal opens; handle race conditions if modal closes mid-request
  useEffect(() => {
    if (!isOpen || !loadImage) return;

    let aborted = false;
    let createdUrl = null;

    setLoading(true);
    setError(null);
    setZoom(1);
    setImageUrl(null);

    loadImage()
      .then((blob) => {
        if (aborted) return; // Modal was closed before request completed — do nothing
        createdUrl = URL.createObjectURL(blob);
        setImageUrl(createdUrl);
      })
      .catch((err) => {
        if (aborted) return;
        console.error("Erreur lors du chargement de l'image originale :", err);
        setError("Impossible de charger l'image originale. Veuillez réessayer.");
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    // Cleanup: mark as aborted and revoke any Object URL that was created
    return () => {
      aborted = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
        createdUrl = null;
      }
      setImageUrl(null);
      setLoading(false);
      setError(null);
    };
  }, [isOpen, loadImage]);

  // Zoom controls
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/* Zoom toolbar */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5 || loading || !!error}
          title="Dézoomer"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
        >
          −
        </button>

        <button
          onClick={handleZoomReset}
          disabled={loading || !!error}
          title="Réinitialiser le zoom"
          className="px-4 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold min-w-[60px]"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3 || loading || !!error}
          title="Zoomer"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-lg"
        >
          +
        </button>
      </div>

      {/* Image area */}
      <div
        className="overflow-auto rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center"
        style={{ minHeight: '300px', maxHeight: '60vh' }}
      >
        {loading && (
          <div className="flex flex-col items-center space-y-3 py-12 text-slate-400">
            <svg className="animate-spin w-8 h-8 text-[#3b62ad]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Chargement de l'image originale…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center space-y-3 py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                let createdUrl = null;
                loadImage()
                  .then((blob) => {
                    createdUrl = URL.createObjectURL(blob);
                    setImageUrl(createdUrl);
                  })
                  .catch(() => {
                    setError("Impossible de charger l'image originale. Veuillez réessayer.");
                  })
                  .finally(() => setLoading(false));
              }}
              className="px-4 py-2 bg-[#3b62ad] text-white text-xs font-semibold rounded-xl hover:bg-[#2d4d8c] transition-colors shadow-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {imageUrl && !loading && !error && (
          <div
            className="flex items-center justify-center p-4 transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
          >
            <img
              src={imageUrl}
              alt="Image originale de pointage"
              className="max-w-full object-contain rounded shadow-sm"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Info notice
      <p className="mt-3 text-center text-xs text-slate-400 font-medium">
        Aperçu uniquement — aucun téléchargement disponible
      </p> */}
    </Modal>
  );
};

export default ImageViewerModal;
