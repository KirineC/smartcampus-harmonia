import React, { useState } from 'react';
import api from '../services/api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getDestinationByRole = (role) => {
    if (role === 'admin') {
      return '/admin/secretariat';
    }

    if (role === 'enseignant') {
      return '/enseignant/dashboard';
    }

    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/index.php', {
        action: 'login',
        email: email,
        password: password
      });

      if (response.data && response.data.success) {
        const loggedUser = response.data.user;

        localStorage.setItem('user', JSON.stringify(loggedUser));

        const destination = getDestinationByRole(loggedUser.role);

        // Redirection complète pour éviter le bug où l'URL change mais la page ne se rafraîchit pas
        window.location.href = destination;
        return;
      }

      setError(response.data.error || "Identifiants académiques invalides.");
    } catch (err) {
      console.error(err);

      if (err.response && err.response.data) {
        setError(err.response.data.error || "Identifiants académiques invalides.");
      } else {
        setError("Le secrétariat numérique est indisponible actuellement.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div style={{ marginBottom: '30px' }}>
          <h1 className="login-title">H A R M O N I A</h1>
          <p className="login-subtitle">Conservatoire National Supérieur de Musique</p>
        </div>

        {error && <div className="login-error">{error}</div>}

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

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Ouverture...' : 'Ouvrir la session'}
          </button>
        </form>

        <div className="login-footer">
          <span>ESPACE SÉCURISÉ CENTRALISÉ</span>
        </div>

      </div>
    </div>
  );
}