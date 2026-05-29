import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/index.php', {
        action: 'login',
        email: email,
        password: password
      });

      if (response.data.success) {
        navigate('/catalogue');
      } else {
        setError(response.data.error || "Identifiants académiques invalides.");
      }
    } catch (err) {
      console.error(err);
      setError("Le secrétariat numérique est indisponible actuellement.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        {/* En-tête */}
        <div style={{ marginBottom: '30px' }}>
          <h1 className="login-title">H A R M O N I A</h1>
          <p className="login-subtitle">Conservatoire National Supérieur de Musique</p>
        </div>

        {/* Message d'erreur */}
        {error && <div className="login-error">{error}</div>}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="login-label">Adresse de l'établissement</label>
            <input 
              type="email" 
              placeholder="etudiant@harmonia.edu"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="login-input"
            />
          </div>

          <div className="form-group-last">
            <label className="login-label">Clé d'accès sécurisée</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button">
            Ouvrir la session
          </button>
        </form>

        <div className="login-footer">
          <span>ESPACE ÉTUDIANT SÉCURISÉ</span>
        </div>

      </div>
    </div>
  );
}