import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import Login from '../pages/auth/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminPrestataires from '../pages/admin/Prestataires';
import AdminTaches from '../pages/admin/Taches';
import AdminAffectations from '../pages/admin/Affectations';
import AdminPointages from '../pages/admin/Pointages';
import AdminPointageHistory from '../pages/admin/PointageHistory';
import AdminPointageDetails from '../pages/admin/PointageDetails';
import AdminRapports from '../pages/admin/Rapports';
import PrestataireDashboard from '../pages/prestataire/Dashboard';
import PrestataireMesTaches from '../pages/prestataire/MesTaches';
import PrestataireImportPointage from '../pages/prestataire/ImportPointage';
import PrestatairePointages from '../pages/prestataire/Pointages';
import PrestatairePointageDetails from '../pages/prestataire/PointageDetails';
import PrestataireRapports from '../pages/prestataire/Rapports';
import PrestataireMesRapports from '../pages/prestataire/MesRapports';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        {/* Admin only routes */}
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/prestataires" element={<AdminPrestataires />} />
          <Route path="/admin/taches" element={<AdminTaches />} />
          <Route path="/admin/affectations" element={<AdminAffectations />} />
          <Route path="/admin/pointages" element={<AdminPointages />} />
          <Route path="/admin/pointages/historique" element={<AdminPointageHistory />} />
          <Route path="/admin/pointages/:imageId" element={<AdminPointageDetails />} />
          <Route path="/admin/rapports" element={<AdminRapports />} />
        </Route>

        {/* Prestataire only routes */}
        <Route element={<RoleRoute allowedRoles={['PRESTATAIRE']} />}>
          <Route path="/prestataire/dashboard" element={<PrestataireDashboard />} />
          <Route path="/prestataire/mes-taches" element={<PrestataireMesTaches />} />
          <Route path="/prestataire/import-pointage" element={<PrestataireImportPointage />} />
          <Route path="/prestataire/pointages" element={<PrestatairePointages />} />
          <Route path="/prestataire/pointages/:imageId" element={<PrestatairePointageDetails />} />
          <Route path="/prestataire/rapports" element={<PrestataireRapports />} />
          <Route path="/prestataire/mes-rapports" element={<PrestataireMesRapports />} />
        </Route>
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
