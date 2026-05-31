import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Profil.css'; 

export default function Profil() {
  const [loading, setLoading] = useState(true);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [messageError, setMessageError] = useState('');

  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: '',
    telephone: '',
    biographie: '',
    champs_specialite: '' // Contient l'instrument majeur (élève) ou la spécialité (prof)
  });

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    ancien_password: '',
    nouveau_password: '',
    confirme_password: ''
  });

  // 🔍 Chargement des données du profil au montage du composant
  useEffect(() => {
    const chargerProfil = async () => {
      try {
        // 1. On récupère l'utilisateur connecté depuis le stockage local
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        
        if (!user || !user.id) {
          setMessageError("Session utilisateur introuvable. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }

        // 2. 🎯 On transmet l'user_id en paramètre pour blinder la communication
        const response = await api.get(`/index.php?profil=1&user_id=${user.id}`);
        
        if (response.data && response.data.success) {
          const p = response.data.data;
          setFormData({
            nom: p.nom || '',
            prenom: p.prenom || '',
            email: p.email || '',
            role: p.role || '',
            telephone: p.telephone || '',
            biographie: p.biographie || '',
            champs_specialite: p.instrument_majeur || p.specialite || ''
          });
        } else {
          setMessageError(response.data?.error || "Impossible de charger les données du profil.");
        }
      } catch (err) {
        console.error("Erreur de récupération du profil :", err);
        setMessageError("Impossible de charger les données du profil.");
      } finally {
        setLoading(false);
      }
    };

    chargerProfil();
  }, []);

  // Gestion des changements dans les inputs du profil
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des changements dans les inputs de mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // 💾 Envoi des modifications au serveur
  const handleSubmitProfil = async (e) => {
    e.preventDefault();
    setMessageSuccess('');
    setMessageError('');

    // Récupération de l'id pour le POST
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    if (!user || !user.id) {
      setMessageError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    if (passwordData.ancien_password || passwordData.nouveau_password || passwordData.confirme_password) {
      if (!passwordData.ancien_password || !passwordData.nouveau_password) {
        setMessageError("Veuillez remplir l'ancien et le nouveau mot de passe.");
        return;
      }
      if (passwordData.nouveau_password !== passwordData.confirme_password) {
        setMessageError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        return;
      }
    }

    try {
      const payload = {
        user_id: user.id, // 🎯 On envoie l'ID au backend pour le POST aussi !
        email: formData.email,
        telephone: formData.telephone,
        biographie: formData.biographie,
        champs_specialite: formData.champs_specialite,
        ancien_password: passwordData.ancien_password || null,
        nouveau_password: passwordData.nouveau_password || null
      };

      const response = await api.post('/index.php?profil=1', payload);

      if (response.data && response.data.success) {
        setMessageSuccess(response.data.message || "Profil mis à jour avec succès !");
        setPasswordData({ ancien_password: '', nouveau_password: '', confirme_password: '' });
      } else {
        setMessageError(response.data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error(err);
      setMessageError(err.response?.data?.error || "Erreur lors de la sauvegarde.");
    }
  };

  if (loading) {
    return <div className="profil-loading">Ajustement du pupitre...</div>;
  }

  return (
    <div className="profil-container">
      {/* En-tête avec Avatar Style Harmonia Sécurisé */}
      <div className="profil-header-card">
        <div className="profil-avatar">
          {formData.prenom ? formData.prenom.charAt(0) : '?'}
          {formData.nom ? formData.nom.charAt(0) : '?'}
        </div>
        <div className="profil-header-info">
          <h2>{formData.prenom || ''} {formData.nom || ''}</h2>
          <span className="profil-badge-role">{formData.role || 'Artiste'}</span>
        </div>
      </div>

      {/* Messages de retour */}
      {messageSuccess && <div className="profil-alert success">{messageSuccess}</div>}
      {messageError && <div className="profil-alert error">{messageError}</div>}

      <form onSubmit={handleSubmitProfil} className="profil-workspace">
        <div className="profil-grid">
          
          {/* Section 1 : Informations Identitaires & Artistiques */}
          <div className="profil-card">
            <h3>🏛️ Registre Académique</h3>
            
            <div className="form-group">
              <label>Nom de famille</label>
              <input type="text" value={formData.nom} disabled className="input-disabled" />
            </div>

            <div className="form-group">
              <label>Prénom</label>
              <input type="text" value={formData.prenom} disabled className="input-disabled" />
            </div>

            <div className="form-group">
              <label>{formData.role === 'enseignant' ? "Chaire d'enseignement (Spécialité)" : "Discipline Instrumentale Majeure"}</label>
              <input 
                type="text" 
                name="champs_specialite"
                value={formData.champs_specialite} 
                onChange={handleInputChange}
                placeholder={formData.role === 'enseignant' ? "Ex: Piano Baroque, Solfège" : "Ex: Violon Alto, Chant Lyrique"} 
              />
            </div>
          </div>

          {/* Section 2 : Coordonnées Secrétariat */}
          <div className="profil-card">
            <h3>✉️ Coordonnées & Secrétariat</h3>

            <div className="form-group">
              <label>Adresse Courriel</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                required 
              />
            </div>

            <div className="form-group">
              <label>Ligne Téléphonique</label>
              <input 
                type="text" 
                name="telephone"
                value={formData.telephone} 
                onChange={handleInputChange}
                placeholder="Ex: 06 12 34 56 78" 
              />
            </div>

            <div className="form-group">
              <label>Notice Biographique & Parcours Artistique</label>
              <textarea 
                name="biographie"
                value={formData.biographie} 
                onChange={handleInputChange}
                rows="4"
                placeholder="Rédigez ici votre parcours au sein du conservatoire, vos influences ou projets musicaux..."
              />
            </div>
          </div>

          {/* Section 3 : Sécurité du Compte (Clé de Sol) */}
          <div className="profil-card full-width">
            <h3>🔐 Clé de Sécurité</h3>
            <div className="password-grid">
              <div className="form-group">
                <label>Ancien mot de passe</label>
                <input 
                  type="password" 
                  name="ancien_password"
                  value={passwordData.ancien_password} 
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input 
                  type="password" 
                  name="nouveau_password"
                  value={passwordData.nouveau_password} 
                  onChange={handlePasswordChange}
                  placeholder="Min. 6 caractères"
                />
              </div>

              <div className="form-group">
                <label>Confirmer la nouvelle clé</label>
                <input 
                  type="password" 
                  name="confirme_password"
                  value={passwordData.confirme_password} 
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Bouton d'action Harmonia */}
        <div className="profil-actions-zone">
          <button type="submit" className="profil-save-btn">
            Enregistrer la Fiche d'Artiste
          </button>
        </div>
      </form>
    </div>
  );
}