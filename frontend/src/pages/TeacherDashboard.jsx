import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/');
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'enseignant' && userObj.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(userObj);
    chargerStatsDuProf(userObj.id);
  }, [navigate]);

  const chargerStatsDuProf = async (profUserId) => {
    try {
      setLoading(true);
      const response = await api.get(`/index.php?liste_eleves_prof=${profUserId}`);
      if (response.data && response.data.success) {
        setStats(response.data.stats || null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Impossible de charger les données analytiques de la chaire.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="conservatoire-loading">Ouverture du Registre des Maîtres...</div>;
  }

  return (
    <div className="teacher-wrapper" style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* En-tête de bienvenue */}
      <section style={{ marginBottom: '50px' }}>
        <span className="sc-tag" style={{ letterSpacing: '2px', color: '#a39264', fontSize: '11px', fontWeight: '600' }}>
          CONSERVATOIRE NATIONAL SUPÉRIEUR • ESPACE ENSEIGNANT
        </span>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '42px', fontWeight: 'normal', margin: '15px 0 5px 0', color: '#111' }}>
          Bienvenue, Maître {user?.prenom} {user?.nom}
        </h1>
        <p style={{ fontStyle: 'italic', color: '#666', margin: 0, fontSize: '16px' }}>
          Gestion de vos chaires d'enseignements et pupitres d'élèves.
        </p>
        {errorMsg && <p style={{ color: '#c5221f', marginTop: '15px' }}>{errorMsg}</p>}
      </section>

      {/* 📊 Zone des indicateurs clés épurée */}
      {stats && (
        <div style={{ display: 'flex', gap: '30px', marginBottom: '60px' }}>
          <div style={{ flex: 1, background: '#ffffff', border: '1px solid #eae9e4', padding: '24px', borderRadius: '2px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'sans-serif' }}>
              Niveau d'Audition Global
            </span>
            <span style={{ fontFamily: 'Georgia', fontSize: '32px', color: '#a39264' }}>
              {stats.moyenneClasse !== null ? `${stats.moyenneClasse}/20` : '—'}
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px', fontFamily: 'sans-serif' }}>
              Moyenne de la chaire ({stats.completionNotes}% notés)
            </span>
          </div>

          <div style={{ flex: 1, background: '#ffffff', border: '1px solid #eae9e4', padding: '24px', borderRadius: '2px', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'sans-serif' }}>
              Virtuose de la Promotion
            </span>
            <span style={{ fontFamily: 'Georgia', fontSize: '20px', fontWeight: 'bold', color: '#111', display: 'block', marginTop: '10px' }}>
              {stats.major}
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '10px', fontFamily: 'sans-serif' }}>
              Meilleure évaluation enregistrée
            </span>
          </div>
        </div>
      )}

      {/* 🧭 Raccourcis de navigation Chic */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Raccourci Inscriptions */}
        <div 
          onClick={() => navigate('/enseignant/inscriptions')}
          className="menu-shortcut-card"
          style={{ background: '#ffffff', border: '1px solid #eae9e4', padding: '40px', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.3s ease' }}
        >
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '15px' }}>🎻</span>
          <h3 style={{ fontFamily: 'Georgia', fontSize: '22px', fontWeight: 'normal', margin: '0 0 10px 0', color: '#111' }}>
            Registre des Classes & Pupitres
          </h3>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: 0, fontFamily: 'sans-serif' }}>
            Validez les demandes d'inscription en attente, gérez les élèves admis dans vos classes et éditez les feuilles d'émargement officielles au format PDF.
          </p>
        </div>

        {/* Raccourci Notes */}
        <div 
          onClick={() => navigate('/enseignant/notes')}
          className="menu-shortcut-card"
          style={{ background: '#ffffff', border: '1px solid #eae9e4', padding: '40px', borderRadius: '2px', cursor: 'pointer', transition: 'all 0.3s ease' }}
        >
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '15px' }}>📊</span>
          <h3 style={{ fontFamily: 'Georgia', fontSize: '22px', fontWeight: 'normal', margin: '0 0 10px 0', color: '#111' }}>
            Saisie des Auditions de Semestre
          </h3>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5', margin: 0, fontFamily: 'sans-serif' }}>
            Accédez au carnet de notes numérique pour évaluer vos étudiants, modifier les notes d'examen et publier officiellement les résultats sur leurs bulletins.
          </p>
        </div>

      </div>

    </div>
  );
}