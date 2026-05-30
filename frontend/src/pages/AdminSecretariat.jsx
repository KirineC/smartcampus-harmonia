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

  const [form, setForm] = useState({
    code_cours: '', titre: '', type_cours: 'Collectif', capacite_max: 20,
    enseignant_id: '', salle_id: '', jour_semaine: '1', heure_debut: '09:00',
    heure_fin: '10:30', semestre: '1', description: ''
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
        const listeProfs = response.data.enseignants || [];
        const listeSalles = response.data.salles || [];
        setCours(response.data.cours || []);
        setEnseignants(listeProfs);
        setSalles(listeSalles);
        
        setForm(prev => ({
          ...prev,
          ...(listeProfs.length > 0 ? { enseignant_id: listeProfs[0].id } : {}),
          ...(listeSalles.length > 0 ? { salle_id: listeSalles[0].id } : {})
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

  // ✍️ Soumission Création (POST)
  const handleCreerCours = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const salleSelectionnee = salles.find(s => String(s.id) === String(form.salle_id));

    if (salleSelectionnee) {
      // ❌ CONFLIT 1 : Capacité Logistique
      const placesDemandees = parseInt(form.capacite_max, 10);
      const capaciteSalleMax = parseInt(salleSelectionnee.capacite_maximale, 10);

      if (placesDemandees > capaciteSalleMax) {
        setErrorMsg(`🚨 Conflit Logistique : La salle "${salleSelectionnee.nom_salle}" est trop petite. Capacité maximale : ${capaciteSalleMax} places (demandé : ${placesDemandees}).`);
        return; 
      }

      // 🎹 CONFLIT 2 : Acoustique (via le Nom de la Salle)
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

  // ✏️ Soumission Modification (POST avec action modifier)
  const handleModifierCours = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const salleSelectionnee = salles.find(s => String(s.id) === String(coursEnEdition.salle_id));

    if (salleSelectionnee) {
      // ❌ CONFLIT 1 : Capacité Logistique en Édition
      const placesDemandees = parseInt(coursEnEdition.capacite_max, 10);
      const capaciteSalleMax = parseInt(salleSelectionnee.capacite_maximale, 10);

      if (placesDemandees > capaciteSalleMax) {
        setErrorMsg(`🚨 Conflit Logistique : La salle "${salleSelectionnee.nom_salle}" ne peut pas accueillir ${placesDemandees} personnes. (Max : ${capaciteSalleMax}).`);
        return;
      }

      // 🎹 CONFLIT 2 : Acoustique en Édition
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

  // 🗑️ Suppression (DELETE - Révocation Douce)
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

      <div className="teacher-tabs" style={{ marginBottom: '30px', borderBottom: '1px solid #eae9e4' }}>
        <button className={`tab-btn ${activeTab === 'liste' ? 'active' : ''}`} onClick={() => setActiveTab('liste')}>🎻 Chaires Actives ({cours.length})</button>
        <button className={`tab-btn ${activeTab === 'creer' ? 'active' : ''}`} onClick={() => setActiveTab('creer')}>✍️ Ouvrir un Enseignement</button>
      </div>

      {/* 🎻 VUE LISTE */}
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
                /* 🎯 MODIFICATION ICI : On grise la ligne si le cours est Révoqué */
                <tr key={c.id} style={c.statut === 'Révoqué' ? { opacity: 0.5, backgroundColor: '#f9f9f9' } : {}}>
                  <td>
                    <span style={{ fontSize: '11px', color: '#a39264', fontWeight: '600' }}>{c.code_cours}</span>
                    <strong style={{ display: 'block', fontSize: '15px' }}>{c.titre}</strong>
                    <span style={{ fontSize: '12px', color: '#777' }}>{c.type_cours} • {c.capacite_max} pl.</span>
                    {/* 🎯 MODIFICATION ICI : On affiche un badge d'avertissement rouge discret */}
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
                      {/* 🎯 MODIFICATION ICI : On n'affiche les boutons d'actions QUE si le cours n'est pas encore Révoqué */}
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

      {/* ✍️ FORMULAIRE CRÉATION */}
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