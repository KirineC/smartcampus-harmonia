import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CatalogueCours from './pages/CatalogueCours';
import MonPlanning from './pages/MonPlanning';
import Dashboard from './pages/Dashboard';
import MesNotes from './pages/MesNotes';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherInscriptions from './pages/TeacherInscriptions';
import TeacherNotes from './pages/TeacherNotes';
import AdminSecretariat from './pages/AdminSecretariat';

export default function App() {
  return (
    <Router>
      <div className="app-container" style={{ backgroundColor: '#fcfbfa', minHeight: '100vh' }}>
        <Navbar />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mes-notes" element={<MesNotes />} />

          <Route path="/enseignant/dashboard" element={<TeacherDashboard />} />
          <Route path="/enseignant/inscriptions" element={<TeacherInscriptions />} />
          <Route path="/enseignant/notes" element={<TeacherNotes />} />

          <Route path="/admin/secretariat" element={<AdminSecretariat />} />

          <Route path="/catalogue" element={<CatalogueCours />} />
          <Route path="/planning" element={<MonPlanning />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}