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
      console.log(api.defaults.baseURL);
      const response = await api.post('/index.php', {
        action: 'login',
        email: email,
        password: password
      });

      // 🟢 CAS 1 : Connexion réussie
      if (response.data && response.data.success) {
        const loggedUser = response.data.user;
        
        // Stockage sécurisé des infos de l'utilisateur connecté
        localStorage.setItem('user', JSON.stringify(loggedUser));
        
        // 🎯 AIGUILLAGE STRATÉGIQUE CORRIGÉ
        if (loggedUser.role === 'admin') {
          navigate('/admin/secretariat'); // 🏛️ L'admin va directement à son secrétariat
        } else if (loggedUser.role === 'enseignant') {
          navigate('/enseignant/dashboard'); // 👨‍🏫 Le prof va à son tableau de bord
        } else {
          navigate('/dashboard'); // 🎻 L'étudiant va à son pupitre
        }
      }
      
      // 🟡 CAS 2 : Le serveur répond 200 mais avec un message d'échec (sécurité)
      else {
        setError(response.data.error || "Identifiants académiques invalides.");
      }

    } catch (err) {
      console.error(err);
      
      // 🔴 CAS 3 : Gestion fine des erreurs interceptées par Axios (Ex: Code 401 pour mauvais mot de passe)
      if (err.response && err.response.data) {
        setError(err.response.data.error || "Identifiants académiques invalides.");
      } else {
        // Erreur réseau pure (MAMP éteint, mauvaise URL...)
        setError("Le secrétariat numérique est indisponible actuellement.");
      }
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
          <span>ESPACE SÉCURISÉ CENTRALISÉ</span>
        </div>

      </div>
    </div>
  );
}