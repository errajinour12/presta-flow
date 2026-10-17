import React from 'react';
import { CATEGORY_LABELS } from '../../utils/constants';

/**
 * TaskTable – Affiche la liste des tâches dans un tableau.
 * Props:
 *  - tasks: array of task objects (id, nom, description, categorie, actif)
 *  - onEdit: function(task) called when the Edit button is clicked
 *  - onToggleStatut: function(id) called to toggle the actif flag of a task
 */
const TaskTable = ({ tasks, onEdit, onToggleStatut }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="table-header-row">
            <th className="px-6 py-4">Nom</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4">Catégorie</th>
            <th className="px-6 py-4">Créée par</th>
            <th className="px-6 py-4 text-center">Statut</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {tasks.map((t) => (
            <tr key={t.id} className="table-data-row">
              <td className="px-6 py-4 font-semibold text-slate-800 text-[14px]">{t.nom}</td>
              <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{t.description}</td>
              <td className="px-6 py-4">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200/50">
                  {CATEGORY_LABELS[t.categorie] || t.categorie || ''}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                {t.createdByRole === 'ADMIN' ? (
                  <span className="font-semibold text-slate-800">Admin</span>
                ) : (
                  <span className="text-slate-700">{t.createdByNomComplet || '—'}</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={t.actif ? 'badge-success' : 'badge-neutral'}>
                  {t.actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                {t.createdByRole === 'PRESTATAIRE' ? (
                  <span className="inline-block px-3 py-1 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-slate-200">
                    Lecture seule
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(t)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#3b62ad] hover:bg-blue-50 transition-colors"
                      title="Modifier"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button
                      onClick={() => onToggleStatut(t.id)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        t.actif
                          ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                          : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                      }`}
                      title={t.actif ? "Désactiver" : "Activer"}
                    >
                      {t.actif ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  );
};


export default TaskTable;
