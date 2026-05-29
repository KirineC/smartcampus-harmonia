import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar'; // 🎯 On importe notre menu chic
import Login from './pages/Login';
import CatalogueCours from './pages/CatalogueCours';
import MonPlanning from './pages/MonPlanning';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Router>
      <div className="app-container" style={{ backgroundColor: '#fcfbfa', minHeight: '100vh' }}>
        {/* La Navbar s'affichera partout sauf sur le Login */}
        <Navbar /> 
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catalogue" element={<CatalogueCours />} />
          <Route path="/planning" element={<MonPlanning />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}