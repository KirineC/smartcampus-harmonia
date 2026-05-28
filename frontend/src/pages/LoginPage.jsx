import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/authentification', {
        action: 'login',
        email,
        password
      });
      
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirection selon le VRAI rôle de la BD
        if (user.role === 'etudiant') {
          navigate('/dashboard-etudiant');
        } else if (user.role === 'enseignant') {
          navigate('/dashboard-enseignant');
        } else {
          navigate('/dashboard-admin');
        }
      }
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <h1>🎼 Harmonia</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}