import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CatalogueCours from './pages/CatalogueCours';
import MonPlanning from './pages/MonPlanning';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Tu peux ajouter une Navbar globale ici plus tard */}
        <Routes>
          {/* Par défaut, on arrive sur le Login */}
          <Route path="/" element={<Login />} />
          
          {/* Les routes pour tes coéquipiers */}
          <Route path="/catalogue" element={<CatalogueCours />} />
          <Route path="/planning" element={<MonPlanning />} />
          
          {/* Redirection si l'URL n'existe pas */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}