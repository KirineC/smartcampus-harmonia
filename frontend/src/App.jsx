import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CatalogueCours from './pages/CatalogueCours';
import MonPlanning from './pages/MonPlanning';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
// 🎯 Imports de tes nouvelles pages épurées :
import TeacherInscriptions from './pages/TeacherInscriptions';
import TeacherNotes from './pages/TeacherNotes';

export default function App() {
  return (
    <Router>
      <div className="app-container" style={{ backgroundColor: '#fcfbfa', minHeight: '100vh' }}>
        <Navbar /> 
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 👨‍🏫 Le triptyque de routes pour l'Enseignant */}
          <Route path="/enseignant/dashboard" element={<TeacherDashboard />} />
          <Route path="/enseignant/inscriptions" element={<TeacherInscriptions />} />
          <Route path="/enseignant/notes" element={<TeacherNotes />} />
          
          <Route path="/catalogue" element={<CatalogueCours />} />
          <Route path="/planning" element={<MonPlanning />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}