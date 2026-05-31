import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TeacherDashboard.css';

export default function AdminSecretariat() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('liste'); 
  const [cours, setCours] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [salles, setSalles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  // 📝 ÉDITION : States pour la fenêtre modale
  const [coursEnEdition, setCoursEnEdition] = useState(null);

  const navigate = useNavigate();

  // Formulaire pour les cours
  const [form, setForm] = useState({
    code_cours: '', titre: '', type_cours: 'Collectif', capacite_max: 20,
    enseignant_id: '', salle_id: '', jour_semaine: '1', heure_debut: '09:00',
    heure_fin: '10:30', semestre: '1', description: ''
  });

  // 🎯 NOUVEAU : State pour le formulaire de création de compte utilisateur
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    role: 'etudiant', // par défaut
    prenom: '',
    nom: '',
    filiere: 'Classique',
    instrument_majeur: 'Piano'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/'); return; }
    const userObj = JSON.parse(userData);
    if (userObj.role !== 'admin') { navigate('/dashboard'); return; }
    setUser(userObj);
    chargerHubAdmin();
  }, []);

  const chargerHubAdmin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.get('/index.php?admin_gestion=1');
      if (response.data && response.data.success) {
        const listProfs = response.data.enseignants || [];
        const listSalles = response.data.salles || [];
        setCours(response.data.cours || []);
        setEnseignants(listProfs);
        setSalles(listSalles);
        
        setForm(prev => ({
          ...prev,
          ...(listProfs.length > 0 ? { enseignant_id: listProfs[0].id } : {}),
          ...(listSalles.length > 0 ? { salle_id: listSalles[0].id } : {})
        }));
      }
    } catch (err) {
      setErrorMsg("Impossible de synchroniser le registre du Secrétariat.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditionInputChange = (e) => {
    const { name, value } = e.target;
    setCoursEnEdition(prev => ({ ...prev, [name]: value }));
  };

  // 🎯 NOUVEAU : Gérer les changements du formulaire utilisateur
  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  // ✍️ Soumission Création Cours (POST)
  const handleCreerCours = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const salleSelectionnee = salles.find(s => String(s.id) === String(form.salle_id));

    if (salleSelectionnee) {
      const placesDemandees = parseInt(form.capacite_max, 10);
      const capaciteSalleMax = parseInt(salleSelectionnee.capacite_maximale, 10);

      if (placesDemandees > capaciteSalleMax) {
        setErrorMsg(`🚨 Conflit Logistique : La salle "${salleSelectionnee.nom_salle}" est trop petite. Capacité maximale : ${capaciteSalleMax} places (demandé : ${placesDemandees}).`);
        return; 
      }

      const aBesoinDePiano = form.titre.toLowerCase().includes('piano');
      const estUneSallePiano = salleSelectionnee.nom_salle.toLowerCase().includes('piano');

      if (aBesoinDePiano && !estUneSallePiano) {
        if (!window.confirm(`⚠️ Avertissement Acoustique : Vous planifiez un cours de Piano dans la salle "${salleSelectionnee.nom_salle}", qui ne semble pas dédiée au piano. Continuer ?`)) {
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/index.php', { action: 'creer_cours', ...form });
      if (response.data && response.data.success) {
        setSuccessMsg("✨ La chaire d'enseignement a été ouverte avec succès.");
        setForm(prev => ({ ...prev, code_cours: '', titre: '', description: '' }));
        await chargerHubAdmin();
        setActiveTab('liste');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Erreur de validation lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🎯 NOUVEAU : Soumission Création Compte Utilisateur (POST)
  const handleCreerUtilisateur = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const response = await api.post('/index.php', {
        action: 'creer_utilisateur',
        admin_gestion: 1, // Permet à ton index.php de router vers admin_gestion.php
        ...userForm
      });

      if (response.data && response.data.success) {
        setSuccessMsg(`👤 Félicitations : ${response.data.message || "Le profil académique a été créé."}`);
        // Reset du formulaire
        setUserForm({
          email: '', password: '', role: 'etudiant', prenom: '', nom: '', filiere: 'Classique', instrument_majeur: 'Piano'
        });
        await chargerHubAdmin(); // Rafraîchit les listes au cas où c'est un prof
        setActiveTab('liste');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Erreur lors de l'inscription du profil.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✏️ Soumission Modification
  const handleModifierCours = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const salleSelectionnee = salles.find(s => String(s.id) === String(coursEnEdition.salle_id));

    if (salleSelectionnee) {
      const placesDemandees = parseInt(coursEnEdition.capacite_max, 10);
      const capaciteSalleMax = parseInt(salleSelectionnee.capacite_maximale, 10);

      if (placesDemandees > capaciteSalleMax) {
        setErrorMsg(`🚨 Conflit Logistique : La salle "${salleSelectionnee.nom_salle}" ne peut pas accueillir ${placesDemandees} personnes. (Max : ${capaciteSalleMax}).`);
        return;
      }

      const aBesoinDePiano = coursEnEdition.titre.toLowerCase().includes('piano');
      const estUneSallePiano = salleSelectionnee.nom_salle.toLowerCase().includes('piano');

      if (aBesoinDePiano && !estUneSallePiano) {
        if (!window.confirm(`⚠️ Avertissement Acoustique : La salle "${salleSelectionnee.nom_salle}" n'est pas configurée pour le Piano. Enregistrer quand même ?`)) {
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/index.php', {
        action: 'modifier_cours',
        ...coursEnEdition
      });
      if (response.data && response.data.success) {
        setSuccessMsg("💾 Les modifications ont été scellées dans le registre.");
        setCoursEnEdition(null); 
        await chargerHubAdmin();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Erreur lors de la modification du cours.");
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ Suppression
  const handleSupprimerCours = async (coursId) => {
    if (!window.confirm("Fermer cette chaire ? Cela archivera le cours et révoquera les inscriptions élèves liées !")) return;
    try {
      const response = await api.delete(`/index.php?supprimer_cours=${coursId}`);
      if (response.data && response.data.success) {
        setSuccessMsg("❌ L'enseignement a été révoqué avec succès du catalogue courant.");
        await chargerHubAdmin();
      }
    } catch (err) {
      setErrorMsg("Impossible de modifier le statut de ce cours.");
    }
  };

  const mapChiffreEnJour = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };
  
  const afficherNomSalle = (salleId) => {
    const s = salles.find(sl => String(sl.id) === String(salleId));
    return s ? `${s.nom_salle} (${s.batiment})` : `Salle ${salleId}`;
  };

  if (loading) return <div className="conservatoire-loading">Ouverture des Archives...</div>;

  return (
    <div className="teacher-wrapper" style={{ padding: '60px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <section style={{ marginBottom: '40px' }}>
        <span className="sc-tag" style={{ color: '#a39264', fontWeight: '600' }}>HARMONIA • SECRÉTARIAT DES ADMISSIONS</span>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38px', fontWeight: 'normal', margin: '10px 0 5px 0' }}>Registre Général des Chaires</h1>
        {successMsg && <div style={{ marginTop: '20px', padding: '12px', background: '#e8f5e9', border: '1px solid #137333', color: '#137333' }}>{successMsg}</div>}
        {errorMsg && <div style={{ marginTop: '20px', padding: '12px', background: '#fdecea', border: '1px solid #b3261e', color: '#b3261e' }}>{errorMsg}</div>}
      </section>

      {/* 🎯 Barre d'onglets mise à jour avec le 3ème bouton */}
      <div className="teacher-tabs" style={{ marginBottom: '30px', borderBottom: '1px solid #eae9e4', display: 'flex', gap: '10px' }}>
        <button className={`tab-btn ${activeTab === 'liste' ? 'active' : ''}`} onClick={() => { setActiveTab('liste'); setErrorMsg(''); setSuccessMsg(''); }}>
          🎻 Chaires Actives ({cours.length})
        </button>
        <button className={`tab-btn ${activeTab === 'creer' ? 'active' : ''}`} onClick={() => { setActiveTab('creer'); setErrorMsg(''); setSuccessMsg(''); }}>
          ✍️ Ouvrir un Enseignement
        </button>
        <button className={`tab-btn ${activeTab === 'membres' ? 'active' : ''}`} onClick={() => { setActiveTab('membres'); setErrorMsg(''); setSuccessMsg(''); }}>
          👤 Inscrire un Membre
        </button>
      </div>

      {/* 🎻 VUE 1 : LISTE DES COURS */}
      {activeTab === 'liste' && (
        <div className="teacher-card animate-fade">
          <table className="chic-table">
            <thead>
              <tr>
                <th>Code & Discipline</th>
                <th>Maître de Chaire</th>
                <th>Planification & Lieu</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cours.map(c => (
                <tr key={c.id} style={c.statut === 'Révoqué' ? { opacity: 0.5, backgroundColor: '#f9f9f9' } : {}}>
                  <td>
                    <span style={{ fontSize: '11px', color: '#a39264', fontWeight: '600' }}>{c.code_cours}</span>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{c.titre}</strong>
                    <span style={{ fontSize: '12px', color: '#777' }}>{c.type_cours} • {c.capacite_max} pl.</span>
                    {c.statut === 'Révoqué' && (
                      <span style={{ display: 'inline-block', marginTop: '5px', padding: '2px 6px', background: '#b3261e', color: '#fff', fontSize: '10px', fontWeight: 'bold', fontFamily: 'sans-serif', borderRadius: '3px' }}>CHAIRE RÉVOQUÉE</span>
                    )}
                  </td>
                  <td><span style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}>Pr. {c.prof_prenom} {c.prof_nom}</span></td>
                  <td>
                    <strong>{mapChiffreEnJour[c.jour_semaine]}</strong>
                    <div style={{ fontSize: '13px' }}>{c.heure_debut.substring(0, 5)} — {c.heure_fin.substring(0, 5)}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>📍 {afficherNomSalle(c.salle_id)} (S{c.semestre})</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {c.statut !== 'Révoqué' ? (
                        <>
                          <button className="minimal-btn" style={{ padding: '6px 12px', fontSize: '11px', background: '#a39264' }} onClick={() => setCoursEnEdition(c)}>✏️ Éditer</button>
                          <button className="action-btn-delete" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleSupprimerCours(c.id)}>Révoquer</button>
                        </>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#999', fontSize: '12px' }}>Chaire archivée</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✍️ VUE 2 : CRÉATION COURS */}
      {activeTab === 'creer' && (
        <div className="teacher-card animate-fade" style={{ maxWidth: '700px' }}>
          <form onSubmit={handleCreerCours} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div><label>Code Unique</label><input type="text" name="code_cours" value={form.code_cours} onChange={handleInputChange} required className="chic-note-input" style={{ width:'100%' }}/></div>
              <div><label>Intitulé</label><input type="text" name="titre" value={form.titre} onChange={handleInputChange} required className="chic-note-input" style={{ width:'100%' }}/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Maître</label>
                <select name="enseignant_id" value={form.enseignant_id} onChange={handleInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  {enseignants.map(p => <option key={p.id} value={p.id}>Pr. {p.prenom} {p.nom}</option>)}
                </select>
              </div>
              <div>
                <label>Salle</label>
                <select name="salle_id" value={form.salle_id} onChange={handleInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.nom_salle} ({s.batiment})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label>Jour</label>
                <select name="jour_semaine" value={form.jour_semaine} onChange={handleInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  <option value="1">Lundi</option><option value="2">Mardi</option><option value="3">Mercredi</option><option value="4">Jeudi</option><option value="5">Vendredi</option><option value="6">Samedi</option>
                </select>
              </div>
              <div><label>Début</label><input type="time" name="heure_debut" value={form.heure_debut} onChange={handleInputChange} required className="chic-note-input" style={{ width:'100%', height:'42px' }}/></div>
              <div><label>Fin</label><input type="time" name="heure_fin" value={form.heure_fin} onChange={handleInputChange} required className="chic-note-input" style={{ width:'100%', height:'42px' }}/></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label>Format</label>
                <select name="type_cours" value={form.type_cours} onChange={handleInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  <option value="Collectif">Cours Collectif</option><option value="Masterclass">Masterclass</option><option value="Particulier">Cours Particulier</option>
                </select>
              </div>
              <div><label>Places Max</label><input type="number" name="capacite_max" value={form.capacite_max} onChange={handleInputChange} required className="chic-note-input" style={{ width:'100%' }}/></div>
              <div>
                <label>Semestre</label>
                <select name="semestre" value={form.semestre} onChange={handleInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  <option value="1">Semestre 1</option><option value="2">Semestre 2</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="teacher-btn-dark" style={{ height: '45px' }}>{submitting ? "Saisie en cours..." : "Ouvrir la Chaire"}</button>
          </form>
        </div>
      )}

      {/* 🎯 NOUVELLE VUE 3 : FORMULAIRE D'INSCRIPTION UTILISATEUR DYNAMIQUE */}
      {activeTab === 'membres' && (
        <div className="teacher-card animate-fade" style={{ maxWidth: '700px' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 'normal', marginBottom: '20px', color: '#111' }}>Enrôlement d'un nouvel Académicien ou Enseignant</h3>
          
          <form onSubmit={handleCreerUtilisateur} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Prénom</label>
                <input type="text" name="prenom" value={userForm.prenom} onChange={handleUserInputChange} required className="chic-note-input" style={{ width:'100%' }} placeholder="ex: Sophie"/>
              </div>
              <div>
                <label>Nom de Famille</label>
                <input type="text" name="nom" value={userForm.nom} onChange={handleUserInputChange} required className="chic-note-input" style={{ width:'100%' }} placeholder="ex: Martin"/>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              <div>
                <label>Adresse Courriel Institutionnelle</label>
                <input type="email" name="email" value={userForm.email} onChange={handleUserInputChange} required className="chic-note-input" style={{ width:'100%' }} placeholder="ex: s.martin@harmonia.fr"/>
              </div>
              <div>
                <label>Rang / Rôle</label>
                <select name="role" value={userForm.role} onChange={handleUserInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                  <option value="etudiant">Étudiant</option>
                  <option value="enseignant">Enseignant (Maître)</option>
                </select>
              </div>
            </div>

            <div>
              <label>Mot de Passe Temporaire</label>
              <input type="password" name="password" value={userForm.password} onChange={handleUserInputChange} required className="chic-note-input" style={{ width:'100%' }} placeholder="••••••••"/>
            </div>

            {/* 🎻 CLAUSE DYNAMIQUE : Affichée UNIQUEMENT pour les Étudiants */}
            {userForm.role === 'etudiant' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', background: '#faf9f5', border: '1px dashed #d4af37', borderRadius: '2px' }} className="animate-fade">
                <div>
                  <label>Filière d'Étude</label>
                  <select name="filiere" value={userForm.filiere} onChange={handleUserInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                    <option value="Classique">Musique Classique</option>
                    <option value="Baroque">Musique Baroque</option>
                    <option value="Jazz">Jazz & Improvisation</option>
                    <option value="Contemporain">Musique Contemporaine</option>
                  </select>
                </div>
                <div>
                  <label>Instrument Majeur (Pupitre)</label>
                  <select name="instrument_majeur" value={userForm.instrument_majeur} onChange={handleUserInputChange} className="chic-note-input" style={{ width:'100%', height:'42px', background:'#fff' }}>
                    <option value="Piano">Piano</option>
                    <option value="Violon">Violon</option>
                    <option value="Violoncelle">Violoncelle</option>
                    <option value="Flûte Traversière">Flûte Traversière</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting} className="teacher-btn-dark" style={{ height: '45px', marginTop: '10px' }}>
              {submitting ? "Enregistrement au grand livre..." : "Inscrire au Registre de l'Académie"}
            </button>
          </form>
        </div>
      )}

      {/* 🛎️ POP-UP MODALE DE MODIFICATION D'UNE CHAIRE */}
      {coursEnEdition && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17,17,17,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} className="animate-fade">
          <div className="teacher-card" style={{ width: '90%', maxWidth: '600px', background: '#ffffff', padding: '30px', borderTop: '4px solid #a39264', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Modification : {coursEnEdition.titre}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }} onClick={() => setCoursEnEdition(null)}>✕</button>
            </div>
            
            <form onSubmit={handleModifierCours} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Intitulé de la Discipline</label>
                <input type="text" name="titre" value={coursEnEdition.titre} onChange={handleEditionInputChange} required className="chic-note-input" style={{ width: '100%', marginTop: '4px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Maître en charge</label>
                  <select name="enseignant_id" value={coursEnEdition.enseignant_id} onChange={handleEditionInputChange} className="chic-note-input" style={{ width: '100%', height: '40px', background: '#fff', marginTop: '4px' }}>
                    {enseignants.map(p => <option key={p.id} value={p.id}>Pr. {p.prenom} {p.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Lieu d'enseignement</label>
                  <select name="salle_id" value={coursEnEdition.salle_id} onChange={handleEditionInputChange} className="chic-note-input" style={{ width: '100%', height: '40px', background: '#fff', marginTop: '4px' }}>
                    {salles.map(s => <option key={s.id} value={s.id}>{s.nom_salle} ({s.batiment})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Jour</label>
                  <select name="jour_semaine" value={coursEnEdition.jour_semaine} onChange={handleEditionInputChange} className="chic-note-input" style={{ width: '100%', height: '40px', background: '#fff', marginTop: '4px' }}>
                    <option value="1">Lundi</option><option value="2">Mardi</option><option value="3">Mercredi</option><option value="4">Jeudi</option><option value="5">Vendredi</option><option value="6">Samedi</option>
                  </select>
                </div>
                <div><label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Début</label><input type="time" name="heure_debut" value={coursEnEdition.heure_debut.substring(0,5)} onChange={handleEditionInputChange} required className="chic-note-input" style={{ width: '100%', height: '40px', marginTop: '4px' }} /></div>
                <div><label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Fin</label><input type="time" name="heure_fin" value={coursEnEdition.heure_fin.substring(0,5)} onChange={handleEditionInputChange} required className="chic-note-input" style={{ width: '100%', height: '40px', marginTop: '4px' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Places Max</label><input type="number" name="capacite_max" value={coursEnEdition.capacite_max} onChange={handleEditionInputChange} required className="chic-note-input" style={{ width: '100%', marginTop: '4px' }} /></div>
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase' }}>Semestre</label>
                  <select name="semestre" value={coursEnEdition.semestre} onChange={handleEditionInputChange} className="chic-note-input" style={{ width: '100%', height: '40px', background: '#fff', marginTop: '4px' }}>
                    <option value="1">Semestre 1</option><option value="2">Semestre 2</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" disabled={submitting} className="teacher-btn-dark" style={{ flex: 2, height: '40px' }}>{submitting ? "Enregistrement..." : "Enregistrer les modifications"}</button>
                <button type="button" className="action-btn-delete" style={{ flex: 1, height: '40px', background: '#aaa' }} onClick={() => setCoursEnEdition(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}