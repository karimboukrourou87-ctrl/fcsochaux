import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Users, ClipboardList, CalendarDays, Dumbbell, Search,
  Plus, X, Trash2, ChevronLeft, Trophy, Award, Bell, Activity, Target,
  Footprints, Ruler, Weight, Gauge, Timer, Edit3, Save,
  HeartPulse, ShieldAlert, Star, MapPin, ArrowRightLeft, Eye, FileDown, Phone, Camera, LogOut,
  Send, Check, Inbox, ListOrdered, ExternalLink, Bus, Upload
} from "lucide-react";

/* ============================================================
   Sauvegarde et export des données
   ============================================================ */
function Sauvegarde({ db, mutate, cat, demo, estAdmin, userId, onClose }) {
  const [aImporter, setAImporter] = useState(null);
  const [aImporterClub, setAImporterClub] = useState(null);
  const [busyClub, setBusyClub] = useState(false);
  const [nsConfirm, setNsConfirm] = useState(false);
  const [sauvegardeFaite, setSauvegardeFaite] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);

  function exporter() {
    try {
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      a.href = url;
      a.download = `sochaux-${demo ? "essai" : cat}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setErr(null); setOk("Sauvegarde téléchargée.");
    } catch (e) { setOk(null); setErr("Export impossible sur cet appareil."); }
  }
  function choisirFichier(ev) {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.players)) throw new Error("format");
        setErr(null); setOk(null); setAImporter(parsed);
      } catch (e) { setAImporter(null); setOk(null); setErr("Fichier non valide. Choisis un fichier exporté par l'application."); }
    };
    reader.onerror = () => setErr("Lecture du fichier impossible.");
    reader.readAsText(f);
  }
  function confirmerImport() {
    mutate(() => ({ ...EMPTY_DB, ...aImporter }));
    setAImporter(null); setOk("Données restaurées.");
  }

  async function exporterClub() {
    setBusyClub(true); setErr(null); setOk(null);
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("categorie_data").select("categorie, data");
      if (error) throw error;
      const categories = {};
      (data || []).forEach((row) => { categories[row.categorie] = row.data; });
      let reunions = [];
      try { reunions = await loadReunions(); } catch (e) {}
      const obj = { club: true, exporteLe: new Date().toISOString(), categories, reunions };
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      a.href = url;
      a.download = `sochaux-CLUB-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOk(`Sauvegarde complète téléchargée (${Object.keys(categories).length} catégorie(s)).`);
      setSauvegardeFaite(true);
      return true;
    } catch (e) { setErr("Sauvegarde complète impossible. Vérifie la connexion."); return false; }
    finally { setBusyClub(false); }
  }
  async function sauvegarderEtFermer() {
    const ok = await exporterClub();
    if (ok) setNsConfirm(true);
  }
  function choisirFichierClub(ev) {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !parsed.categories) throw new Error("format");
        setErr(null); setOk(null); setAImporterClub(parsed);
      } catch (e) { setAImporterClub(null); setOk(null); setErr("Fichier non valide. Choisis une sauvegarde complète du club."); }
    };
    reader.onerror = () => setErr("Lecture du fichier impossible.");
    reader.readAsText(f);
  }
  async function confirmerImportClub() {
    setBusyClub(true); setErr(null);
    try {
      const cats = aImporterClub.categories || {};
      const noms = Object.keys(cats);
      for (const c of noms) { await saveCat(c, { ...EMPTY_DB, ...cats[c] }, userId); }
      if (Array.isArray(aImporterClub.reunions)) { try { await saveReunions(aImporterClub.reunions); } catch (e) {} }
      setAImporterClub(null); setOk(`Club restauré (${noms.length} catégorie(s)). Recharge l'application pour tout voir.`);
    } catch (e) { setErr("Restauration complète impossible. Vérifie la connexion et les droits."); }
    finally { setBusyClub(false); }
  }

  async function nouvelleSaison() {
    if (!sauvegardeFaite) { setNsConfirm(false); setErr("Tu dois d'abord télécharger la sauvegarde complète avant de démarrer une nouvelle saison."); return; }
    setBusyClub(true); setErr(null); setOk(null);
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("categorie_data").select("categorie, data");
      if (error) throw error;
      for (const row of (data || [])) {
        const blob = { ...EMPTY_DB, ...(row.data || {}) };
        const saison = saisonDuBlob(blob);
        const players = (blob.players || []).map((p) => {
          const pl = structuredClone(p);
          pl.parcours = pl.parcours || [];
          if (!pl.parcours.some((s) => s.saison === saison)) pl.parcours.unshift(instantaneSaison(p, blob, saison));
          pl.suspension = ""; pl.suspensionFin = ""; pl.discRef = { jaunes: 0, rouges: 0 }; pl.discDate = "";
          pl.medicalStatut = ""; pl.medicalSaison = "";
          return pl;
        });
        const nouveau = { ...EMPTY_DB, players, encadrement: blob.encadrement || [], config: { trainingDays: (blob.config && blob.config.trainingDays) || {}, breaks: {}, classement: {} } };
        await saveCat(row.categorie, nouveau, userId);
      }
      try { await saveReunions([]); } catch (e) {}
      setNsConfirm(false); setOk("Nouvelle saison démarrée. Les effectifs sont conservés, le reste est remis à zéro. Recharge l'application.");
    } catch (e) { setErr("Impossible de démarrer la nouvelle saison. Vérifie la connexion."); }
    finally { setBusyClub(false); }
  }

  return (
    <Modal title="Sauvegarde des données" onClose={onClose}>
      {demo && (
        <div style={{ fontSize: 12.5, color: C.encre, background: "#FFF7E6", border: "1px solid #F0DBA8", borderRadius: 10, padding: 11, marginBottom: 14, lineHeight: 1.5 }}>
          Mode essai : tes données sont enregistrées uniquement sur cet appareil. Exporte régulièrement pour ne rien perdre, ou branche la base en ligne (Supabase) pour une sauvegarde partagée et automatique.
        </div>
      )}

      {estAdmin && !demo && (
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${C.grisClair}` }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Sauvegarde de tout le club</div>
          <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8, lineHeight: 1.5 }}>Réservé à la direction. Télécharge toutes les catégories du club en un seul fichier, en une fois.</div>
          <Btn variant="accent" full disabled={busyClub} onClick={exporterClub}><FileDown size={16} /> {busyClub ? "Préparation..." : "Télécharger la sauvegarde complète"}</Btn>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", border: `1px solid ${C.grisClair}`, borderRadius: 12, padding: "11px 16px", fontWeight: 700, fontSize: 14, color: C.encre, background: "#fff", marginTop: 8 }}>
            <Upload size={16} /> Restaurer tout le club
            <input type="file" accept="application/json,.json" onChange={choisirFichierClub} style={{ display: "none" }} />
          </label>
          {aImporterClub && (
            <div style={{ marginTop: 12, background: "#FFF6F6", border: "1px solid #F3C9C9", borderRadius: 10, padding: 11 }}>
              <div style={{ fontSize: 13, color: C.rouge, fontWeight: 700, marginBottom: 8 }}>Restaurer tout le club depuis ce fichier ? Les catégories du fichier seront remplacées. Cette action est définitive.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="danger" size="sm" disabled={busyClub} onClick={confirmerImportClub}>{busyClub ? "Restauration..." : "Confirmer"}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setAImporterClub(null)}>Annuler</Btn>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.grisClair}` }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Clôture de saison</div>
            <div style={{ fontSize: 13, color: C.bleu, fontWeight: 800, marginBottom: 6 }}>Saison en cours : {saisonCourante()}</div>
            <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8, lineHeight: 1.5 }}>Ce bouton télécharge d'abord la sauvegarde complète de la saison {saisonCourante()}, puis, après confirmation, repart sur une saison vierge pour {saisonSuivante(saisonCourante())} : matchs, séances, statistiques, cartons, blessures et compositions remis à zéro. Les joueurs sont conservés et leur parcours archivé dans leur fiche.</div>
            {!nsConfirm ? (
              <Btn variant="ghost" full disabled={busyClub} onClick={sauvegarderEtFermer}><CalendarDays size={16} /> {busyClub ? "Sauvegarde..." : `Sauvegarder et fermer la saison ${saisonCourante()}`}</Btn>
            ) : (
              <div style={{ background: "#FFF6F6", border: "1px solid #F3C9C9", borderRadius: 10, padding: 11 }}>
                <div style={{ fontSize: 13, color: C.rouge, fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>La sauvegarde de la saison {saisonCourante()} a été téléchargée. Range-la précieusement. Confirmes-tu la fermeture de la saison {saisonCourante()} et le démarrage de {saisonSuivante(saisonCourante())} ? Les données de jeu de toutes les catégories seront effacées, les joueurs et leur parcours conservés.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="danger" size="sm" disabled={busyClub} onClick={nouvelleSaison}>{busyClub ? "En cours..." : `Oui, fermer ${saisonCourante()} et démarrer ${saisonSuivante(saisonCourante())}`}</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setNsConfirm(false)}>Annuler</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ fontWeight: 800, marginBottom: 6 }}>{estAdmin && !demo ? "Sauvegarde de la catégorie" : "Exporter"}</div>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8 }}>Télécharge un fichier de sauvegarde {demo ? "de toutes les catégories" : `de la catégorie ${cat}`}.</div>
      <Btn variant="accent" full onClick={exporter}><FileDown size={16} /> Télécharger la sauvegarde</Btn>

      <div style={{ fontWeight: 800, margin: "18px 0 6px" }}>Restaurer{estAdmin && !demo ? " la catégorie" : ""}</div>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8 }}>Remplace les données actuelles par celles d'un fichier de sauvegarde.</div>
      <label style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
        border: `1px solid ${C.grisClair}`, borderRadius: 12, padding: "11px 16px", fontWeight: 700, fontSize: 14, color: C.encre, background: "#fff",
      }}>
        <Upload size={16} /> Choisir un fichier de sauvegarde
        <input type="file" accept="application/json,.json" onChange={choisirFichier} style={{ display: "none" }} />
      </label>

      {aImporter && (
        <div style={{ marginTop: 12, background: "#FFF6F6", border: "1px solid #F3C9C9", borderRadius: 10, padding: 11 }}>
          <div style={{ fontSize: 13, color: C.rouge, fontWeight: 700, marginBottom: 8 }}>Remplacer les données actuelles par ce fichier ? Cette action est définitive.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="danger" size="sm" onClick={confirmerImport}>Confirmer</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setAImporter(null)}>Annuler</Btn>
          </div>
        </div>
      )}
      {err && <div style={{ marginTop: 12, fontSize: 12.5, color: C.rouge }}>{err}</div>}
      {ok && <div style={{ marginTop: 12, fontSize: 12.5, color: C.vert, fontWeight: 700 }}>{ok}</div>}
    </Modal>
  );
}


function FormTransport({ onSubmit, onClose }) {
  const [date, setDate] = useState("");
  const [destination, setDestination] = useState("");
  const [mode, setMode] = useState("Minibus club");
  const [minibus, setMinibus] = useState([]);
  const [loueur, setLoueur] = useState("");
  const [nbVoitures, setNbVoitures] = useState("");
  const [parents, setParents] = useState("");
  const [note, setNote] = useState("");
  const toggle = (b) => setMinibus((a) => a.includes(b) ? a.filter((x) => x !== b) : [...a, b]);
  return (
    <Modal title="Nouvelle demande de transport" onClose={onClose}
      footer={<Btn variant="accent" full disabled={!date} onClick={() => onSubmit({ date, destination, mode, minibus, loueur, nbVoitures, parents, note })}><Send size={16} /> Envoyer la demande</Btn>}>
      <Field label="Date du déplacement"><Inp type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="Destination ou adversaire (optionnel)"><Inp value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Lieu ou équipe" /></Field>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Mode de transport</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {MODES_TRANSPORT.map((m) => {
          const on = mode === m;
          return (
            <button key={m} onClick={() => setMode(m)} style={{
              border: `1px solid ${on ? C.bleu : C.grisClair}`, cursor: "pointer", borderRadius: 11, padding: "11px 13px",
              fontWeight: 800, fontSize: 14, textAlign: "left", background: on ? C.bleu : "#fff", color: on ? "#fff" : C.encre,
            }}>{m}</button>
          );
        })}
      </div>
      {mode === "Minibus club" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Minibus du club (plusieurs possibles)</div>
          <div style={{ display: "flex", gap: 8 }}>
            {MINIBUS.map((b) => {
              const on = minibus.includes(b);
              return (
                <button key={b} onClick={() => toggle(b)} style={{
                  flex: 1, border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "10px 6px", fontWeight: 900, fontSize: 15,
                  background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                }}>{b}</button>
              );
            })}
          </div>
        </div>
      )}
      {mode === "Bus en location" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 2 }}>Loueur</div>
            <div style={{ fontSize: 11.5, color: "#B87A2B", fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>ADJ en priorité (contrat du club). Choisir Hertz seulement si ADJ n'est pas disponible.</div>
          <div style={{ display: "flex", gap: 8 }}>
            {LOUEURS.map((l) => {
              const on = loueur === l;
              return (
                <button key={l} onClick={() => setLoueur(l)} style={{
                  flex: 1, border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "10px 8px", fontWeight: 900, fontSize: 15,
                  background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                }}>{l}</button>
              );
            })}
          </div>
        </div>
      )}
      {mode === "Voitures des parents" && (
        <div style={{ marginBottom: 12 }}>
          <Field label="Nombre de voitures qui accompagnent"><Inp type="number" inputMode="numeric" value={nbVoitures} onChange={(e) => setNbVoitures(e.target.value)} placeholder="Ex : 4" /></Field>
          <Field label="Noms des parents qui conduisent"><Inp value={parents} onChange={(e) => setParents(e.target.value)} placeholder="Ex : Dupont, Martin, Diallo" /></Field>
        </div>
      )}
      <Field label="Précision (optionnel)"><Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="Horaire de départ, nombre de places..." /></Field>
    </Modal>
  );
}

function resumeTransport(x) {
  if (x.mode === "Minibus club") return `Minibus ${(x.minibus || []).join(", ") || "à préciser"}`;
  if (x.mode === "Bus en location") return `Bus en location ${x.loueur || ""}`.trim();
  if (x.mode === "Voitures des parents") return `Voitures des parents${x.nbVoitures ? ` (${x.nbVoitures})` : ""}${x.parents ? " : " + x.parents : ""}`;
  return x.mode || "Transport";
}

function Transports({ db, mutate, cat, onClose }) {
  const [nouveau, setNouveau] = useState(false);
  const [refus, setRefus] = useState(null);
  const [cause, setCause] = useState("");
  const liste = (db.transports || []).filter((x) => x.cat === cat).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  function creer(f) {
    mutate((d) => {
      d.transports = d.transports || [];
      d.transports.push({ ...f, id: uid(), cat, statut: "en_attente", cause: "", creeLe: new Date().toISOString() });
      return d;
    });
    setNouveau(false);
  }
  function repondre(item, accepte, causeTxt) {
    mutate((d) => {
      const x = (d.transports || []).find((y) => y.id === item.id);
      if (x) { x.statut = accepte ? "acceptee" : "refusee"; x.cause = accepte ? "" : (causeTxt || ""); }
      return d;
    });
    setRefus(null); setCause("");
  }
  function supprimer(id) {
    mutate((d) => { d.transports = (d.transports || []).filter((y) => y.id !== id); return d; });
  }

  return (
    <Modal title="Demandes de transport" onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => setNouveau(true)}><Plus size={16} /> Nouvelle demande</Btn>}>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Réserve le minibus ou le bus à l'avance, sans attendre que le match soit programmé.</div>
      {liste.length === 0 ? (
        <Empty icon={<Bus size={24} color={C.gris} />} text="Aucune demande de transport" sub="Touche Nouvelle demande pour réserver" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {liste.map((x) => (
            <Card key={x.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{x.date ? fmtDate(x.date) : "Date à définir"}{x.destination ? ` · ${x.destination}` : ""}</span>
                {x.statut === "acceptee" ? <Pastille bg="#E2F4E9" color={C.vert}>Acceptée</Pastille>
                  : x.statut === "refusee" ? <Pastille bg="#FBE3E3" color={C.rouge}>Refusée</Pastille>
                    : <Pastille bg={C.jaune} color={C.bleuNuit}>En attente</Pastille>}
              </div>
              <div style={{ fontWeight: 800 }}>{resumeTransport(x)}</div>
              {x.note ? <div style={{ fontSize: 13, color: C.gris, marginTop: 3 }}>{x.note}</div> : null}
              {x.statut === "refusee" && x.cause ? <div style={{ fontSize: 13, color: C.rouge, marginTop: 4 }}>Cause : {x.cause}</div> : null}
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                {x.statut === "en_attente" && (
                  <>
                    <Btn variant="accent" size="sm" onClick={() => repondre(x, true)}><Check size={15} /> Accepter</Btn>
                    <Btn variant="danger" size="sm" onClick={() => { setRefus(x); setCause(""); }}><X size={15} /> Refuser</Btn>
                  </>
                )}
                <Trash2 size={16} color={C.gris} style={{ cursor: "pointer", marginLeft: "auto" }} onClick={() => supprimer(x.id)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {nouveau && <FormTransport onClose={() => setNouveau(false)} onSubmit={creer} />}

      {refus && (
        <Modal title="Refuser la demande" onClose={() => setRefus(null)}
          footer={<Btn variant="danger" full disabled={!cause.trim()} onClick={() => repondre(refus, false, cause.trim())}><X size={16} /> Confirmer le refus</Btn>}>
          <div style={{ fontSize: 13, color: C.gris, marginBottom: 10 }}>Indique la cause du refus.</div>
          <Field label="Cause du refus">
            <Inp value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Minibus indisponible, déjà réservé..." />
          </Field>
        </Modal>
      )}
    </Modal>
  );
}


function OrganisationMatchs({ db, mutate, cat, peutValider, onClose }) {
  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState(null);
  const [roster, setRoster] = useState(false);
  const d0 = new Date();
  const todayStr = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  const aVenir = db.matches.filter((m) => m.cat === cat && (!m.date || m.date >= todayStr) && !(m.scorePour != null && m.scorePour !== "" && m.scoreContre != null && m.scoreContre !== ""))
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  function statutCourt(m) {
    const t = m.transport || {}, e = m.encadrement || {}, r = m.reservation || {};
    const parts = [];
    if (m.lieu === "Domicile") parts.push(r.statut === "validee" ? "Terrain validé" : r.statut === "refusee" ? "Terrain refusé" : "Terrain à valider");
    if (m.lieu === "Extérieur") parts.push(t.statut === "acceptee" ? "Transport accepté" : t.statut === "refusee" ? "Transport refusé" : t.mode ? "Transport en attente" : "Transport à définir");
    if (e.arbitre) parts.push("Arbitre désigné");
    return parts.join(" · ") || "À préparer";
  }

  return (
    <Modal title="Organisation des matchs" onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => setEdit({ cat, lieu: "Domicile", type: "Amical" })}><Plus size={16} /> Programmer un match</Btn>}>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Prépare en début de semaine : terrain, vestiaires, transport et encadrement. Ces informations sont transmises avant le match.</div>
      <Btn variant="ghost" full style={{ marginBottom: 14 }} onClick={() => setRoster(true)}><Edit3 size={16} /> Liste dirigeants, délégués, arbitres</Btn>
      {aVenir.length === 0 ? (
        <Empty icon={<CalendarDays size={24} color={C.gris} />} text="Aucun match à venir" sub="Programme une rencontre pour préparer son organisation" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {aVenir.map((m) => (
            <Card key={m.id} onClick={() => setSel(m)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{m.date ? fmtDate(m.date) : "Date à définir"} · {m.lieu}{m.type ? ` · ${m.type}` : ""}</span>
                <ChevronLeft size={16} color={C.gris} style={{ transform: "rotate(180deg)" }} />
              </div>
              <div style={{ fontWeight: 800 }}>{m.lieu === "Domicile" ? CLUB : (m.adversaire || "Adversaire")} <span style={{ color: C.gris, fontWeight: 600 }}>contre</span> {m.lieu === "Domicile" ? (m.adversaire || "Adversaire") : CLUB}</div>
              <div style={{ fontSize: 12.5, color: C.gris, marginTop: 3 }}>{statutCourt(m)}</div>
            </Card>
          ))}
        </div>
      )}

      {edit && <EditMatch match={edit} onClose={() => setEdit(null)} onSave={(m) => {
        mutate((d) => {
          if (m.id) { const i = d.matches.findIndex((x) => x.id === m.id); d.matches[i] = { ...d.matches[i], ...m }; }
          else d.matches.push({ ...m, id: uid(), buteurs: {}, passeurs: {}, tempsJeu: {}, notes: {} });
          return d;
        });
        setEdit(null);
      }} />}
      {sel && <OrgaMatch match={sel} db={db} mutate={mutate} peutValider={peutValider} onClose={() => setSel(null)} />}
      {roster && <RosterEncadrement db={db} mutate={mutate} onClose={() => setRoster(false)} />}
    </Modal>
  );
}

function Classement({ cat, db, mutate, onClose }) {
  const url = ((db.config && db.config.classement) || {})[cat] || "";
  const [editer, setEditer] = useState(!url);
  const [val, setVal] = useState(url);
  const [direct, setDirect] = useState((((db.config && db.config.classementDirect) || {})[cat]) || false);
  let niveau, siteSource;
  if (cat === "Ligue 2") { niveau = "Ligue 2 BKT (LFP)"; siteSource = "le site de la LFP (ligue2.fr)"; }
  else if (cat === "N2") { niveau = "National 2 (FFF)"; siteSource = "le site de la FFF (fff.fr)"; }
  else if (cat === "U17 NAT" || cat === "U19 NAT") { niveau = "Championnat National (FFF)"; siteSource = "le site de la FFF (fff.fr)"; }
  else if (cat === "U19F NAT") { niveau = "Championnat National U19 Féminin (FFF)"; siteSource = "le site de la FFF (fff.fr)"; }
  else if (cat === "SENIORS F") { niveau = "Championnat Séniors Féminines (FFF / Ligue)"; siteSource = "le site de la FFF ou de la Ligue (bfc.fff.fr)"; }
  else if (cat === "U18F") { niveau = "Ligue Bourgogne-Franche-Comté Féminin (régional)"; siteSource = "le site de la Ligue (bfc.fff.fr)"; }
  else if (cat === "U14" || cat === "U15") { niveau = "Ligue Bourgogne-Franche-Comté (régional)"; siteSource = "le site de la Ligue (bfc.fff.fr)"; }
  else if (cat === "U11F" || cat === "U13F" || cat === "U15F") { niveau = "District du Doubs Féminin"; siteSource = "le site du District du Doubs"; }
  else { niveau = "District du Doubs"; siteSource = "le site du District du Doubs"; }

  function enregistrer() {
    const u = val.trim();
    mutate((d) => {
      d.config = d.config || {};
      d.config.classement = d.config.classement || {};
      if (u) d.config.classement[cat] = u; else delete d.config.classement[cat];
      d.config.classementDirect = d.config.classementDirect || {};
      if (u && direct) d.config.classementDirect[cat] = true; else delete d.config.classementDirect[cat];
      return d;
    });
    setEditer(false);
  }

  return (
    <Modal title={`Classement ${cat}`} onClose={onClose}
      footer={url && !editer
        ? <Btn variant="ghost" full onClick={() => { setVal(url); setEditer(true); }}><Edit3 size={16} /> Modifier le lien</Btn>
        : <Btn variant="accent" full disabled={!val.trim()} onClick={enregistrer}><Save size={16} /> Enregistrer</Btn>}>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Compétition suivie au niveau : <strong style={{ color: C.bleu }}>{niveau}</strong></div>

      {editer || !url ? (
        <>
          <div style={{ fontSize: 13, color: C.encre, background: "#F4F7FB", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 1.5 }}>
            Pour obtenir le lien : sur {siteSource}, ouvre la compétition de la catégorie {cat}, puis le classement de ta poule, et copie le lien de partage du widget « score en direct » (adresse du type fff.fr/score-en-direct/...). Colle-le ci-dessous : le classement et les résultats du groupe s'afficheront en direct.
          </div>
          <Field label="Lien du classement (widget FFF)">
            <Inp value={val} onChange={(e) => setVal(e.target.value)} placeholder="https://www.fff.fr/score-en-direct/..." />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 0 12px", fontSize: 13, color: C.encre, cursor: "pointer" }}>
            <input type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} style={{ width: 17, height: 17 }} />
            Ouvrir directement dans le navigateur (utile si le tableau ne s'affiche pas ici)
          </label>
          {url && <Btn variant="ghost" size="sm" onClick={() => setEditer(false)}>Annuler</Btn>}
        </>
      ) : direct ? (
        <>
          <div style={{ fontSize: 13, color: C.encre, background: "#F4F7FB", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: 12, marginBottom: 12, lineHeight: 1.5 }}>Le classement de cette catégorie s'ouvre directement dans le navigateur. Il vient de s'ouvrir dans un onglet. Touche le bouton ci-dessous pour le rouvrir.</div>
          <Btn variant="accent" full onClick={() => window.open(url, "_blank", "noopener")}><ExternalLink size={16} /> Ouvrir le classement</Btn>
        </>
      ) : (
        <>
          <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.grisClair}`, background: "#fff", marginBottom: 10 }}>
            <iframe src={url} title={`Classement ${cat}`} style={{ width: "100%", height: 520, border: "none", display: "block" }} />
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.bleu, textDecoration: "none" }}>
            <ExternalLink size={15} /> Ouvrir dans le navigateur
          </a>
          <div style={{ fontSize: 11.5, color: C.gris, marginTop: 8 }}>Si rien ne s'affiche ci-dessus, la page n'autorise pas l'intégration : utilise « Ouvrir dans le navigateur », ou colle plutôt un lien de widget « score en direct ».</div>
        </>
      )}
    </Modal>
  );
}


function normDemande(r) {
  return {
    id: r.id, demandeurCat: r.demandeur_cat, demandeurNom: r.demandeur_nom || "",
    joueurId: r.joueur_id, joueurNom: r.joueur_nom, joueurCat: r.joueur_cat,
    date: r.date_match, motif: r.motif, statut: r.statut, cause: r.cause_refus || "", creeLe: r.cree_le,
  };
}

function StatutPastille({ statut }) {
  if (statut === "acceptee") return <Pastille bg="#E2F4E9" color={C.vert}>Acceptée</Pastille>;
  if (statut === "refusee") return <Pastille bg="#FBE3E3" color={C.rouge}>Refusée</Pastille>;
  return <Pastille bg={C.jaune} color={C.bleuNuit}>En attente</Pastille>;
}

function FormDemande({ annuaire, onSubmit, onClose }) {
  const catsCible = [...new Set(annuaire.map((a) => a.cat))];
  const [catCible, setCatCible] = useState(catsCible[0] || "");
  const [joueurId, setJoueurId] = useState("");
  const [date, setDate] = useState("");
  const [motif, setMotif] = useState("");
  const joueurs = annuaire.filter((a) => a.cat === catCible);
  const joueur = annuaire.find((a) => a.joueurId === joueurId);
  return (
    <Modal title="Nouvelle demande de joueur" onClose={onClose}
      footer={<Btn variant="accent" full disabled={!joueur} onClick={() => joueur && onSubmit({ joueur, date, motif })}><Send size={16} /> Envoyer la demande</Btn>}>
      {catsCible.length === 0 ? (
        <Empty icon={<Users size={24} color={C.gris} />} text="Aucun joueur dans les autres catégories" sub="Les effectifs des autres catégories apparaîtront ici" />
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>L'éducateur de la catégorie concernée recevra la demande par email, avec le responsable pré-formation en copie, et pourra l'accepter ou la refuser.</div>
          <Field label="Catégorie du joueur">
            <Sel value={catCible} onChange={(e) => { setCatCible(e.target.value); setJoueurId(""); }}>
              {catsCible.map((c) => <option key={c}>{c}</option>)}
            </Sel>
          </Field>
          <Field label="Joueur demandé">
            <Sel value={joueurId} onChange={(e) => setJoueurId(e.target.value)}>
              <option value="">Choisir un joueur</option>
              {joueurs.map((j) => <option key={j.joueurId} value={j.joueurId}>{j.prenom} {j.nom}{j.poste ? ` (${j.poste})` : ""}</option>)}
            </Sel>
          </Field>
          <Field label="Date du match ou de la séance"><Inp type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Motif (optionnel)"><Inp value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Effectif incomplet, surclassement..." /></Field>
        </>
      )}
    </Modal>
  );
}

function Demandes({ demo, db, mutate, cat, session, onClose }) {
  const [onglet, setOnglet] = useState("recues");
  const [nouveau, setNouveau] = useState(false);
  const [remoteList, setRemoteList] = useState([]);
  const [annuaireRemote, setAnnuaireRemote] = useState([]);
  const [loading, setLoading] = useState(!demo);
  const [err, setErr] = useState(null);
  const [refus, setRefus] = useState(null);
  const [cause, setCause] = useState("");
  const [confirmSuppr, setConfirmSuppr] = useState(null);

  async function charger() {
    if (demo) return;
    setLoading(true); setErr(null);
    try {
      const sb = await getSupabase();
      const [{ data: ann }, { data: lst, error }] = await Promise.all([
        sb.rpc("annuaire_joueurs"),
        sb.from("demandes_joueur").select("*").order("cree_le", { ascending: false }),
      ]);
      if (error) throw error;
      setAnnuaireRemote(ann || []);
      setRemoteList(lst || []);
    } catch (e) {
      setErr("Service de demandes indisponible. Installe la partie serveur (table demandes_joueur, fonction annuaire_joueurs et fonction email) dans Supabase.");
    } finally { setLoading(false); }
  }
  useEffect(() => { charger(); }, []);

  const liste = demo ? (db.demandes || []) : remoteList.map(normDemande);
  const recues = liste.filter((x) => x.joueurCat === cat);
  const envoyees = liste.filter((x) => x.demandeurCat === cat);
  const nbAttente = recues.filter((x) => x.statut === "en_attente").length;

  const voisins = voisinsDemandables(cat);
  const annuaire = demo
    ? db.players.filter((p) => voisins.includes(p.cat)).map((p) => ({ joueurId: p.id, prenom: p.prenom, nom: p.nom, poste: p.poste, cat: p.cat }))
    : annuaireRemote.filter((a) => voisins.includes(a.categorie)).map((a) => ({ joueurId: a.joueur_id, prenom: a.prenom, nom: a.nom, poste: a.poste, cat: a.categorie }));

  async function creer({ joueur, date, motif }) {
    if (demo) {
      mutate((d) => {
        d.demandes = d.demandes || [];
        d.demandes.push({
          id: uid(), demandeurCat: cat, demandeurNom: "Éducateur (essai)",
          joueurId: joueur.joueurId, joueurNom: `${joueur.prenom} ${joueur.nom}`, joueurCat: joueur.cat,
          date: date || null, motif: motif || "", statut: "en_attente", cause: "", creeLe: new Date().toISOString(),
        });
        return d;
      });
    } else {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb.from("demandes_joueur").insert({
          demandeur_cat: cat, joueur_id: joueur.joueurId, joueur_nom: `${joueur.prenom} ${joueur.nom}`,
          joueur_cat: joueur.cat, date_match: date || null, motif: motif || "",
        }).select().maybeSingle();
        if (error) throw error;
        try { await sb.functions.invoke("notifier-demande", { body: { demande_id: data.id } }); } catch (e) {}
        await charger();
      } catch (e) { setErr("Envoi impossible. La partie serveur est requise pour les demandes entre catégories."); }
    }
    setNouveau(false);
    setOnglet("envoyees");
  }

  async function repondre(dem, accepte, causeTxt) {
    if (demo) {
      mutate((d) => {
        const x = (d.demandes || []).find((y) => y.id === dem.id);
        if (x) { x.statut = accepte ? "acceptee" : "refusee"; x.cause = accepte ? "" : (causeTxt || ""); x.traiteLe = new Date().toISOString(); }
        return d;
      });
    } else {
      try {
        const sb = await getSupabase();
        const { error } = await sb.from("demandes_joueur").update({
          statut: accepte ? "acceptee" : "refusee", cause_refus: accepte ? null : (causeTxt || ""), traite_le: new Date().toISOString(),
        }).eq("id", dem.id);
        if (error) throw error;
        try { await sb.functions.invoke("notifier-demande", { body: { demande_id: dem.id, reponse: true } }); } catch (e) {}
        await charger();
      } catch (e) { setErr("Réponse impossible. La partie serveur est requise."); }
    }
    setRefus(null); setCause("");
  }

  async function supprimer(dem) {
    if (demo) {
      mutate((d) => { d.demandes = (d.demandes || []).filter((x) => x.id !== dem.id); return d; });
      setConfirmSuppr(null);
      return;
    }
    try {
      const sb = await getSupabase();
      const { data, error } = await sb.from("demandes_joueur").delete().eq("id", dem.id).select();
      if (error) throw error;
      setConfirmSuppr(null);
      if (!data || data.length === 0) { setErr("Suppression bloquée par les droits de la base. Il faut autoriser la suppression des demandes dans Supabase."); return; }
      await charger();
    } catch (e) { setConfirmSuppr(null); setErr("Suppression impossible. Réessaie ou vérifie la connexion."); }
  }

  function ligneDemande(dem, recue) {
    return (
      <Card key={dem.id} style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>
            {recue ? `Demandé par ${dem.demandeurCat}` : `Vers ${dem.joueurCat}`}{dem.date ? ` · ${fmtDate(dem.date)}` : ""}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatutPastille statut={dem.statut} />
            <Trash2 size={15} color={C.gris} style={{ cursor: "pointer" }} onClick={() => setConfirmSuppr(dem)} />
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{dem.joueurNom} <span style={{ color: C.gris, fontWeight: 600, fontSize: 13 }}>({dem.joueurCat})</span></div>
        {dem.motif ? <div style={{ fontSize: 13, color: C.gris, marginTop: 3 }}>Motif : {dem.motif}</div> : null}
        {dem.statut === "refusee" && dem.cause ? <div style={{ fontSize: 13, color: C.rouge, marginTop: 4 }}>Cause du refus : {dem.cause}</div> : null}
        {recue && dem.statut === "en_attente" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn variant="accent" size="sm" onClick={() => repondre(dem, true)}><Check size={15} /> Accepter</Btn>
            <Btn variant="danger" size="sm" onClick={() => { setRefus(dem); setCause(""); }}><X size={15} /> Refuser</Btn>
          </div>
        )}
      </Card>
    );
  }

  const data = onglet === "recues" ? recues : envoyees;

  return (
    <Modal title="Demandes de joueurs" onClose={onClose}
      footer={<Btn variant="accent" full disabled={annuaire.length === 0} onClick={() => setNouveau(true)}><Plus size={16} /> Nouvelle demande</Btn>}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button onClick={() => setOnglet("recues")} style={{
          flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "10px 8px", fontWeight: 800, fontSize: 13.5,
          background: onglet === "recues" ? C.bleu : "#fff", color: onglet === "recues" ? "#fff" : C.gris, boxShadow: "0 1px 3px rgba(10,42,107,0.08)",
        }}>Reçues{nbAttente > 0 ? ` (${nbAttente})` : ""}</button>
        <button onClick={() => setOnglet("envoyees")} style={{
          flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "10px 8px", fontWeight: 800, fontSize: 13.5,
          background: onglet === "envoyees" ? C.bleu : "#fff", color: onglet === "envoyees" ? "#fff" : C.gris, boxShadow: "0 1px 3px rgba(10,42,107,0.08)",
        }}>Envoyées</button>
      </div>

      {err ? <div style={{ fontSize: 12.5, color: C.rouge, background: "#FFF6F6", border: "1px solid #F3C9C9", borderRadius: 10, padding: 10, marginBottom: 12 }}>{err}</div> : null}

      {loading ? (
        <div style={{ fontSize: 13, color: C.gris, padding: 14, textAlign: "center" }}>Chargement...</div>
      ) : data.length === 0 ? (
        <Empty icon={<Inbox size={24} color={C.gris} />} text={onglet === "recues" ? "Aucune demande reçue" : "Aucune demande envoyée"} sub={onglet === "recues" ? `Pour la catégorie ${cat}` : "Touche Nouvelle demande pour en créer une"} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {data.map((dem) => ligneDemande(dem, onglet === "recues"))}
        </div>
      )}

      {nouveau && <FormDemande annuaire={annuaire} onClose={() => setNouveau(false)} onSubmit={creer} />}

      {refus && (
        <Modal title="Refuser la demande" onClose={() => setRefus(null)}
          footer={<Btn variant="danger" full disabled={!cause.trim()} onClick={() => repondre(refus, false, cause.trim())}><X size={16} /> Confirmer le refus</Btn>}>
          <div style={{ fontSize: 13, color: C.gris, marginBottom: 10 }}>Indique la cause du refus pour {refus.joueurNom}. Elle sera transmise à l'éducateur demandeur.</div>
          <Field label="Cause du refus">
            <textarea value={cause} onChange={(e) => setCause(e.target.value)} rows={3} placeholder="Joueur déjà convoqué, retour de blessure, repos..." style={{
              width: "100%", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: 11, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
            }} />
          </Field>
        </Modal>
      )}

      {confirmSuppr && (
        <Modal title="Supprimer la demande" onClose={() => setConfirmSuppr(null)}
          footer={<><Btn variant="ghost" full onClick={() => setConfirmSuppr(null)}>Annuler</Btn><Btn variant="danger" full onClick={() => supprimer(confirmSuppr)}><Trash2 size={16} /> Supprimer</Btn></>}>
          <div style={{ fontSize: 14, color: C.encre, lineHeight: 1.5 }}>Supprimer définitivement la demande concernant <strong>{confirmSuppr.joueurNom}</strong> ? Cette action est irréversible.</div>
        </Modal>
      )}
    </Modal>
  );
}


/* ============================================================
   Identité visuelle FC Sochaux-Montbéliard
   ============================================================ */
const C = {
  bleu: "#1A3553",
  bleuNuit: "#0E1E33",
  jaune: "#C6A24C",
  jauneFonce: "#9C7C2E",
  fond: "#F4F5F7",
  carte: "#FFFFFF",
  encre: "#16202E",
  gris: "#6B7682",
  grisClair: "#E6E9EE",
  vert: "#3F7D5A",
  rouge: "#B5483F",
  pelouse1: "#2F6B43",
  pelouse2: "#275B39",
};
const CLUB = "SOCHAUX";
const LOGO_CLUB = "data:image/png;base64,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";
const CLUB_LONG = "FC SOCHAUX-MONTBÉLIARD";

/* ============================================================
   Données de référence
   ============================================================ */
const GROUPES = ["École de foot", "Pré-formation", "Formation", "PRO", "Loisirs", "Féminines", "Foot santé"];
function secteurLabel(cat) {
  const ci = CATEGORIES.find((x) => x.id === cat);
  const g = ci ? ci.groupe : "";
  if (g === "Pré-formation") return "Préformation";
  if (g === "Formation") return "Formation";
  if (g === "PRO") return "Professionnel";
  if (g === "Loisirs") return "Foot loisirs";
  if (g === "Foot santé") return "Foot santé";
  if (g === "Féminines") return cat;
  return "École de foot";
}
function maxNumero(cat) {
  const ci = CATEGORIES.find((x) => x.id === cat);
  const g = ci ? ci.groupe : "";
  return (g === "Formation" || g === "PRO") ? 99 : 16;
}
function jonglagesActifs(cat) {
  const ci = CATEGORIES.find((x) => x.id === cat);
  if (!ci) return false;
  if (ci.groupe === "École de foot") return true;
  const m = /^U(\d+)F$/.exec(cat || "");
  if (m && +m[1] <= 13) return true;
  return false;
}
const CATEGORIES = [
  { id: "U7", type: 4, groupe: "École de foot" }, { id: "U8", type: 5, groupe: "École de foot" }, { id: "U9", type: 8, groupe: "École de foot" },
  { id: "U10", type: 8, groupe: "École de foot" }, { id: "U11", type: 8, groupe: "École de foot" }, { id: "U12", type: 8, groupe: "École de foot" },
  { id: "U13", type: 8, groupe: "École de foot" },
  { id: "U14", type: 11, groupe: "Pré-formation" }, { id: "U15", type: 11, groupe: "Pré-formation" },
  { id: "6e/5e", type: 8, college: "Collège Hautes Vignes", groupe: "École de foot" },
  { id: "4e/3e", type: 8, college: "Collège Hautes Vignes", groupe: "Pré-formation" },
  { id: "U17 NAT", type: 11, groupe: "Formation" }, { id: "U19 NAT", type: 11, groupe: "Formation" },
  { id: "N2", type: 11, groupe: "Formation" }, { id: "Ligue 2", type: 11, groupe: "PRO" },
  { id: "Foot loisirs", type: 11, groupe: "Loisirs" },
  { id: "U11F", type: 8, groupe: "Féminines" }, { id: "U13F", type: 8, groupe: "Féminines" }, { id: "U15F", type: 11, groupe: "Féminines" },
  { id: "U18F", type: 11, groupe: "Féminines" }, { id: "U19F NAT", type: 11, groupe: "Féminines" }, { id: "SENIORS F", type: 11, groupe: "Féminines" },
  { id: "Foot santé", type: 6, groupe: "Foot santé" },
];

// Catégories qu'une catégorie peut demander (joueur surclassé de deux ans en dessous)
const VOISINS_SPECIAUX = {
  "U17 NAT": ["U15"],
  "U19 NAT": ["U17 NAT"],
  "N2": ["U19 NAT"],
  "Ligue 2": ["N2"],
  "U18F": ["U15F"],
  "U19F NAT": ["U18F"],
  "SENIORS F": ["U19F NAT"],
  "4e/3e": ["6e/5e"],
};
function voisinsDemandables(cat) {
  const ci = CATEGORIES.find((x) => x.id === cat);
  const cibles = new Set();
  // Formation et professionnels : surclassement libre entre U17 NAT, U19 NAT, N2 et Ligue 2
  if (ci && (ci.groupe === "Formation" || ci.groupe === "PRO")) {
    CATEGORIES.forEach((x) => { if ((x.groupe === "Formation" || x.groupe === "PRO") && x.id !== cat) cibles.add(x.id); });
  }
  // voisins spéciaux (ex : U17 NAT peut aussi faire monter un U15)
  if (VOISINS_SPECIAUX[cat]) VOISINS_SPECIAUX[cat].forEach((v) => cibles.add(v));
  // règle générale par âge pour les jeunes (deux ans en dessous)
  if (cibles.size === 0) {
    const m = /^U(\d+)(F?)$/.exec(cat || "");
    if (m) { const cible = `U${+m[1] - 2}${m[2]}`; if (CATEGORIES.some((x) => x.id === cible)) cibles.add(cible); }
  }
  return [...cibles];
}

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant",
];

// slots : x et y en pourcentage, gardien en bas
const FORMATIONS = {
  4: {
    "2-1": [
      { l: "G", x: 50, y: 88 },
      { l: "DG", x: 30, y: 62 }, { l: "DD", x: 70, y: 62 },
      { l: "AT", x: 50, y: 26 },
    ],
    "1-2": [
      { l: "G", x: 50, y: 88 },
      { l: "DC", x: 50, y: 64 },
      { l: "AG", x: 30, y: 28 }, { l: "AD", x: 70, y: 28 },
    ],
  },
  5: {
    "2-1-1": [
      { l: "G", x: 50, y: 89 },
      { l: "DG", x: 30, y: 66 }, { l: "DD", x: 70, y: 66 },
      { l: "MC", x: 50, y: 44 },
      { l: "AT", x: 50, y: 20 },
    ],
    "2-2": [
      { l: "G", x: 50, y: 89 },
      { l: "DG", x: 30, y: 64 }, { l: "DD", x: 70, y: 64 },
      { l: "AG", x: 30, y: 26 }, { l: "AD", x: 70, y: 26 },
    ],
    "1-2-1": [
      { l: "G", x: 50, y: 89 },
      { l: "DC", x: 50, y: 68 },
      { l: "MG", x: 28, y: 45 }, { l: "MD", x: 72, y: 45 },
      { l: "AT", x: 50, y: 20 },
    ],
  },
  6: {
    "2-1-2": [
      { l: "G", x: 50, y: 90 },
      { l: "DG", x: 30, y: 68 }, { l: "DD", x: 70, y: 68 },
      { l: "MC", x: 50, y: 46 },
      { l: "AG", x: 32, y: 22 }, { l: "AD", x: 68, y: 22 },
    ],
    "2-2-1": [
      { l: "G", x: 50, y: 90 },
      { l: "DG", x: 30, y: 70 }, { l: "DD", x: 70, y: 70 },
      { l: "MG", x: 32, y: 46 }, { l: "MD", x: 68, y: 46 },
      { l: "AT", x: 50, y: 20 },
    ],
    "1-2-2": [
      { l: "G", x: 50, y: 90 },
      { l: "DC", x: 50, y: 70 },
      { l: "MG", x: 30, y: 47 }, { l: "MD", x: 70, y: 47 },
      { l: "AG", x: 32, y: 22 }, { l: "AD", x: 68, y: 22 },
    ],
  },
  8: {
    "3-3-1": [
      { l: "G", x: 50, y: 90 },
      { l: "DG", x: 16, y: 72 }, { l: "DC", x: 50, y: 72 }, { l: "DD", x: 84, y: 72 },
      { l: "MG", x: 34, y: 53 }, { l: "MD", x: 66, y: 53 }, { l: "MC", x: 50, y: 34 },
      { l: "AT", x: 50, y: 12 },
    ],
    "2-4-1": [
      { l: "G", x: 50, y: 90 },
      { l: "DG", x: 35, y: 71 }, { l: "DD", x: 65, y: 71 },
      { l: "MG", x: 15, y: 45 }, { l: "MIG", x: 39, y: 43 }, { l: "MID", x: 61, y: 43 }, { l: "MD", x: 85, y: 45 },
      { l: "AT", x: 50, y: 15 },
    ],
  },
  9: {
    "3-3-2": [
      { l: "G", x: 50, y: 91 },
      { l: "DG", x: 24, y: 74 }, { l: "DC", x: 50, y: 77 }, { l: "DD", x: 76, y: 74 },
      { l: "MG", x: 26, y: 52 }, { l: "MC", x: 50, y: 42 }, { l: "MD", x: 74, y: 52 },
      { l: "AG", x: 36, y: 20 }, { l: "AD", x: 64, y: 20 },
    ],
    "4-3-1": [
      { l: "G", x: 50, y: 91 },
      { l: "DG", x: 16, y: 74 }, { l: "DCG", x: 39, y: 77 }, { l: "DCD", x: 61, y: 77 }, { l: "DD", x: 84, y: 74 },
      { l: "MG", x: 26, y: 52 }, { l: "MC", x: 50, y: 42 }, { l: "MD", x: 74, y: 52 },
      { l: "AT", x: 50, y: 18 },
    ],
  },
  10: {
    "1-4-3-2": [
      { l: "G", x: 50, y: 92 },
      { l: "DG", x: 16, y: 73 }, { l: "DCG", x: 39, y: 76 }, { l: "DCD", x: 61, y: 76 }, { l: "DD", x: 84, y: 73 },
      { l: "MG", x: 28, y: 52 }, { l: "MC", x: 50, y: 37 }, { l: "MD", x: 72, y: 52 },
      { l: "AG", x: 35, y: 18 }, { l: "AD", x: 65, y: 18 },
    ],
    "1-4-2-3": [
      { l: "G", x: 50, y: 92 },
      { l: "DG", x: 16, y: 73 }, { l: "DCG", x: 39, y: 76 }, { l: "DCD", x: 61, y: 76 }, { l: "DD", x: 84, y: 73 },
      { l: "MC", x: 38, y: 52 }, { l: "MC", x: 62, y: 52 },
      { l: "AG", x: 28, y: 37 }, { l: "AC", x: 50, y: 22 }, { l: "AD", x: 72, y: 37 },
    ],
  },
  11: {
    "4-2-3-1": [
      { l: "G", x: 50, y: 92 },
      { l: "DG", x: 16, y: 73 }, { l: "DCG", x: 39, y: 76 }, { l: "DCD", x: 61, y: 76 }, { l: "DD", x: 84, y: 73 },
      { l: "MDC", x: 38, y: 56 }, { l: "MDC", x: 62, y: 56 },
      { l: "MOG", x: 20, y: 33 }, { l: "MOC", x: 50, y: 31 }, { l: "MOD", x: 80, y: 33 },
      { l: "AT", x: 50, y: 12 },
    ],
    "4-3-3": [
      { l: "G", x: 50, y: 92 },
      { l: "DG", x: 16, y: 73 }, { l: "DCG", x: 39, y: 76 }, { l: "DCD", x: 61, y: 76 }, { l: "DD", x: 84, y: 73 },
      { l: "MG", x: 28, y: 52 }, { l: "MC", x: 50, y: 36 }, { l: "MD", x: 72, y: 52 },
      { l: "AG", x: 21, y: 21 }, { l: "AC", x: 50, y: 14 }, { l: "AD", x: 79, y: 21 },
    ],
  },
};

const AXES = [
  { k: "mental", label: "Mental" },
  { k: "technique", label: "Technique" },
  { k: "tactique", label: "Tactique" },
  { k: "athletique", label: "Athlétique" },
];

const TYPES_MATCH = ["Championnat", "Coupe", "Amical", "Plateau", "Tournoi"];

const MINIBUS = ["T2", "T3", "T4", "T5"];
const MODES_TRANSPORT = ["Minibus club", "Bus en location", "Bus de voyage des pros", "Voitures des parents"];
const LOUEURS = ["ADJ", "Hertz"];
const ROLES_ENCADREMENT = ["Éducateur", "Coach des gardiens", "Préparateur physique", "Dirigeant", "Délégué", "Arbitre"];

const TERRAINS = ["Synthétique centre", "Synthétique dôme", "Herbe centre (nouveau synthétique)", "Herbe villa"];
const VESTIAIRES = ["1", "2", "3", "4", "5", "Villa 1", "Villa 2"];
const PLANNING_HEBDO = [
  { section: "Section garçons", lignes: [
    { cat: "Préformation U15-U14", creneaux: [["Lundi", "Dôme", "17h00-18h30"], ["Mardi", "Synthé centre", "16h00-17h30"], ["Mercredi", "Synthé centre", "14h00-16h00"], ["Jeudi", "Synthé centre", "16h00-17h30"], ["Vendredi", "Synthé centre", "16h00-17h30"]] },
    { cat: "U13-U12", creneaux: [["Lundi", "Synthé centre", "18h00-19h30"], ["Mardi", "Synthé centre", "18h00-19h30"], ["Jeudi", "Synthé centre", "18h00-19h30"]] },
    { cat: "U11-U10", creneaux: [["Mardi", "Dôme", "18h00-19h30"], ["Mercredi", "Synthé centre", "17h30-19h00"], ["Vendredi", "Synthé centre", "17h30-19h00"]] },
    { cat: "U9", creneaux: [["Lundi", "Dôme", "18h30-20h00"], ["Mercredi", "Dôme", "18h00-19h30"], ["Jeudi", "Dôme", "18h00-19h30"]] },
    { cat: "U8", creneaux: [["Lundi", "Synthé centre", "18h00-19h30"], ["Jeudi", "Dôme", "18h00-19h30"]] },
    { cat: "U7", creneaux: [["Lundi", "Synthé centre", "17h30-19h00"], ["Mercredi", "Dôme", "16h30-18h00"]] },
    { cat: "Spécifique gardiens", creneaux: [["Mercredi", "Dôme", "15h00-16h30"]] },
  ]},
  { section: "Section féminines", lignes: [
    { cat: "Seniors F", creneaux: [["Lundi", "Synthé centre", "19h30-20h30"], ["Mercredi", "Synthé centre", "19h00-20h30"], ["Vendredi", "Synthé centre", "19h00-20h30"]] },
    { cat: "U18F", creneaux: [["Lundi", "Synthé centre", "19h30-20h30"], ["Mercredi", "Synthé centre", "16h00-17h30"], ["Vendredi", "Synthé centre", "19h00-20h30"]] },
    { cat: "U15F", creneaux: [["Mercredi", "Dôme", "18h00-19h30"], ["Vendredi", "Dôme", "18h15-19h45"]] },
    { cat: "U13F", creneaux: [["Mercredi", "Pouges", "18h00-19h30"], ["Vendredi", "Dôme", "17h30-19h00"]] },
    { cat: "U11F", creneaux: [["Mercredi", "Pouges", "10h00-11h30"], ["Vendredi", "Dôme", "17h30-19h00"]] },
    { cat: "Spécifique gardiennes", creneaux: [["Mercredi", "Dôme", "13h30-15h00"]] },
  ]},
];

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const THEMES = [
  { groupe: "Technique", items: ["Conduite de balle", "Passes et contrôles", "Jonglages", "Finition", "Jeu de tête", "Dribble"] },
  { groupe: "Tactique", items: ["Conservation", "Transitions", "Pressing", "Animation offensive", "Animation défensive", "Jeu en supériorité"] },
  { groupe: "Athlétique", items: ["Vitesse", "Coordination et motricité", "Endurance", "Renforcement", "Agilité"] },
  { groupe: "Gardien", items: ["Prises de balle", "Plongeons", "Jeu au pied", "Relance"] },
  { groupe: "Match", items: ["Jeu réduit", "Opposition", "Match à thème", "Préparation de match"] },
];

const VACANCES = [
  { id: "tou25", nom: "Toussaint", debut: "2025-10-18", reprise: "2025-11-03" },
  { id: "noe25", nom: "Noël", debut: "2025-12-20", reprise: "2026-01-05" },
  { id: "hiv26", nom: "Hiver", debut: "2026-02-07", reprise: "2026-02-23" },
  { id: "pri26", nom: "Printemps", debut: "2026-04-04", reprise: "2026-04-20" },
  { id: "asc26", nom: "Pont de l'Ascension", debut: "2026-05-13", reprise: "2026-05-18", court: true },
  { id: "ete26", nom: "Été", debut: "2026-07-04", reprise: "2026-09-01", full: true },
  { id: "tou26", nom: "Toussaint", debut: "2026-10-17", reprise: "2026-11-02" },
  { id: "noe26", nom: "Noël", debut: "2026-12-19", reprise: "2027-01-04" },
  { id: "hiv27", nom: "Hiver", debut: "2027-02-13", reprise: "2027-03-01" },
  { id: "pri27", nom: "Printemps", debut: "2027-04-10", reprise: "2027-04-26" },
  { id: "asc27", nom: "Pont de l'Ascension", debut: "2027-05-05", reprise: "2027-05-10", court: true },
  { id: "ete27", nom: "Été", debut: "2027-07-03", reprise: "2027-09-01", full: true },
];

const pad = (n) => String(n).padStart(2, "0");
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dateStr = (y, mi, d) => `${y}-${pad(mi + 1)}-${pad(d)}`;
const daysInMonth = (y, mi) => new Date(y, mi + 1, 0).getDate();
const dowOf = (y, mi, d) => new Date(y, mi, d).getDay();
const minStr = (a, b) => (a < b ? a : b);
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function holidayOf(s, breaks) {
  for (const h of VACANCES) {
    if (s >= h.debut && s < h.reprise) {
      if (h.full || h.court) return { ...h, arret: true };
      const w = (breaks && breaks[h.id]) || 2;
      const fin = minStr(h.reprise, addDays(h.debut, w * 7));
      return { ...h, arret: s < fin };
    }
  }
  return null;
}
const capit = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const jourLong = (iso) => capit(new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
const jjmm = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

/* ============================================================
   Connexion Supabase (base sécurisée du club)
   ============================================================ */
const SUPABASE_URL = "https://hehdquwbwtzublrscmnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaGRxdXdid3R6dWJscnNjbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzk1MzcsImV4cCI6MjA5ODE1NTUzN30.NWpByCcwWQUMxxzG2n-EaC9-8HnjBIUjSIkkDxf1Zk0";

const EMPTY_DB = { players: [], matches: [], trainings: [], injuries: [], scouting: [], lineups: {}, demandes: [], encadrement: [], transports: [], reunions: [], tournois: [], acces: [], planning: { vestiaires: {}, terrains: {} }, config: { trainingDays: {}, breaks: {}, classement: {} } };

const estConfigure = () => SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("VOTRE-PROJET");

let _sbPromise = null;
function getSupabase() {
  if (!_sbPromise) {
    _sbPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }));
  }
  return _sbPromise;
}

async function loadCat(cat) {
  const sb = await getSupabase();
  const { data, error } = await sb.from("categorie_data").select("data").eq("categorie", cat).maybeSingle();
  if (error) throw error;
  return (data && data.data) ? { ...EMPTY_DB, ...data.data } : { ...EMPTY_DB };
}
async function saveCat(cat, blob, userId) {
  const sb = await getSupabase();
  const { error } = await sb.from("categorie_data").upsert({ categorie: cat, data: blob, maj_le: new Date().toISOString(), maj_par: userId });
  if (error) throw error;
}
async function loadReunions() {
  const sb = await getSupabase();
  const { data, error } = await sb.from("club_reunions").select("data").eq("id", 1).maybeSingle();
  if (error) throw error;
  return (data && data.data && Array.isArray(data.data.reunions)) ? data.data.reunions : [];
}
async function saveReunions(reunions) {
  const sb = await getSupabase();
  const { error } = await sb.from("club_reunions").upsert({ id: 1, data: { reunions } });
  if (error) throw error;
}

const DEMO_KEY = "fcsm-demo-db";
async function loadLocal() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(DEMO_KEY, false);
      if (r && r.value) return { ...EMPTY_DB, ...JSON.parse(r.value) };
    }
  } catch (e) { /* premier lancement */ }
  return { ...EMPTY_DB };
}
async function saveLocal(db) {
  try { if (typeof window !== "undefined" && window.storage) await window.storage.set(DEMO_KEY, JSON.stringify(db), false); }
  catch (e) { /* indisponible */ }
}

const uid = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);


/* ============================================================
   Petits composants d'interface
   ============================================================ */
function Btn({ children, onClick, variant = "primary", size = "md", style, type, full, disabled }) {
  const base = {
    border: "none", borderRadius: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "filter .15s", width: full ? "100%" : undefined, opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: "7px 12px", fontSize: 13 }, md: { padding: "11px 16px", fontSize: 14 } };
  const variants = {
    primary: { background: C.bleu, color: "#fff" },
    accent: { background: C.jaune, color: C.bleuNuit },
    ghost: { background: C.grisClair, color: C.encre },
    danger: { background: "#FBE3E3", color: C.rouge },
  };
  return (
    <button type={type || "button"} onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseOver={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(0.94)"; }}
      onMouseOut={(e) => (e.currentTarget.style.filter = "none")}>
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.carte, borderRadius: 16, padding: 16,
      boxShadow: "0 1px 3px rgba(10,42,107,0.08)", border: `1px solid ${C.grisClair}`,
      cursor: onClick ? "pointer" : "default", ...style,
    }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${C.grisClair}`, fontSize: 15, color: C.encre,
  background: "#fff", boxSizing: "border-box", outline: "none",
};
function Inp(props) { return <input {...props} style={{ ...inputStyle, ...props.style }} />; }
function Sel({ children, ...props }) { return <select {...props} style={{ ...inputStyle, ...props.style }}>{children}</select>; }

function Modal({ title, onClose, children, footer }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(6,24,74,0.55)", zIndex: 50,
      display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.fond, width: "100%", maxWidth: 560, maxHeight: "92vh",
        borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ background: C.bleu, color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ fontSize: 16 }}>{title}</strong>
          <X size={22} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ padding: 18, overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: 14, borderTop: `1px solid ${C.grisClair}`, background: "#fff", display: "flex", gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}

function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: C.gris }}>
      <div style={{ display: "inline-flex", padding: 16, borderRadius: 50, background: C.grisClair, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: C.encre }}>{text}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Pastille({ children, bg, color }) {
  return <span style={{ background: bg, color, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>{children}</span>;
}

function initials(p) {
  return ((p.prenom?.[0] || "") + (p.nom?.[0] || "")).toUpperCase() || "?";
}
function ageOf(dob) {
  if (!dob) return null;
  const d = new Date(String(dob).length === 10 ? dob + "T00:00:00" : dob); if (isNaN(d)) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(String(s).length === 10 ? s + "T00:00:00" : s); if (isNaN(d)) return s;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

function Avatar({ p, size, radius }) {
  const r = radius != null ? radius : Math.round(size * 0.28);
  if (p.photo) return <img src={p.photo} alt="" style={{ width: size, height: size, borderRadius: r, objectFit: "cover", objectPosition: "center 20%", display: "block" }} />;
  return <div style={{ width: size, height: size, borderRadius: r, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", fontWeight: 900, fontSize: Math.round(size * 0.36) }}>{initials(p)}</div>;
}

function PhotoFiche({ p, w = 78, h = 98 }) {
  if (p.photo) {
    return (
      <div style={{ width: w, height: h, borderRadius: 12, overflow: "hidden", background: "#EEF1F5", border: `1px solid ${C.grisClair}`, flex: "0 0 auto", display: "grid", placeItems: "center" }}>
        <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    );
  }
  return <div style={{ width: w, height: h, borderRadius: 12, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", fontWeight: 900, fontSize: Math.round(w * 0.42), flex: "0 0 auto" }}>{initials(p)}</div>;
}

function compresserImage(file, maxDim, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(cv.toDataURL("image/jpeg", 0.72));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function chargerJsPDF() {
  return new Promise((res, rej) => {
    if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
    const sources = [
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
      "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js",
    ];
    let i = 0;
    const suivant = () => {
      if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
      if (i >= sources.length) return rej(new Error("réseau"));
      const sc = document.createElement("script");
      sc.src = sources[i++];
      sc.onload = () => (window.jspdf && window.jspdf.jsPDF) ? res(window.jspdf.jsPDF) : suivant();
      sc.onerror = () => suivant();
      document.body.appendChild(sc);
    };
    suivant();
  });
}


function exporterFichePDF(jsPDF, p, db, tests, stats, bilans, saison) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  try {
    doc.setProperties({
      title: `Fiche joueur ${(p.prenom || "")} ${(p.nom || "")}`.trim(),
      subject: "Fiche joueur",
      author: CLUB_LONG,
      creator: CLUB_LONG,
      keywords: "",
    });
  } catch (e) {}
  const W = 595, H = 842, M = 40;
  const NAVY = [14, 30, 51], BLEU = [26, 53, 83], OR = [198, 162, 76];
  const ENCRE = [22, 32, 46], GRIS = [122, 130, 142], TRAIT = [228, 232, 238], FOND = [247, 248, 250];
  const sc = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const sd = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const sf = (c) => doc.setFillColor(c[0], c[1], c[2]);

  sf(NAVY); doc.rect(0, 0, W, 5, "F");
  sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(CLUB_LONG, M, 42);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text(secteurLabel(p.cat).toUpperCase() + "   ·   FICHE JOUEUR", M, 55);
  sd(OR); doc.setLineWidth(1); doc.line(M, 64, W - M, 64); doc.setLineWidth(0.5);

  const by = 68, bw = 70, bh = 88, bx = W - M - bw;
  if (p.photo) {
    sf(FOND); doc.rect(bx, by, bw, bh, "F");
    sd(TRAIT); doc.rect(bx, by, bw, bh);
    try {
      const pr = doc.getImageProperties(p.photo);
      const ar = pr.width / pr.height;
      let iw = bw, ih = bw / ar;
      if (ih > bh) { ih = bh; iw = bh * ar; }
      doc.addImage(p.photo, "JPEG", bx + (bw - iw) / 2, by + (bh - ih) / 2, iw, ih);
    } catch (e) { try { doc.addImage(p.photo, "JPEG", bx, by, bw, bh); } catch (e2) {} }
  }
  sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(19);
  doc.text(`${p.prenom || ""} ${p.nom || ""}`.trim() || "Joueur", M, 88);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`${p.poste || "Poste non défini"}   ·   ${p.cat}${p.numero ? `   ·   N° ${p.numero}` : ""}`, M, 104);

  let y = p.photo ? 168 : 130;
  const colW = (W - 2 * M - 24) / 2;
  const cols = [M, M + colW + 26];

  const sautPage = (besoin) => { if (y + besoin > H - 46) { doc.addPage(); y = 56; } };
  const section = (titre) => {
    y += 4;
    sautPage(30);
    sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
    doc.text(titre.toUpperCase(), M, y);
    const tw = doc.getTextWidth(titre.toUpperCase());
    sd(OR); doc.setLineWidth(1.3); doc.line(M, y + 4, M + tw, y + 4); doc.setLineWidth(0.5);
    y += 13;
  };
  const cellule = (x, label, val) => {
    if (val == null || val === "") val = "n.c.";
    sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text(String(label), x, y);
    sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text(String(val), x + colW, y, { align: "right" });
  };
  const paires = (arr) => {
    for (let i = 0; i < arr.length; i += 2) {
      cellule(cols[0], arr[i][0], arr[i][1]);
      if (arr[i + 1]) cellule(cols[1], arr[i + 1][0], arr[i + 1][1]);
      sd(TRAIT); doc.line(M, y + 4, W - M, y + 4);
      y += 14;
    }
  };

  section("Identité");
  paires([
    ["Date de naissance", p.dob ? `${new Date(p.dob + "T00:00:00").toLocaleDateString("fr-FR")}${ageOf(p.dob) != null ? ` (${ageOf(p.dob)} ans)` : ""}` : null],
    ["Catégorie", p.cat],
    ["Taille", p.taille ? `${p.taille} cm` : null],
    ["Poids", p.poids ? `${p.poids} kg` : null],
    ["Poste", p.poste],
    ["Pied fort", p.pied],
    ["Numéro de maillot", p.numero],
    ["Numéro de licence", p.licence],
    ["Club", p.club],
  ]);

  section("Parents / responsable");
  paires([
    ["Responsable", p.parentNom],
    ["Téléphone", p.parentTel],
    ["Contact (email)", p.parentEmail],
  ]);

  if (jonglagesActifs(p.cat)) {
    section("Jonglages (max 50)");
    const jo = p.jonglages || {};
    paires([
      ["Pied fort", jo.fort],
      ["Pied faible", jo.faible],
      ["Jonglage alterné", jo.tete],
    ]);
  }

  section("Tests physiques");
  const dernier = tests[tests.length - 1] || {};
  if (dernier.date) {
    sc(GRIS); doc.setFont("helvetica", "italic"); doc.setFontSize(8.5);
    doc.text(`Dernier test du ${new Date(dernier.date + "T00:00:00").toLocaleDateString("fr-FR")}`, M, y);
    doc.setFont("helvetica", "normal"); y += 13;
  }
  const sousTitre = (t) => {
    sc(GRIS); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    doc.text(t.toUpperCase(), M, y); y += 13;
  };
  sousTitre("Vitesse");
  paires([
    ["VMA", dernier.vma ? `${dernier.vma} km/h` : null],
    ["Vitesse 10 m", dernier.v10 ? `${dernier.v10} s` : null],
    ["Vitesse 20 m", dernier.v20 ? `${dernier.v20} s` : null],
    ["Vitesse 40 m", dernier.v40 ? `${dernier.v40} s` : null],
  ]);
  if (jumpActif(p.cat)) {
    y += 2;
    sousTitre("Détente (sauts)");
    paires([
      ["SJ (Squat Jump)", dernier.sj ? `${dernier.sj} cm` : null],
      ["CMJ", dernier.cmj ? `${dernier.cmj} cm` : null],
      ["CMJB (bras)", dernier.cmjb ? `${dernier.cmjb} cm` : null],
      ["DJ (Drop Jump)", dernier.dj ? `${dernier.dj} cm` : null],
    ]);
  }
  if (tests.length > 1) {
    sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    doc.text("Historique VMA : " + tests.map((t) => `${t.date ? jjmm(t.date) : "Init"} ${t.vma || "-"}`).join("   ·   "), M, y, { maxWidth: W - 2 * M });
    y += 14;
  }

  section("Statistiques" + (saison ? ` de la saison ${saison}` : " de saison"));
  const tiles = [
    ["Minutes", String(stats.minutes ?? 0)],
    ["Buts", String(stats.buts ?? 0)],
    ["Passes déc.", String(stats.passes ?? 0)],
    ["Note moy.", stats.moy != null ? `${stats.moy.toFixed(1)}/7` : "n.c."],
  ];
  const gap = 8, tw2 = (W - 2 * M - 3 * gap) / 4, th = 36;
  tiles.forEach((t, i) => {
    const x = M + i * (tw2 + gap);
    sf(FOND); doc.roundedRect(x, y, tw2, th, 5, 5, "F");
    sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    doc.text(t[1], x + tw2 / 2, y + 19, { align: "center" });
    sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.text(t[0], x + tw2 / 2, y + 30, { align: "center" });
  });
  y += th + 4;
  {
    const moysG = [];
    (db.players || []).filter((x) => x.cat === p.cat).forEach((j) => { const s = statsJoueur(j, db, saison); if (s && s.moy != null) moysG.push(s.moy); });
    if (moysG.length) {
      const mg = moysG.reduce((a, b) => a + b, 0) / moysG.length;
      sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      let txt = `Note moyenne du groupe : ${mg.toFixed(1)}/7  (sur ${moysG.length} joueur${moysG.length > 1 ? "s" : ""} noté${moysG.length > 1 ? "s" : ""})`;
      if (stats.moy != null) txt += stats.moy >= mg ? "  -  ce joueur est au-dessus de la moyenne." : "  -  ce joueur est en dessous de la moyenne.";
      doc.text(txt, M, y, { maxWidth: W - 2 * M }); y += 14;
    }
  }

  const assi = assiduiteJoueur(p, db, saison);
  const nbSeances = (db.trainings || []).filter((t) => t.cat === p.cat && (!saison || saisonDe(t.date) === saison) && t.presence && Object.keys(t.presence).length > 0).length;
  const nbMatchsEq = (db.matches || []).filter((m) => m.cat === p.cat && (!saison || saisonDe(m.date) === saison) && m.scorePour != null && m.scoreContre != null && !(m.type || "").toLowerCase().includes("amical")).length;
  section("Assiduité" + (nbSeances ? ` (sur ${nbSeances} séance${nbSeances > 1 ? "s" : ""})` : ""));
  paires([
    ["Matchs joués", nbMatchsEq >= assi.matchs && nbMatchsEq > 0 ? `${assi.matchs} / ${nbMatchsEq}` : String(assi.matchs)],
    ["Présences", nbSeances ? `${assi.presences} / ${nbSeances} (${Math.round((assi.presences / nbSeances) * 100)}%)` : String(assi.presences)],
    ["Absences", assi.absences],
    ["Retards", assi.retards],
  ]);

  const cartonsActifs = (() => { const ci = CATEGORIES.find((x) => x.id === p.cat); return (ci && ci.type === 11) || p.cat === "U13"; })();
  if (cartonsActifs || assi.jaunes || assi.rouges) {
    section("Discipline");
    paires([
      ["Cartons jaunes", assi.jaunes],
      ["Cartons rouges", assi.rouges],
    ]);
  }

  const blessures = db.injuries.filter((i) => i.joueurId === p.id && (!i.debut || saisonDe(i.debut) === saison));
  if (blessures.length) {
    section("Périodes de blessures");
    paires(blessures.map((b) => [b.zone || "Blessure", `${b.debut ? jjmm(b.debut) : "?"}${b.duree ? " · " + b.duree : ""} · ${b.fini ? "rétabli" : "en cours"}`]));
  }

  if (bilans && bilans.length) {
    section("Bilans et entretiens" + (saison ? ` (${saison})` : ""));
    const rubriquePDF = (titre, val) => {
      if (!val) return;
      sautPage(26);
      sc(GRIS); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5);
      doc.text(titre.toUpperCase(), M, y); y += 9;
      sc(ENCRE); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const lignes = doc.splitTextToSize(String(val), W - 2 * M);
      lignes.forEach((l) => { sautPage(12); doc.text(l, M, y); y += 10.5; });
      y += 1.5;
    };
    bilans.forEach((b, idx) => {
      sautPage(42);
      sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(`${b.date ? new Date(b.date + "T00:00:00").toLocaleDateString("fr-FR") : "Bilan"}${b.educateur ? "   ·   " + b.educateur : ""}`, M, y);
      y += 13;
      rubriquePDF("Appréciation générale", b.appreciation);
      rubriquePDF("Points forts", b.pointsForts);
      rubriquePDF("Axes de progrès", b.axesProgres);
      rubriquePDF("Objectifs", b.objectifs);
      rubriquePDF("Comportement et état d'esprit", b.comportement);
      rubriquePDF("Entretien avec le joueur ou les parents", b.entretien);
      if (idx < bilans.length - 1) { y += 2; sd(TRAIT); doc.line(M, y, W - M, y); y += 12; }
    });
  }

  sd(OR); doc.setLineWidth(0.8); doc.line(M, H - 28, W - M, H - 28); doc.setLineWidth(0.5);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text(`Fiche éditée le ${new Date().toLocaleDateString("fr-FR")}`, M, H - 19);
  doc.text(CLUB_LONG, W - M, H - 19, { align: "right" });

  const nom = `${(p.nom || "joueur").toUpperCase()}_${p.prenom || ""}`.replace(/\s+/g, "");
  const fichier = `Fiche_${nom}.pdf`;
  try {
    doc.save(fichier);
  } catch (e) {
    try {
      const url = doc.output("bloburl");
      const a = document.createElement("a");
      a.href = url; a.download = fichier; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e2) {
      doc.output("dataurlnewwindow");
    }
  }
}


/* ============================================================
   Application
   ============================================================ */
export default function App() {
  const [session, setSession] = useState(undefined);
  const [profil, setProfil] = useState(null);
  const [cat, setCat] = useState(null);
  const [tab, setTab] = useState("accueil");
  const [db, setDb] = useState(null);
  const [reunionsClub, setReunionsClub] = useState(null);
  const [reunionsErr, setReunionsErr] = useState(null);
  const [demResume, setDemResume] = useState({ recues: 0, envoyees: 0 });
  const [saveStatus, setSaveStatus] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [showDemandes, setShowDemandes] = useState(false);
  const [showClassement, setShowClassement] = useState(false);
  const [showTransport, setShowTransport] = useState(false);
  const [showOrganisation, setShowOrganisation] = useState(false);
  const [showSauvegarde, setShowSauvegarde] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showPlanningHebdo, setShowPlanningHebdo] = useState(false);
  const [showAcces, setShowAcces] = useState(false);
  const [showProgramme, setShowProgramme] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showSuivi, setShowSuivi] = useState(false);
  const [showBilan, setShowBilan] = useState(false);
  const [showTournois, setShowTournois] = useState(false);
  const [showReunions, setShowReunions] = useState(false);
  const [showCalendrier, setShowCalendrier] = useState(false);
  const [groupeSel, setGroupeSel] = useState(null);
  const [demo, setDemo] = useState(false);
  const cacheRef = useRef({});
  const pendingRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const savingCountRef = useRef(0);

  useEffect(() => {
    if (!estConfigure()) { setSession(null); return; }
    let sub;
    getSupabase().then((sb) => {
      sb.auth.getSession().then(({ data }) => setSession(data.session || null));
      const r = sb.auth.onAuthStateChange((_e, s) => setSession(s || null));
      sub = r.data.subscription;
    }).catch(() => setSession(null));
    return () => { if (sub) sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) { setProfil(null); setCat(null); setDb(null); return; }
    let annule = false;
    (async () => {
      try {
        const sb = await getSupabase();
        const u = session.user.id;
        const [{ data: prof }, { data: aff }] = await Promise.all([
          sb.from("educateurs").select("role,nom").eq("id", u).maybeSingle(),
          sb.from("affectations").select("categorie").eq("educateur_id", u),
        ]);
        if (annule) return;
        const role = (prof && prof.role) || "educateur";
        const affCats = (aff || []).map((a) => a.categorie);
        const cats = role === "direction" ? CATEGORIES.map((c) => c.id) : affCats;
        const catsModif = role === "direction" ? CATEGORIES.map((c) => c.id) : affCats;
        setProfil({ role, nom: prof && prof.nom, cats, catsModif });
        setCat((prev) => (prev && cats.includes(prev) ? prev : (cats[0] || null)));
      } catch (e) { if (!annule) setProfil({ role: "educateur", cats: [] }); }
    })();
    return () => { annule = true; };
  }, [session]);

  useEffect(() => {
    if (demo || !session || !cat) return;
    let annule = false;
    (async () => {
      try {
        if (!cacheRef.current[cat]) cacheRef.current[cat] = await loadCat(cat);
        if (!annule) setDb(cacheRef.current[cat]);
      } catch (e) { if (!annule) setDb({ ...EMPTY_DB }); }
    })();
    return () => { annule = true; };
  }, [session, cat, demo]);

  useEffect(() => {
    if (demo || !session || !cat) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      // On passe par la file pour ne jamais recharger pendant un enregistrement,
      // ce qui evite d'ecraser une modification en cours.
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        if (savingCountRef.current > 0) return;
        try { const fresh = await loadCat(cat); if (fresh) { cacheRef.current[cat] = fresh; setDb(fresh); } } catch (e) {}
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [session, cat, demo]);

  useEffect(() => {
    if (!demo) return;
    let annule = false;
    loadLocal().then((d) => { if (!annule) { setDb(d); setCat((p) => p || "U7"); } });
    return () => { annule = true; };
  }, [demo]);

  useEffect(() => {
    if (demo || !session) return;
    let annule = false;
    loadReunions().then((r) => { if (!annule) { setReunionsClub(r); setReunionsErr(null); } })
      .catch((e) => { if (!annule) { setReunionsClub([]); setReunionsErr(e.message || String(e)); } });
    return () => { annule = true; };
  }, [session, demo]);

  useEffect(() => {
    if (!cat) { setDemResume({ recues: 0, envoyees: 0 }); return; }
    if (demo) {
      const list = (db && db.demandes) || [];
      setDemResume({
        recues: list.filter((d) => d.joueurCat === cat && d.statut === "en_attente").length,
        envoyees: list.filter((d) => d.demandeurCat === cat && d.statut === "en_attente").length,
      });
      return;
    }
    if (!session) { setDemResume({ recues: 0, envoyees: 0 }); return; }
    let annule = false;
    (async () => {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb.from("demandes_joueur").select("demandeur_cat,joueur_cat,statut");
        if (error) throw error;
        if (annule) return;
        const list = data || [];
        setDemResume({
          recues: list.filter((d) => d.joueur_cat === cat && d.statut === "en_attente").length,
          envoyees: list.filter((d) => d.demandeur_cat === cat && d.statut === "en_attente").length,
        });
      } catch (e) { if (!annule) setDemResume({ recues: 0, envoyees: 0 }); }
    })();
    return () => { annule = true; };
  }, [session, cat, demo, tab, db]);

  useEffect(() => {
    if (saveStatus === "ok" || saveStatus === "ro") { const t = setTimeout(() => setSaveStatus(null), 2600); return () => clearTimeout(t); }
  }, [saveStatus]);

  function mutate(fn) {
    if (lectureSeuleCat) { setSaveStatus("ro"); return; }
    // Affichage immédiat sur cet appareil (la modif apparaît tout de suite)
    setDb((prev) => {
      const next = fn(structuredClone(prev));
      cacheRef.current[cat] = next;
      if (demo) saveLocal(next);
      return next;
    });
    if (demo || !session || !cat) return;
    // Enregistrement sécurisé : au moment d'écrire, on relit la version la plus
    // recente du serveur et on y applique uniquement cette modification. Ainsi,
    // meme si un autre appareil a enregistre entre-temps, son travail n'est pas ecrase.
    const capCat = cat, capUser = session.user.id;
    savingCountRef.current += 1;
    pendingRef.current = true;
    setSaveStatus("saving");
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        let aEcrire;
        try {
          const frais = await loadCat(capCat);
          aEcrire = fn(structuredClone(frais));
        } catch (e) {
          // Repli : si la relecture echoue, on garde notre version locale
          aEcrire = cacheRef.current[capCat];
        }
        await saveCat(capCat, aEcrire, capUser);
        cacheRef.current[capCat] = aEcrire;
        setSaveStatus("ok");
      } catch (e) {
        console.error("Sauvegarde:", e);
        setSaveStatus("error");
      } finally {
        savingCountRef.current = Math.max(0, savingCountRef.current - 1);
        if (savingCountRef.current === 0) pendingRef.current = false;
      }
    });
  }

  function enregistrerManuel() {
    if (demo) { try { saveLocal(db); } catch (e) {} setSaveStatus("ok"); return; }
    if (!session || !cat || !db) return;
    const capCat = cat;
    setSaveStatus("saving");
    // On attend que tous les enregistrements en cours soient termines, puis on
    // recharge la version consolidee du serveur pour l'afficher a l'ecran.
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      try {
        const frais = await loadCat(capCat);
        if (frais) { cacheRef.current[capCat] = frais; setDb(frais); }
        setSaveStatus("ok");
      } catch (e) { console.error("Sauvegarde:", e); setSaveStatus("error"); }
    });
  }
  async function mutateReunions(fn) {
    if (!session) return;
    setSaveStatus("saving");
    let base;
    try { base = await loadReunions(); } catch (e) { base = reunionsClub || []; }
    const next = fn(structuredClone({ reunions: base }));
    setReunionsClub(next.reunions || []);
    try { await saveReunions(next.reunions || []); setReunionsErr(null); setSaveStatus("ok"); }
    catch (e) { setReunionsErr(e.message || String(e)); setSaveStatus("error"); }
  }

  async function deconnexion() {
    if (demo) { setDemo(false); setDb(null); setCat(null); return; }
    try { const sb = await getSupabase(); await sb.auth.signOut(); } catch (e) {}
    cacheRef.current = {};
  }

  if (!demo) {
    if (!estConfigure()) return <Login configManquante onDemo={() => setDemo(true)} />;
    if (session === undefined) return <PleinEcran>Chargement...</PleinEcran>;
    if (!session) return <Login onDemo={() => setDemo(true)} />;
    if (!profil) return <PleinEcran>Chargement du profil...</PleinEcran>;
    if (profil.cats.length === 0) return <AucuneCategorie email={session.user.email} onLogout={deconnexion} />;
  }
  if (!cat || !db) return <PleinEcran>Chargement...</PleinEcran>;

  const catInfo = CATEGORIES.find((c) => c.id === cat);
  const players = db.players.filter((p) => p.cat === cat);
  const reunionsSource = demo ? ((db && db.reunions) || []) : (reunionsClub || []);
  const mutateReu = demo ? mutate : mutateReunions;
  const accesSource = (db && db.acces) || [];
  const cats = demo ? CATEGORIES.map((c) => c.id) : profil.cats;
  const sousTitre = demo ? "" : (profil && profil.role === "direction" ? " · DIRECTION" : "");
  const peutValider = demo || (profil && (profil.role === "responsable" || profil.role === "direction"));
  const estAdmin = demo || (profil && profil.role === "direction");
  const estMedical = !demo && !!(profil && profil.role === "medical");
  const lectureSeuleCat = !demo && !!(profil && Array.isArray(profil.catsModif) && cat && !profil.catsModif.includes(cat));
  const groupesDispo = GROUPES.filter((g) => CATEGORIES.some((c) => c.groupe === g && cats.includes(c.id)));
  const groupeActif = (groupeSel && groupesDispo.includes(groupeSel)) ? groupeSel
    : (catInfo && groupesDispo.includes(catInfo.groupe) ? catInfo.groupe : groupesDispo[0]);

  const TABS = estMedical ? [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "effectif", label: "Effectif", icon: Users },
  ] : [
    { id: "accueil", label: "Accueil", icon: Home },
    { id: "effectif", label: "Effectif", icon: Users },
    { id: "compo", label: "Compo", icon: ClipboardList },
    { id: "matchs", label: "Matchs", icon: CalendarDays },
    { id: "entrainements", label: "Séances", icon: Dumbbell },
    { id: "detection", label: "Détection", icon: Search },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.fond, color: C.encre, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif", paddingBottom: 78 }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "18px 16px 14px", borderBottom: `2px solid ${C.jaune}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 4, height: 38, borderRadius: 2, background: C.jaune, flex: "0 0 auto" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: 1.1 }}>{CLUB_LONG}</div>
              <div style={{ fontSize: 9.5, color: C.jaune, fontWeight: 700, letterSpacing: 1.2, marginTop: 3 }}>
                ÉCOLE DE FOOT · FORMATION · PROFESSIONNELS{sousTitre}
              </div>
            </div>
            <img src={LOGO_CLUB} alt="Logo FC Sochaux-Montbéliard" style={{ height: 42, width: "auto", flex: "0 0 auto" }} />
            <button onClick={deconnexion} title="Se déconnecter" style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
              <LogOut size={16} />
            </button>
          </div>

          {groupesDispo.length > 1 && (
            <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 14, paddingBottom: 2 }}>
              {groupesDispo.map((g) => {
                const on = g === groupeActif;
                return (
                  <button key={g} onClick={() => {
                    setGroupeSel(g);
                    if (!CATEGORIES.find((c) => c.id === cat && c.groupe === g)) {
                      const premier = CATEGORIES.find((c) => c.groupe === g && cats.includes(c.id));
                      if (premier) setCat(premier.id);
                    }
                  }} style={{
                    flex: "0 0 auto", border: "none", cursor: "pointer", borderRadius: 999,
                    padding: "5px 12px", fontWeight: 800, fontSize: 12,
                    background: on ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.10)", color: "#fff",
                  }}>{g}</button>
                );
              })}
            </div>
          )}
          {(() => {
            const catsGroupe = CATEGORIES.filter((c) => cats.includes(c.id) && c.groupe === groupeActif);
            const mt = groupesDispo.length > 1 ? 8 : 14;
            if (true) {
              return (
                <div style={{ position: "relative", marginTop: mt }}>
                  <select value={cat} onChange={(e) => setCat(e.target.value)} style={{
                    width: "100%", appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                    background: "rgba(255,255,255,0.16)", color: "#fff", border: "none", borderRadius: 10,
                    padding: "10px 36px 10px 13px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  }}>
                    {catsGroupe.map((c) => <option key={c.id} value={c.id} style={{ color: C.encre, background: "#fff" }}>{c.id}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.jaune, pointerEvents: "none", fontSize: 11 }}>▼</span>
                </div>
              );
            }
            return (
              <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: mt, paddingBottom: 2 }}>
                {catsGroupe.map((c) => {
                  const active = c.id === cat;
                  return (
                    <button key={c.id} onClick={() => setCat(c.id)} style={{
                      flex: "0 0 auto", border: "none", cursor: "pointer", borderRadius: 10,
                      padding: "7px 13px", fontWeight: 800, fontSize: 14,
                      background: active ? C.jaune : "rgba(255,255,255,0.13)",
                      color: active ? C.bleuNuit : "#fff",
                    }}>{c.id}</button>
                  );
                })}
              </div>
            );
          })()}
          <div style={{ marginTop: 8, fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
            {catInfo.college ? `${cat} · ${catInfo.college} · ` : `Catégorie ${cat} · `}Foot à {catInfo.type} · {players.length} joueur{players.length > 1 ? "s" : ""}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
        {lectureSeuleCat && (
          <div style={{ background: "#EAF0F7", border: `1px solid ${C.bleu}`, color: C.bleu, borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14, lineHeight: 1.4 }}>
            Consultation seule sur cette catégorie. Tu peux tout voir, mais la modification est réservée à son responsable.
          </div>
        )}
        {tab === "accueil" && <Accueil db={{ ...db, reunions: reunionsSource }} cat={cat} setTab={setTab} onScores={() => setShowScores(true)} onDemandes={() => setShowDemandes(true)} onClassement={() => { const u = ((db.config && db.config.classement) || {})[cat]; const dir = ((db.config && db.config.classementDirect) || {})[cat]; if (u && dir) window.open(u, "_blank", "noopener"); setShowClassement(true); }} onTransport={() => setShowTransport(true)} onOrganisation={() => setShowOrganisation(true)} onSauvegarde={estAdmin ? () => setShowSauvegarde(true) : null} onPlanning={() => setShowPlanning(true)} onPlanningHebdo={() => setShowPlanningHebdo(true)} onAcces={estAdmin ? () => setShowAcces(true) : null} onProgramme={() => setShowProgramme(true)} onDocuments={() => setShowDocs(true)} onSuivi={() => setShowSuivi(true)} onBilan={() => setShowBilan(true)} onReunions={() => setShowReunions(true)} onCalendrier={() => setShowCalendrier(true)} demResume={demResume} estMedical={estMedical} monEmail={demo ? "karim.b@fcsm.fr" : ((session && session.user && session.user.email) || "")} />}
        {tab === "effectif" && <Effectif players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} lectureSeule={estMedical} />}
        {tab === "compo" && <Compo players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} />}
        {tab === "matchs" && <Matchs players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} peutValider={peutValider} profil={profil} />}
        {tab === "entrainements" && <Entrainements players={players} cat={cat} db={db} mutate={mutate} />}
        {tab === "detection" && <Detection cat={cat} db={db} mutate={mutate} />}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 16px 26px" }}>
          <button onClick={enregistrerManuel} style={{ background: "transparent", border: `1px solid ${C.grisClair}`, color: C.gris, borderRadius: 9, padding: "7px 15px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700 }}><Save size={14} /> Enregistrer</button>
        </div>
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff",
        borderTop: `1px solid ${C.grisClair}`, display: "flex", justifyContent: "center",
        boxShadow: "0 -2px 12px rgba(10,42,107,0.06)", zIndex: 30,
      }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 760 }}>
          {TABS.map((t) => {
            const I = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, border: "none", background: "none", cursor: "pointer",
                padding: "9px 2px 10px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, color: active ? C.bleu : C.gris,
              }}>
                <I size={21} strokeWidth={active ? 2.6 : 2} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 800 : 600 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {saveStatus && !demo && (
        <div style={{ position: "fixed", bottom: 88, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 45, padding: "0 16px", pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto", maxWidth: 400, background: saveStatus === "error" ? C.rouge : saveStatus === "ok" ? C.vert : C.bleu, color: "#fff", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.22)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1 }}>{saveStatus === "saving" ? "Enregistrement en cours..." : saveStatus === "ok" ? "Enregistré" : saveStatus === "ro" ? "Consultation seule : cette catégorie n'est pas modifiable par toi." : "Échec de l'enregistrement. Vérifie ta connexion et réessaie."}</span>
            {saveStatus === "error" && <span onClick={() => setSaveStatus(null)} style={{ cursor: "pointer", textDecoration: "underline", flex: "0 0 auto" }}>OK</span>}
          </div>
        </div>
      )}

      {showScores && <ScoresWeekend onClose={() => setShowScores(false)} localDb={demo ? db : null} />}
      {showDemandes && <Demandes demo={demo} db={db} mutate={mutate} cat={cat} session={session} onClose={() => setShowDemandes(false)} />}
      {showClassement && <Classement cat={cat} db={db} mutate={mutate} onClose={() => setShowClassement(false)} />}
      {showTransport && <Transports db={db} mutate={mutate} cat={cat} onClose={() => setShowTransport(false)} />}
      {showOrganisation && <OrganisationMatchs db={db} mutate={mutate} cat={cat} peutValider={peutValider} onClose={() => setShowOrganisation(false)} />}
      {showSauvegarde && <Sauvegarde db={db} mutate={mutate} cat={cat} demo={demo} estAdmin={estAdmin} userId={session ? session.user.id : null} onClose={() => setShowSauvegarde(false)} />}
      {showPlanning && <Planning db={db} mutate={mutate} cats={cats} profil={profil} peutValider={peutValider} cat={cat} onClose={() => setShowPlanning(false)} />}
      {showPlanningHebdo && <PlanningHebdo onClose={() => setShowPlanningHebdo(false)} />}
      {showAcces && <AccesSecteurs db={{ acces: accesSource }} mutate={mutateReu} estAdmin={estAdmin} onClose={() => setShowAcces(false)} />}
      {showProgramme && <ProgrammeSemaine db={db} onClose={() => setShowProgramme(false)} />}
      {showDocs && <DocumentsAdmin players={players} cat={cat} onClose={() => setShowDocs(false)} />}
      {showSuivi && <SuiviMedical db={db} mutate={mutate} cat={cat} onClose={() => setShowSuivi(false)} />}
      {showBilan && <BilanEquipe db={db} players={players} cat={cat} onClose={() => setShowBilan(false)} onTournois={() => setShowTournois(true)} />}
      {showTournois && <Tournois db={db} mutate={mutate} cat={cat} onClose={() => setShowTournois(false)} />}
      {showReunions && <Reunions db={{ reunions: reunionsSource, acces: accesSource }} mutate={mutateReu} erreur={demo ? null : reunionsErr} onClose={() => setShowReunions(false)} />}
      {showCalendrier && <Calendrier db={{ ...db, reunions: reunionsSource }} mutate={mutate} mutateReunions={mutateReu} peutValider={peutValider} onClose={() => setShowCalendrier(false)} />}
    </div>
  );
}

function PleinEcran({ children }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bleuNuit, color: C.jaune, fontWeight: 800, padding: 20, textAlign: "center" }}>{children}</div>;
}

function traduireErreur(e) {
  const m = ((e && e.message) || "").toLowerCase();
  if (m.includes("invalid login")) return "Email ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Cet email a déjà un compte.";
  if (m.includes("password")) return "Mot de passe trop court (6 caractères minimum).";
  if (m.includes("email")) return "Adresse email invalide.";
  return "Action impossible pour le moment. Vérifie ta connexion et réessaie.";
}


function Login({ configManquante, onDemo }) {
  const [mode, setMode] = useState("connexion");
  const [email, setEmail] = useState(() => { try { return localStorage.getItem("fcsm-email") || ""; } catch (e) { return ""; } });
  const [mdp, setMdp] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!email.trim() || !mdp) { setMsg("Renseigne ton email et ton mot de passe."); return; }
    try { localStorage.setItem("fcsm-email", email.trim()); } catch (e) {}
    setMsg(""); setBusy(true);
    try {
      const sb = await getSupabase();
      if (mode === "connexion") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: mdp });
        if (error) throw error;
      } else {
        const { error } = await sb.auth.signUp({ email: email.trim(), password: mdp });
        if (error) throw error;
        setMsg("Compte créé. Si la confirmation par email est activée, valide le lien reçu, puis connecte-toi. La direction devra ensuite t'affecter une catégorie.");
      }
    } catch (e) { setMsg(traduireErreur(e)); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, display: "grid", placeItems: "center", padding: 20, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", color: "#fff", marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 1.2 }}>{CLUB_LONG}</div>
          <div style={{ fontSize: 9.5, color: C.jaune, fontWeight: 700, letterSpacing: 1.2, marginTop: 4 }}>ÉCOLE DE FOOT · FORMATION · PROFESSIONNELS</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 18, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
          {configManquante ? (
            <div style={{ fontSize: 13.5, color: C.encre, lineHeight: 1.55 }}>
              <strong>Connexion sécurisée non configurée.</strong>
              <div style={{ marginTop: 8 }}>Pour activer les comptes éducateurs, renseigne l'URL du projet et la clé anon public en haut du fichier, dans SUPABASE_URL et SUPABASE_ANON_KEY.</div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>{mode === "connexion" ? "Connexion éducateur" : "Créer un compte"}</div>
              <form onSubmit={(e) => { e.preventDefault(); go(); }}>
                <Field label="Adresse email"><Inp type="email" name="username" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@club.fr" /></Field>
                <Field label="Mot de passe"><Inp type="password" name="password" autoComplete={mode === "connexion" ? "current-password" : "new-password"} value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="6 caractères minimum" /></Field>
                <Btn variant="primary" full type="submit" style={{ marginTop: 6 }}>{busy ? "Patiente..." : (mode === "connexion" ? "Se connecter" : "Créer le compte")}</Btn>
              </form>
              {msg && <div style={{ fontSize: 12.5, color: C.encre, marginTop: 12, background: C.fond, padding: 10, borderRadius: 10, lineHeight: 1.5 }}>{msg}</div>}
              <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: C.gris }}>
                {mode === "connexion" ? "Pas encore de compte ? " : "Déjà un compte ? "}
                <span onClick={() => { setMode(mode === "connexion" ? "inscription" : "connexion"); setMsg(""); }} style={{ color: C.bleu, fontWeight: 800, cursor: "pointer" }}>
                  {mode === "connexion" ? "Créer un compte" : "Se connecter"}
                </span>
              </div>
            </>
          )}

          {onDemo && (
            <>
              <div style={{ borderTop: `1px solid ${C.grisClair}`, margin: "16px 0 14px" }} />
              <Btn variant="ghost" full onClick={onDemo}><Eye size={16} /> Essayer sans compte (mode essai)</Btn>
              <div style={{ fontSize: 11.5, color: C.gris, textAlign: "center", marginTop: 8, lineHeight: 1.45 }}>
                Pour découvrir l'application. Les données restent sur cet appareil et ne sont ni partagées ni sécurisées.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AucuneCategorie({ email, onLogout }) {
  return (
    <PleinEcran>
      <div style={{ maxWidth: 340 }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Compte en attente</div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: 13.5, lineHeight: 1.5 }}>
          Ton compte ({email}) n'a pas encore de catégorie affectée. La direction doit te l'attribuer pour que tu accèdes à ton groupe.
        </div>
        <Btn variant="accent" onClick={onLogout} style={{ marginTop: 16 }}>Se déconnecter</Btn>
      </div>
    </PleinEcran>
  );
}

function ScoresWeekend({ onClose, localDb }) {
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);

  const { sam, dim } = useMemo(() => {
    const d = new Date();
    const isodow = (d.getDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(d); lundi.setDate(d.getDate() - isodow + offset * 7);
    const sa = new Date(lundi); sa.setDate(lundi.getDate() + 5);
    const di = new Date(lundi); di.setDate(lundi.getDate() + 6);
    const f = (x) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
    return { sam: f(sa), dim: f(di) };
  }, [offset]);

  useEffect(() => {
    let annule = false;
    setRows(null); setErr(false);
    if (localDb) {
      const r = (localDb.matches || [])
        .filter((m) => m.date && m.date >= sam && m.date <= dim)
        .map((m) => ({
          categorie: m.cat,
          date_match: m.date,
          adversaire: m.adversaire,
          lieu: m.lieu,
          score_pour: (m.scorePour == null || m.scorePour === "") ? null : +m.scorePour,
          score_contre: (m.scoreContre == null || m.scoreContre === "") ? null : +m.scoreContre,
        }))
        .sort((a, b) => (a.date_match || "").localeCompare(b.date_match || ""));
      setRows(r);
      return;
    }
    (async () => {
      try {
        const sb = await getSupabase();
        const { data, error } = await sb.rpc("scores_weekend", { debut: sam, fin: dim });
        if (error) throw error;
        if (!annule) setRows(data || []);
      } catch (e) { if (!annule) { setErr(true); setRows([]); } }
    })();
    return () => { annule = true; };
  }, [sam, dim, localDb]);

  return (
    <Modal title="Scores du week-end" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Résultats de toutes les catégories, visibles par tous les éducateurs.</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Btn variant="ghost" size="sm" onClick={() => setOffset(offset - 1)}><ChevronLeft size={15} /> Précédent</Btn>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.encre }}>{jjmm(sam)} au {jjmm(dim)}</span>
        <Btn variant="ghost" size="sm" onClick={() => setOffset(offset + 1)}>Suivant <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} /></Btn>
      </div>
      {rows === null ? (
        <div style={{ textAlign: "center", padding: 24, color: C.gris }}>Chargement...</div>
      ) : err ? (
        <Empty icon={<Trophy size={24} color={C.gris} />} text="Scores indisponibles" sub="Vérifie la connexion au club" />
      ) : rows.length === 0 ? (
        <Empty icon={<Trophy size={24} color={C.gris} />} text="Aucun match ce week-end" />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((r, i) => {
            const joue = r.score_pour != null && r.score_contre != null;
            let bg = C.grisClair, col = C.gris, res = "À venir";
            if (joue) {
              if (r.score_pour > r.score_contre) { bg = "#E2F4E9"; col = C.vert; res = "V"; }
              else if (r.score_pour === r.score_contre) { res = "N"; }
              else { bg = "#FBE3E3"; col = C.rouge; res = "D"; }
            }
            const dom = r.lieu === "Domicile";
            return (
              <Card key={i} style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <Pastille bg={C.bleu} color="#fff">{r.categorie}</Pastille>
                  <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{r.date_match ? jourLong(r.date_match) : ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, minWidth: 0 }}>{dom ? CLUB : (r.adversaire || "Adversaire")} <span style={{ color: C.gris, fontWeight: 600 }}>c.</span> {dom ? (r.adversaire || "Adversaire") : CLUB}</div>
                  {joue ? <Pastille bg={bg} color={col}>{dom ? `${r.score_pour} - ${r.score_contre}` : `${r.score_contre} - ${r.score_pour}`}</Pastille> : <Pastille bg={C.jaune} color={C.bleuNuit}>{res}</Pastille>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Modal>
  );
}


/* ============================================================
   Accueil
   ============================================================ */
function Accueil({ db, cat, setTab, onScores, onDemandes, onClassement, onTransport, onOrganisation, onSauvegarde, onPlanning, onPlanningHebdo, onAcces, onProgramme, onDocuments, onSuivi, onBilan, onReunions, onCalendrier, demResume, estMedical, monEmail }) {
  const players = db.players.filter((p) => p.cat === cat);
  const d0 = new Date();
  const todayStr = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  const matchJoue = (m) => m.scorePour != null && m.scorePour !== "" && m.scoreContre != null && m.scoreContre !== "";
  const prochainMatch = db.matches.filter((m) => m.cat === cat && m.date && m.date >= todayStr && !matchJoue(m)).sort((a, b) => a.date.localeCompare(b.date))[0];
  const blesses = db.injuries.filter((i) => !i.fini && players.some((p) => p.id === i.joueurId)).length;
  const enSuiviMedical = priseEnChargeMedicale(cat) !== "parents"
    ? db.injuries.filter((i) => i.cat === cat && !i.fini && (i.priseEnCharge ? i.priseEnCharge === "club" : true)).length
    : db.injuries.filter((i) => i.cat === cat && !i.fini && i.priseEnCharge === "club").length;
  const nbOrga = db.matches.filter((m) => {
    if (m.cat !== cat || !m.date || m.date < todayStr || matchJoue(m)) return false;
    const t = m.transport || {}, e = m.encadrement || {}, r = m.reservation || {};
    const manque = (m.lieu === "Extérieur" && !t.statut) || !e.arbitre || (m.lieu === "Domicile" && r.statut !== "validee");
    return manque;
  }).length;

  const alerteDocs = players.filter((p) => p.licenceStatut !== "Valide" || statutMedical(p).urgence > 0).length;
  const mutHors = players.filter((p) => typeMutation(p) === "hors").length;
  const limMutHors = limiteHorsPeriode(cat);
  const alerteMutation = mutHors > limMutHors ? mutHors : 0;
  const suspendus = players.filter((p) => estSuspendu(p)).length;
  const aRisqueSusp = players.filter((p) => risqueSuspension(p, db, cat).alerte).length;
  const dans7 = addDays(todayStr, 7);
  const retourProche = (db.injuries || []).filter((i) => !i.fini && i.dateRetour && i.dateRetour <= dans7 && players.some((p) => p.id === i.joueurId)).length;
  const alerteReunions = (db.reunions || []).filter((r) => (r.date || "") >= todayStr && (r.participants || []).some((p) => (p.email || "").toLowerCase() === (monEmail || "").toLowerCase() && p.email)).length;
  const alerteDemRecues = (demResume && demResume.recues) || 0;
  const alerteDemEnvoyees = (demResume && demResume.envoyees) || 0;
  const alerteSuivi = priseEnChargeMedicale(cat) !== "parents" ? enSuiviMedical : 0;

  const cartes = [
    { titre: "Scores du week-end", sous: "Résultats de toutes les catégories", icon: Trophy, action: onScores, accent: true },
    { titre: "Demandes de joueurs", sous: "Demander un joueur d'une autre catégorie", icon: ArrowRightLeft, action: onDemandes, badge: alerteDemRecues },
    { titre: "Classement du championnat", sous: "District, Ligue, National et Ligue 2 en direct", icon: ListOrdered, action: onClassement },
    { titre: "Demande de transport", sous: "Minibus, bus en location ou voitures, à l'avance", icon: Bus, action: onTransport },
    { titre: "Organisation des matchs", sous: "Terrain, vestiaires, transport et encadrement", icon: MapPin, action: onOrganisation, badge: nbOrga },
    { titre: "Programme de la semaine", sous: "Récapitulatif des matchs à imprimer", icon: ClipboardList, action: onProgramme },
    { titre: "Documents administratifs", sous: "Licences et contrôle médical à surveiller", icon: ShieldAlert, action: onDocuments, badge: alerteDocs },
    { titre: "Suivi médical", sous: "Blessés suivis par l'équipe médicale (U17 aux pros)", icon: Activity, action: priseEnChargeMedicale(cat) !== "parents" ? onSuivi : null, badge: priseEnChargeMedicale(cat) !== "parents" ? enSuiviMedical : 0 },
    { titre: "Bilan de saison de l'équipe", sous: "Résultats, buteurs et passeurs de la saison", icon: Trophy, action: onBilan },
    { titre: "Réunions", sous: "Programmer les réunions et recueillir les présences", icon: Users, action: onReunions, badge: alerteReunions },
    { titre: "Calendrier du club", sous: "Tous les événements, toutes catégories réunies", icon: CalendarDays, action: onCalendrier },
    { titre: "Planning hebdomadaire", sous: "Créneaux d'entraînement de la semaine, par catégorie", icon: CalendarDays, action: onPlanningHebdo },
    { titre: "Planning des vestiaires et terrains", sous: "Réserver terrains et vestiaires par créneau", icon: CalendarDays, action: onPlanning },
    { titre: "Droits d'accès", sous: "Gérer les accès des éducateurs par secteur", icon: ShieldAlert, action: onAcces },
    { titre: "Sauvegarde des données", sous: "Exporter ou restaurer les informations du club", icon: Save, action: onSauvegarde },
  ];

  const stat = (label, val, icon, onClick) => {
    const I = icon;
    return (
      <div onClick={onClick} style={{ background: "#fff", borderRadius: 14, padding: "14px 12px", border: `1px solid ${C.grisClair}`, cursor: onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 6 }}>
        <I size={19} color={C.bleu} />
        <div style={{ fontSize: 24, fontWeight: 900, color: C.encre, lineHeight: 1 }}>{val}</div>
        <div style={{ fontSize: 11.5, color: C.gris, fontWeight: 600 }}>{label}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
        {stat("Joueurs", players.length, Users, () => setTab("effectif"))}
        {stat("Blessés", blesses, HeartPulse, () => setTab("effectif"))}
        {stat("À préparer", nbOrga, MapPin, onOrganisation)}
      </div>

      {prochainMatch && (
        <Card style={{ marginBottom: 18, background: `linear-gradient(150deg, ${C.bleu}, ${C.bleuNuit})`, border: "none", color: "#fff" }} onClick={onOrganisation}>
          <div style={{ fontSize: 11.5, color: C.jaune, fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>PROCHAIN MATCH</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{prochainMatch.lieu === "Domicile" ? CLUB : (prochainMatch.adversaire || "Adversaire")} <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>c.</span> {prochainMatch.lieu === "Domicile" ? (prochainMatch.adversaire || "Adversaire") : CLUB}</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>{prochainMatch.date ? jourLong(prochainMatch.date) : "Date à définir"}{prochainMatch.heure ? ` · ${prochainMatch.heure}` : ""} · {prochainMatch.lieu}</div>
        </Card>
      )}

      {(alerteDemRecues > 0 || alerteDemEnvoyees > 0 || alerteReunions > 0 || alerteDocs > 0 || alerteMutation > 0 || suspendus > 0 || aRisqueSusp > 0 || alerteSuivi > 0 || blesses > 0) && (
        <div style={{ background: "#FFF3DA", border: "1px solid #EBD3AE", borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#B87A2B", fontSize: 13.5, marginBottom: 6 }}><Bell size={16} /> À ne pas oublier</div>
          {alerteDemRecues > 0 && (
            <div onClick={onDemandes} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre }}>
              <ArrowRightLeft size={15} color={C.rouge} /> <span style={{ flex: 1 }}>{alerteDemRecues} demande{alerteDemRecues > 1 ? "s" : ""} de joueur à traiter</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {alerteDemEnvoyees > 0 && (
            <div onClick={onDemandes} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: alerteDemRecues > 0 ? "1px solid #EBD3AE" : "none" }}>
              <ArrowRightLeft size={15} color="#B87A2B" /> <span style={{ flex: 1 }}>{alerteDemEnvoyees} demande{alerteDemEnvoyees > 1 ? "s" : ""} de joueur en attente de réponse</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {alerteReunions > 0 && (
            <div onClick={onReunions} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteDemRecues > 0 || alerteDemEnvoyees > 0) ? "1px solid #EBD3AE" : "none" }}>
              <Users size={15} color={C.bleu} /> <span style={{ flex: 1 }}>{alerteReunions} réunion{alerteReunions > 1 ? "s" : ""} à venir</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {alerteDocs > 0 && (
            <div onClick={onDocuments} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: alerteReunions > 0 ? "1px solid #EBD3AE" : "none" }}>
              <ShieldAlert size={15} color={C.rouge} /> <span style={{ flex: 1 }}>{alerteDocs} joueur{alerteDocs > 1 ? "s" : ""} à régulariser (licence ou contrôle médical)</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {alerteMutation > 0 && (
            <div onClick={onDocuments} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteReunions > 0 || alerteDocs > 0) ? "1px solid #EBD3AE" : "none" }}>
              <ArrowRightLeft size={15} color={C.rouge} /> <span style={{ flex: 1 }}>{alerteMutation} mutation{alerteMutation > 1 ? "s" : ""} hors période au-delà de la limite ({limMutHors})</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {suspendus > 0 && (
            <div onClick={() => setTab("effectif")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteReunions > 0 || alerteDocs > 0 || alerteMutation > 0) ? "1px solid #EBD3AE" : "none" }}>
              <ShieldAlert size={15} color={C.rouge} /> <span style={{ flex: 1 }}>{suspendus} joueur{suspendus > 1 ? "s" : ""} suspendu{suspendus > 1 ? "s" : ""}, bloqué{suspendus > 1 ? "s" : ""} en compo</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {aRisqueSusp > 0 && (
            <div onClick={() => setTab("effectif")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteReunions > 0 || alerteDocs > 0 || alerteMutation > 0 || suspendus > 0) ? "1px solid #EBD3AE" : "none" }}>
              <Bell size={15} color="#B87A2B" /> <span style={{ flex: 1 }}>{aRisqueSusp} joueur{aRisqueSusp > 1 ? "s" : ""} à vérifier (cartons, risque de suspension)</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {alerteSuivi > 0 && onSuivi && (
            <div onClick={onSuivi} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteDemRecues > 0 || alerteDemEnvoyees > 0 || alerteReunions > 0 || alerteDocs > 0 || alerteMutation > 0 || suspendus > 0 || aRisqueSusp > 0) ? "1px solid #EBD3AE" : "none" }}>
              <Activity size={15} color={C.bleu} /> <span style={{ flex: 1 }}>{alerteSuivi} joueur{alerteSuivi > 1 ? "s" : ""} en suivi médical</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {blesses > 0 && (
            <div onClick={() => setTab("entrainements")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: (alerteDemRecues > 0 || alerteDemEnvoyees > 0 || alerteReunions > 0 || alerteDocs > 0 || alerteMutation > 0 || suspendus > 0 || aRisqueSusp > 0 || alerteSuivi > 0) ? "1px solid #EBD3AE" : "none" }}>
              <HeartPulse size={15} color={C.rouge} /> <span style={{ flex: 1 }}>{blesses} joueur{blesses > 1 ? "s" : ""} blessé{blesses > 1 ? "s" : ""} en cours de soin</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
          {retourProche > 0 && (
            <div onClick={() => setTab("entrainements")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre, borderTop: "1px solid #EBD3AE" }}>
              <Activity size={15} color={C.vert} /> <span style={{ flex: 1 }}>{retourProche} joueur{retourProche > 1 ? "s" : ""} dont le retour de blessure est prévu bientôt</span>
              <ChevronLeft size={15} color={C.gris} style={{ transform: "rotate(180deg)" }} />
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.gris, letterSpacing: 1, marginBottom: 10 }}>TABLEAU DE BORD {cat}</div>
      <div style={{ display: "grid", gap: 11 }}>
        {cartes.filter((c) => c.action && (!estMedical || c.titre === "Suivi médical")).map((c) => {
          const I = c.icon;
          return (
            <div key={c.titre} onClick={c.action} style={{
              background: c.accent ? `linear-gradient(150deg, ${C.bleu}, ${C.bleuNuit})` : "#fff",
              color: c.accent ? "#fff" : C.encre,
              borderRadius: 16, padding: 16, border: c.accent ? "none" : `1px solid ${C.grisClair}`,
              boxShadow: "0 1px 3px rgba(10,42,107,0.08)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.accent ? "rgba(255,255,255,0.14)" : "#EEF2F8", display: "grid", placeItems: "center", flex: "0 0 auto", position: "relative" }}>
                <I size={21} color={c.accent ? C.jaune : C.bleu} />
                {c.badge > 0 && <span style={{ position: "absolute", top: -5, right: -5, background: C.rouge, color: "#fff", fontSize: 11, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, display: "grid", placeItems: "center", padding: "0 4px" }}>{c.badge}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>{c.titre}</div>
                <div style={{ fontSize: 12.5, color: c.accent ? "rgba(255,255,255,0.78)" : C.gris, marginTop: 2 }}>{c.sous}</div>
              </div>
              <ChevronLeft size={18} color={c.accent ? "rgba(255,255,255,0.6)" : C.gris} style={{ transform: "rotate(180deg)", flex: "0 0 auto" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ============================================================
   Effectif et fiche joueur
   ============================================================ */
function jumpActif(cat) {
  const info = CATEGORIES.find((c) => c.id === cat);
  if (!info) return false;
  return info.groupe === "Formation" || info.groupe === "PRO" || cat === "U14" || cat === "U15";
}

function statsJoueur(p, db, saison) {
  let minutes = 0, buts = 0, passes = 0, notes = [];
  db.matches.filter((m) => m.cat === p.cat && (!saison || saisonDe(m.date) === saison)).forEach((m) => {
    minutes += (m.tempsJeu && m.tempsJeu[p.id]) || 0;
    buts += (m.buteurs && m.buteurs[p.id]) || 0;
    passes += (m.passeurs && m.passeurs[p.id]) || 0;
    if (m.notes && m.notes[p.id] != null) {
      const nv = typeof m.notes[p.id] === "object" ? m.notes[p.id].note : m.notes[p.id];
      if (nv != null && nv !== "") notes.push(+nv);
    }
  });
  const moy = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
  return { minutes, buts, passes, moy };
}

/* Saison de football en cours (la saison va d'aout a juillet) */
function saisonCourante(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
function saisonSuivante(s) {
  const m = /^(\d{4})-(\d{4})$/.exec(s || "");
  if (!m) return "";
  return `${m[2]}-${+m[2] + 1}`;
}

/* Saison correspondant a une date "AAAA-MM-JJ" */
function saisonDe(dateStr) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split("-").map(Number);
  if (!y || !m) return null;
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/* Controle medical de la saison (regle mineurs : questionnaire de sante ou certificat si exige) */
function statutMedical(p) {
  const saison = saisonCourante();
  if (p.medicalSaison === saison && (p.medicalStatut === "questionnaire" || p.medicalStatut === "certificat")) {
    return { label: p.medicalStatut === "certificat" ? "Certificat fourni" : "Questionnaire fait", couleur: C.vert, urgence: 0 };
  }
  return { label: `À faire (${saison})`, couleur: "#B87A2B", urgence: 1 };
}

/* Mutations : le cachet est valable un an a compter de la date de validation */
function mutationActive(p) {
  if (!p || !p.mutation || p.mutation === "club") return false;
  if (!p.mutationDate) return true;
  const d = new Date(p.mutationDate + "T00:00:00");
  if (isNaN(d)) return true;
  const unAn = new Date(d); unAn.setFullYear(unAn.getFullYear() + 1);
  return new Date() < unAn;
}
/* Nombre de mutes hors periode alignables sur une feuille de match */
function limiteHorsPeriode(cat) {
  const ci = CATEGORIES.find((c) => c.id === cat);
  const senior = ci && (ci.groupe === "PRO" || ci.groupe === "Loisirs" || cat === "N2" || cat === "Ligue 2" || cat === "SENIORS F");
  const national = /NAT/.test(cat || "");
  return (senior || national) ? 2 : 1;
}
/* Nombre total de mutes de base sur une feuille de match (indicatif, hors ajustement arbitrage) */
function limiteMutesTotal(cat) {
  const ci = CATEGORIES.find((c) => c.id === cat);
  const type = ci ? ci.type : 11;
  const senior = ci && (ci.groupe === "PRO" || ci.groupe === "Loisirs" || cat === "N2" || cat === "Ligue 2" || cat === "SENIORS F");
  const national = /NAT/.test(cat || "");
  if (senior || national) return type === 11 ? 6 : 4;
  return 4;
}
/* Comptage des mutations actives d'un effectif */
function compteMutations(players) {
  let normale = 0, hors = 0, expirees = 0, sansdate = 0;
  (players || []).forEach((p) => {
    const t = typeMutation(p);
    if (t === "club") return;
    if (t === "expiree") { expirees++; return; }
    if (t === "hors") hors++;
    else if (t === "normale") normale++;
    else if (t === "sansdate") sansdate++;
  });
  return { normale, hors, expirees, sansdate, total: normale + hors + sansdate };
}
/* Type reel d'une mutation, calcule selon la date de validation.
   Periode normale : du 1er juin au 15 juillet. Sinon hors periode. */
function typeMutation(p) {
  if (!p || !p.mutation || p.mutation === "club") return "club";
  if (!mutationActive(p)) return "expiree";
  if (!p.mutationDate) return "sansdate";
  const d = new Date(p.mutationDate + "T00:00:00");
  if (isNaN(d)) return "sansdate";
  const mois = d.getMonth() + 1, jour = d.getDate();
  const periodeNormale = (mois === 6) || (mois === 7 && jour <= 15);
  return periodeNormale ? "normale" : "hors";
}
/* Libelle d'affichage du statut de mutation d'un joueur */
function libelleMutation(p) {
  const t = typeMutation(p);
  if (t === "club") return { label: "Licence club", couleur: C.gris, bg: C.grisClair };
  if (t === "expiree") return { label: "Mutation expirée", couleur: C.gris, bg: C.grisClair };
  if (t === "sansdate") return { label: "Mutation, date à renseigner", couleur: "#B87A2B", bg: "#FBEAD9" };
  if (t === "hors") return { label: "Mutation hors période", couleur: "#B87A2B", bg: "#FBEAD9" };
  return { label: "Mutation période normale", couleur: C.bleu, bg: "#E7EEF6" };
}

/* Instantane d'un joueur pour une saison, a ranger dans son parcours */
function instantaneSaison(p, db, saison) {
  const st = statsJoueur(p, db, saison);
  const nbMatchs = db.matches.filter((m) => m.cat === p.cat && m.tempsJeu && m.tempsJeu[p.id]).length;
  const tests = p.tests || [];
  const dernierTest = tests.length ? tests[tests.length - 1] : null;
  const blessures = db.injuries.filter((i) => i.joueurId === p.id).map((b) => ({ zone: b.zone, duree: b.duree, fini: !!b.fini }));
  return {
    saison, cat: p.cat,
    stats: { matchs: nbMatchs, buts: st.buts, passes: st.passes, minutes: st.minutes, moy: st.moy },
    taille: p.taille || "", poids: p.poids || "",
    tests: dernierTest ? { vma: dernierTest.vma || "", v10: dernierTest.v10 || "", v20: dernierTest.v20 || "", cmj: dernierTest.cmj || "" } : null,
    jonglages: p.jonglages ? { ...p.jonglages } : null,
    blessures,
    dateArchive: hoyISO(),
  };
}

/* Saison correspondant aux donnees d'une categorie (d'apres les dates des matchs et seances) */
function saisonDuBlob(blob) {
  const dates = [];
  (blob.matches || []).forEach((m) => { if (m.date) dates.push(m.date); });
  (blob.trainings || []).forEach((t) => { if (t.date) dates.push(t.date); });
  if (!dates.length) return saisonCourante();
  dates.sort();
  return saisonDe(dates[dates.length - 1]) || saisonCourante();
}

/* Assiduite d'un joueur sur une saison : matchs joues, presences, absences, retards */
function assiduiteJoueur(p, db, saison) {
  let matchs = 0, presences = 0, absences = 0, retards = 0, jaunes = 0, rouges = 0;
  (db.matches || []).forEach((m) => {
    if (m.cat !== p.cat) return;
    if (saison && saisonDe(m.date) !== saison) return;
    if (!(m.type || "").toLowerCase().includes("amical") && m.tempsJeu && m.tempsJeu[p.id]) matchs++;
    if (m.jaunes && m.jaunes[p.id]) jaunes += (+m.jaunes[p.id] || 0);
    if (m.rouges && m.rouges[p.id]) rouges += 1;
  });
  (db.trainings || []).forEach((t) => {
    if (t.cat !== p.cat) return;
    if (saison && saisonDe(t.date) !== saison) return;
    const st = t.presence && t.presence[p.id];
    if (st === "present" || st === "retard") presences++;
    if (st === "absent" || st === "malade") absences++;
    if (st === "retard") retards++;
  });
  return { matchs, presences, absences, retards, jaunes, rouges };
}

/* Suspensions : seuil de cartons jaunes selon la competition */
function seuilSuspension(cat) { return cat === "Ligue 2" ? 5 : 3; }
/* Cartons non encore pris en compte pour une suspension */
function cartonsActifsJoueur(p, db) {
  const a = assiduiteJoueur(p, db, saisonCourante());
  const ref = (p && p.discRef) || { jaunes: 0, rouges: 0 };
  return { jaunes: Math.max(0, a.jaunes - (ref.jaunes || 0)), rouges: Math.max(0, a.rouges - (ref.rouges || 0)) };
}
/* Avertissements actifs selon le barème FFF : cartons jaunes reçus sur des matchs
   différents dans les 3 derniers mois (prescription), révoqués après une suspension.
   Ligue 2 : cumul sur la saison sans prescription (règle LFP). */
function jaunesActifsRegle(p, db) {
  if (!p) return 0;
  const sansPrescription = p.cat === "Ligue 2";
  const limite = sansPrescription ? "0000-00-00" : addDays(hoyISO(), -92);
  const revoc = p.discDate && p.discDate > limite ? p.discDate : limite;
  let n = 0;
  (db.matches || []).forEach((m) => {
    // un avertissement simple = 1 jaune. Deux jaunes dans un même match valent une exclusion (rouge), pas deux avertissements.
    if (m.cat === p.cat && m.date && m.date > revoc && m.jaunes && (+(m.jaunes[p.id] || 0)) === 1) n++;
  });
  return n;
}
/* Carton rouge actif : rouge direct ou deux jaunes dans un même match (exclusion), non révoqué */
function rougeActif(p, db) {
  if (!p) return false;
  const sansPrescription = p.cat === "Ligue 2";
  const limite = sansPrescription ? "0000-00-00" : addDays(hoyISO(), -92);
  const revoc = p.discDate && p.discDate > limite ? p.discDate : limite;
  let r = false;
  (db.matches || []).forEach((m) => {
    if (m.cat !== p.cat || !m.date || m.date <= revoc) return;
    if ((+((m.jaunes && m.jaunes[p.id]) || 0)) >= 2) r = true;
    if (m.rouges && m.rouges[p.id]) r = true;
  });
  return r;
}
/* Detail des cartons actifs, pour l'affichage : avertissements simples, exclusions (2 jaunes), rouges directs */
function cartonsDetail(p, db) {
  if (!p) return { jaunes: 0, exclusions: 0, rouges: 0 };
  const sansPrescription = p.cat === "Ligue 2";
  const limite = sansPrescription ? "0000-00-00" : addDays(hoyISO(), -92);
  const revoc = p.discDate && p.discDate > limite ? p.discDate : limite;
  let jaunes = 0, exclusions = 0, rouges = 0;
  (db.matches || []).forEach((m) => {
    if (m.cat !== p.cat || !m.date || m.date <= revoc) return;
    const j = +((m.jaunes && m.jaunes[p.id]) || 0);
    if (j >= 2) exclusions++;
    else if (j === 1) jaunes++;
    if (m.rouges && m.rouges[p.id]) rouges++;
  });
  return { jaunes, exclusions, rouges };
}
function estSuspendu(p) {
  if (!p) return false;
  // la date de disponibilité fait foi : purge automatique une fois la date passée
  if (p.suspensionFin) return p.suspensionFin >= hoyISO();
  // pas de date renseignée : suspendu tant qu'il reste des matchs à purger
  return (+p.suspension || 0) > 0;
}
/* Risque de suspension a verifier, selon les cartons cumules */
function risqueSuspension(p, db, cat) {
  if (estSuspendu(p)) return { alerte: false };
  const j = jaunesActifsRegle(p, db);
  const seuil = seuilSuspension(cat);
  if (rougeActif(p, db)) return { alerte: true, raison: "carton rouge à traiter" };
  if (j >= seuil) return { alerte: true, raison: `${j} avertissements retenus sur 3 mois (seuil ${seuil})` };
  return { alerte: false };
}

function Effectif({ players, cat, catInfo, db, mutate, lectureSeule }) {
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [tri, setTri] = useState("nom");
  const [cloture, setCloture] = useState(false);

  const liste = players
    .filter((p) => `${p.prenom} ${p.nom} ${p.poste || ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (tri === "numero") return (a.numero || 99) - (b.numero || 99);
      if (tri === "poste") return (a.poste || "zzz").localeCompare(b.poste || "zzz");
      return `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`);
    });

  const ficheJoueur = fiche ? players.find((p) => p.id === fiche) : null;

  function cloturerSaison() {
    const saison = saisonCourante();
    mutate((d) => {
      d.players.forEach((p) => {
        if (p.cat !== cat) return;
        p.parcours = p.parcours || [];
        if (p.parcours.some((s) => s.saison === saison)) return;
        p.parcours.unshift(instantaneSaison(p, d, saison));
      });
      return d;
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={17} color={C.gris} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un joueur" style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        {!lectureSeule && <Btn variant="accent" onClick={() => setEdit({ cat })}><Plus size={18} /></Btn>}
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
        {[["nom", "Nom"], ["numero", "Numéro"], ["poste", "Poste"]].map(([k, lab]) => (
          <button key={k} onClick={() => setTri(k)} style={{
            border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 700,
            background: tri === k ? C.bleu : "#fff", color: tri === k ? "#fff" : C.gris, boxShadow: "0 1px 2px rgba(10,42,107,0.06)",
          }}>{lab}</button>
        ))}
      </div>

      {liste.length === 0 ? (
        <Empty icon={<Users size={24} color={C.gris} />} text="Aucun joueur" sub="Touche + pour ajouter un joueur à l'effectif" />
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {liste.map((p) => {
            const bless = db.injuries.some((i) => i.joueurId === p.id && !i.fini);
            const st = statsJoueur(p, db, saisonCourante());
            const cd = cartonsDetail(p, db);
            const susp = estSuspendu(p);
            const bj = { width: 11, height: 15, borderRadius: 2, background: "#F2C200", display: "inline-block", border: "1px solid #D9AE00" };
            const br = { width: 11, height: 15, borderRadius: 2, background: "#D33A2C", display: "inline-block", border: "1px solid #B5483F" };
            const bjNum = (n, key) => (
              <span key={key} style={{ position: "relative", display: "inline-block", width: 11, height: 15 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: 2, background: "#F2C200", border: "1px solid #D9AE00" }} />
                <span style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", fontSize: 8.5, fontWeight: 900, color: C.encre, background: "#fff", border: "1px solid #E6E9EE", borderRadius: 7, width: 13, height: 13, lineHeight: "12px", textAlign: "center", boxSizing: "border-box" }}>{n}</span>
              </span>
            );
            const cartonsRow = (() => {
              const items = [];
              if (cd.jaunes > 0) items.push(bjNum(cd.jaunes, "j"));
              for (let i = 0; i < cd.exclusions; i++) {
                items.push(bjNum(2, "ej" + i));
                items.push(<span key={"er" + i} style={br} />);
              }
              if (cd.rouges > 0) {
                items.push(<span key="r" style={br} />);
                if (cd.rouges > 1) items.push(<span key="rn" style={{ fontSize: 11, fontWeight: 900, color: C.encre }}>{cd.rouges}</span>);
              }
              if (susp && cd.rouges === 0 && cd.exclusions === 0) items.push(<span key="s" style={br} />);
              return items.length ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{items}</span> : null;
            })();
            return (
              <Card key={p.id} onClick={() => setFiche(p.id)} style={{ display: "flex", alignItems: "center", gap: 13, padding: 12 }}>
                <div style={{ position: "relative", flex: "0 0 auto" }}>
                  <Avatar p={p} size={50} />
                  {p.numero != null && p.numero !== "" && (
                    <span style={{ position: "absolute", bottom: -3, right: -3, background: C.jaune, color: C.bleuNuit, fontSize: 11, fontWeight: 900, minWidth: 19, height: 19, borderRadius: 10, display: "grid", placeItems: "center", border: "2px solid #fff" }}>{p.numero}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{p.prenom} {p.nom}</span>
                    {bless && <HeartPulse size={14} color={C.rouge} style={{ verticalAlign: "middle" }} />}
                    {cartonsRow}
                    {susp && <span style={{ fontSize: 10.5, fontWeight: 800, color: C.rouge, background: "#FBE3E3", borderRadius: 6, padding: "1px 6px" }}>Suspendu</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.gris, marginTop: 1 }}>{p.poste || "Poste non défini"}{p.pied ? ` · ${p.pied}` : ""}</div>
                </div>
                <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                  <div style={{ fontSize: 12, color: C.gris }}>{st.buts} b · {st.passes} p</div>
                  {st.moy != null && <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu }}>{st.moy.toFixed(1)}/7</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {players.length > 0 && !lectureSeule && (
        <Btn variant="ghost" full style={{ marginTop: 16 }} onClick={() => setCloture(true)}><CalendarDays size={16} /> Clôturer la saison {saisonCourante()}</Btn>
      )}

      {edit && <EditJoueur joueur={edit} cat={cat} onClose={() => setEdit(null)} onSave={(j) => {
        mutate((d) => {
          if (j.id) { const i = d.players.findIndex((x) => x.id === j.id); d.players[i] = j; }
          else d.players.push({ ...j, id: uid() });
          return d;
        });
        setEdit(null);
      }} />}

      {ficheJoueur && <FicheJoueur p={ficheJoueur} db={db} mutate={mutate} lectureSeule={lectureSeule} onClose={() => setFiche(null)} onEdit={() => { setEdit(ficheJoueur); setFiche(null); }} onDelete={() => {
        mutate((d) => { d.players = d.players.filter((x) => x.id !== ficheJoueur.id); return d; });
        setFiche(null);
      }} />}

      {cloture && (
        <Modal title={`Clôturer la saison ${saisonCourante()}`} onClose={() => setCloture(false)}
          footer={<><Btn variant="ghost" full onClick={() => setCloture(false)}>Annuler</Btn><Btn variant="accent" full onClick={() => { cloturerSaison(); setCloture(false); }}><Save size={16} /> Archiver le groupe</Btn></>}>
          <div style={{ fontSize: 13.5, color: C.encre, lineHeight: 1.55 }}>
            Cette action range la saison {saisonCourante()} dans le parcours de chaque joueur du groupe {cat} : catégorie, statistiques, taille, poids, tests et blessures.
            <div style={{ marginTop: 8 }}>Les joueurs et leurs données restent en place. Tu retrouveras l'historique dans chaque fiche, rubrique Parcours.</div>
          </div>
        </Modal>
      )}
    </div>
  );
}


function CarteSaisonParcours({ s, precedente }) {
  const [ouverte, setOuverte] = useState(false);
  const delta = (actuel, prec, unite) => {
    if (prec == null || prec === "" || actuel === "" || actuel == null) return null;
    const d = +actuel - +prec;
    if (!d) return <span style={{ fontSize: 11.5, color: C.gris }}> =</span>;
    return <span style={{ fontSize: 11.5, fontWeight: 800, color: d > 0 ? C.vert : C.rouge }}> {d > 0 ? "+" : ""}{d}{unite}</span>;
  };
  return (
    <Card style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOuverte((o) => !o)} style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 11.5, flex: "0 0 auto" }}>{s.cat}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.encre }}>Saison {s.saison}</div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 1 }}>{s.stats.buts} buts · {s.stats.passes} passes{s.stats.moy != null ? ` · note ${(+s.stats.moy).toFixed(1)}/7` : ""}</div>
        </div>
        <ChevronLeft size={17} color={C.gris} style={{ transform: ouverte ? "rotate(90deg)" : "rotate(-90deg)", flex: "0 0 auto" }} />
      </button>
      {ouverte && (
        <div style={{ padding: "0 12px 13px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 12 }}>
            {[["Matchs", s.stats.matchs], ["Minutes", s.stats.minutes], ["Buts", s.stats.buts], ["Passes", s.stats.passes]].map(([l, v]) => (
              <div key={l} style={{ background: C.fond, borderRadius: 10, padding: "9px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.bleu }}>{v != null ? v : 0}</div>
                <div style={{ fontSize: 10, color: C.gris, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 18, marginBottom: s.tests ? 12 : 0, fontSize: 13 }}>
            <div>Taille <strong>{s.taille || "n.c."}{s.taille ? " cm" : ""}</strong>{delta(s.taille, precedente ? precedente.taille : null, " cm")}</div>
            <div>Poids <strong>{s.poids || "n.c."}{s.poids ? " kg" : ""}</strong>{delta(s.poids, precedente ? precedente.poids : null, " kg")}</div>
          </div>
          {s.tests && (s.tests.vma || s.tests.v10) && (
            <div style={{ display: "flex", gap: 18, marginBottom: (s.blessures && s.blessures.length) ? 12 : 0, fontSize: 13 }}>
              {s.tests.vma ? <div>VMA <strong>{s.tests.vma} km/h</strong>{delta(s.tests.vma, (precedente && precedente.tests) ? precedente.tests.vma : null, "")}</div> : null}
              {s.tests.v10 ? <div>10 m <strong>{s.tests.v10} s</strong></div> : null}
            </div>
          )}
          {s.blessures && s.blessures.length > 0 && s.blessures.map((b, i) => (
            <div key={i} style={{ fontSize: 12.5, color: C.encre, background: "#FBE3E3", borderRadius: 9, padding: "6px 10px", marginBottom: 5 }}>
              {b.zone || "Blessure"}{b.duree ? <span style={{ color: C.gris }}> · arret {b.duree}</span> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CarteBilan({ b, onEdit }) {
  const [ouverte, setOuverte] = useState(false);
  const bloc = (titre, val) => val ? (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: C.gris, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 }}>{titre}</div>
      <div style={{ fontSize: 13.5, color: C.encre, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{val}</div>
    </div>
  ) : null;
  return (
    <Card style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOuverte((o) => !o)} style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", padding: 12, display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", flex: "0 0 auto" }}><ClipboardList size={17} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.encre }}>{b.date ? fmtDate(b.date) : "Bilan"}</div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 1 }}>{b.educateur ? `Par ${b.educateur}` : "Éducateur non précisé"}</div>
        </div>
        <ChevronLeft size={17} color={C.gris} style={{ transform: ouverte ? "rotate(90deg)" : "rotate(-90deg)", flex: "0 0 auto" }} />
      </button>
      {ouverte && (
        <div style={{ padding: "0 12px 13px" }}>
          {bloc("Appréciation générale", b.appreciation)}
          {bloc("Points forts", b.pointsForts)}
          {bloc("Axes de progrès", b.axesProgres)}
          {bloc("Objectifs", b.objectifs)}
          {bloc("Comportement et état d'esprit", b.comportement)}
          {bloc("Entretien avec le joueur ou les parents", b.entretien)}
          <Btn variant="ghost" size="sm" onClick={onEdit} style={{ marginTop: 4 }}><Edit3 size={15} /> Modifier ce bilan</Btn>
        </div>
      )}
    </Card>
  );
}

function EditBilan({ bilan, educateurs, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ date: "", educateur: "", appreciation: "", pointsForts: "", axesProgres: "", objectifs: "", comportement: "", entretien: "", ...bilan });
  const [autre, setAutre] = useState(!!bilan.educateur && educateurs.length > 0 && !educateurs.includes(bilan.educateur));
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const LIM = { appreciation: 300, pointsForts: 220, axesProgres: 220, objectifs: 200, comportement: 180, entretien: 300 };
  const zone = (k, rows) => (
    <div>
      <textarea value={f[k] || ""} maxLength={LIM[k]} onChange={(e) => set(k, e.target.value)} rows={rows} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      <div style={{ fontSize: 11, color: (f[k] || "").length >= LIM[k] ? C.rouge : C.gris, textAlign: "right", marginTop: 2 }}>{(f[k] || "").length} / {LIM[k]} caractères</div>
    </div>
  );
  return (
    <Modal title={bilan.id ? "Modifier le bilan" : "Nouveau bilan"} onClose={onClose}
      footer={<><Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>{onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}</>}>
      <Field label="Date du bilan"><Inp type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Éducateur (qui a fait le bilan)">
        {educateurs.length > 0 && !autre ? (
          <Sel value={f.educateur} onChange={(e) => { if (e.target.value === "__autre__") { setAutre(true); set("educateur", ""); } else set("educateur", e.target.value); }}>
            <option value="">Choisir</option>
            {educateurs.map((n) => <option key={n}>{n}</option>)}
            <option value="__autre__">Autre (saisir)</option>
          </Sel>
        ) : (
          <Inp value={f.educateur} onChange={(e) => set("educateur", e.target.value)} placeholder="Nom de l'éducateur" />
        )}
      </Field>
      <Field label="Appréciation générale">{zone("appreciation", 3)}</Field>
      <Field label="Points forts">{zone("pointsForts", 2)}</Field>
      <Field label="Axes de progrès">{zone("axesProgres", 2)}</Field>
      <Field label="Objectifs pour la suite">{zone("objectifs", 2)}</Field>
      <Field label="Comportement et état d'esprit">{zone("comportement", 2)}</Field>
      <Field label="Entretien avec le joueur ou les parents">{zone("entretien", 3)}</Field>
    </Modal>
  );
}

function FicheJoueur({ p, db, mutate, lectureSeule, onClose, onEdit, onDelete }) {
  const [confirmer, setConfirmer] = useState(false);
  const [testEdit, setTestEdit] = useState(false);
  const [pdfMsg, setPdfMsg] = useState(null);
  const [saisonSel, setSaisonSel] = useState(saisonCourante());
  const [bilanEdit, setBilanEdit] = useState(null);
  const saisonsJoueur = (() => {
    const set = new Set();
    db.matches.forEach((m) => {
      if (m.cat === p.cat && ((m.tempsJeu && m.tempsJeu[p.id]) || (m.buteurs && m.buteurs[p.id]) || (m.notes && m.notes[p.id]))) {
        const s = saisonDe(m.date); if (s) set.add(s);
      }
    });
    (p.parcours || []).forEach((x) => { if (x.saison) set.add(x.saison); });
    (p.bilans || []).forEach((b) => { const s = saisonDe(b.date); if (s) set.add(s); });
    set.add(saisonCourante());
    return [...set].sort().reverse();
  })();
  function statsSaison(saison) {
    const arch = (p.parcours || []).find((x) => x.saison === saison);
    if (arch && arch.stats && saison !== saisonCourante()) {
      return { minutes: arch.stats.minutes || 0, buts: arch.stats.buts || 0, passes: arch.stats.passes || 0, moy: arch.stats.moy != null ? arch.stats.moy : null };
    }
    return statsJoueur(p, db, saison);
  }
  const stats = statsSaison(saisonSel);
  const educateurs = (db.encadrement || []).map((e) => e.nom).filter(Boolean);
  const bilansSaison = (p.bilans || []).filter((b) => saisonDe(b.date) === saisonSel).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const assi = assiduiteJoueur(p, db, saisonSel);
  const nbSeancesSaison = (db.trainings || []).filter((t) => t.cat === p.cat && saisonDe(t.date) === saisonSel && t.presence && Object.keys(t.presence).length > 0).length;
  const nbMatchsEquipe = (db.matches || []).filter((m) => m.cat === p.cat && saisonDe(m.date) === saisonSel && m.scorePour != null && m.scoreContre != null && !(m.type || "").toLowerCase().includes("amical")).length;
  const moyGroupe = (() => {
    const moys = [];
    (db.players || []).filter((x) => x.cat === p.cat).forEach((j) => { const s = statsJoueur(j, db, saisonSel); if (s && s.moy != null) moys.push(s.moy); });
    return moys.length ? { moy: moys.reduce((a, b) => a + b, 0) / moys.length, n: moys.length } : null;
  })();
  const tauxSaison = nbSeancesSaison ? Math.round((assi.presences / nbSeancesSaison) * 100) : null;
  const cartonsActifs = (() => { const ci = CATEGORIES.find((x) => x.id === p.cat); return (ci && ci.type === 11) || p.cat === "U13"; })();
  const tests = (p.tests || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const blessures = db.injuries.filter((i) => i.joueurId === p.id && (!i.debut || saisonDe(i.debut) === saisonSel));
  const age = ageOf(p.dob);

  // Colonne du milieu centrée et alignée de façon identique sur toutes les fiches
  const info = (icon, label, val) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: `1px solid ${C.grisClair}` }}>
      <div style={{ color: C.bleu, width: 22, flex: "0 0 auto", display: "flex", justifyContent: "center" }}>{icon}</div>
      <span style={{ fontSize: 13.5, color: C.gris, width: 150, flex: "0 0 auto", textAlign: "center" }}>{label}</span>
      <strong style={{ fontSize: 14.5, flex: 1, textAlign: "right" }}>{val || "n.c."}</strong>
    </div>
  );

  async function telechargerPDF() {
    setPdfMsg("Préparation du PDF...");
    try {
      const jsPDF = await chargerJsPDF();
      exporterFichePDF(jsPDF, p, db, tests, stats, bilansSaison.slice(0, 1), saisonSel);
      setPdfMsg(null);
    } catch (e) {
      setPdfMsg("Téléchargement du module PDF impossible (vérifie la connexion). Réessaie.");
    }
  }

  return (
    <Modal title="Fiche joueur" onClose={onClose}
      footer={lectureSeule ? null :
        <>
          <Btn variant="ghost" onClick={onEdit} full><Edit3 size={16} /> Modifier</Btn>
          <Btn variant="danger" onClick={() => setConfirmer(true)}><Trash2 size={16} /></Btn>
        </>
      }>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <PhotoFiche p={p} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>{p.prenom} {p.nom}</div>
          <div style={{ fontSize: 13, color: C.gris, marginTop: 2 }}>{p.poste || "Poste non défini"}{age != null ? ` · ${p.cat} · ${age} ans` : ` · ${p.cat}`}{p.numero ? ` · N° ${p.numero}` : ""}</div>
        </div>
      </div>

      <Btn variant="accent" full style={{ marginBottom: 16 }} onClick={telechargerPDF}><FileDown size={16} /> Exporter la fiche en PDF</Btn>
      {pdfMsg && <div style={{ fontSize: 12.5, color: pdfMsg.includes("impossible") ? C.rouge : C.gris, marginTop: -8, marginBottom: 14, textAlign: "center" }}>{pdfMsg}</div>}

      <Card style={{ marginBottom: 14 }}>
        {info(<CalendarDays size={17} />, "Date de naissance", p.dob ? `${new Date(p.dob + "T00:00:00").toLocaleDateString("fr-FR")}${age != null ? ` (${age} ans)` : ""}` : null)}
        {info(<Ruler size={17} />, "Taille", p.taille ? `${p.taille} cm` : null)}
        {info(<Weight size={17} />, "Poids", p.poids ? `${p.poids} kg` : null)}
        {info(<Footprints size={17} />, "Pied fort", p.pied)}
        {info(<Target size={17} />, "Poste", p.poste)}
        {info(<Trophy size={17} />, "Numéro de maillot", p.numero)}
        {info(<ClipboardList size={17} />, "Numéro de licence", p.licence)}
        {info(<ShieldAlert size={17} />, "Club", p.club || "FCSM")}
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "4px 0 8px", fontWeight: 800, color: C.bleu }}>
        <Phone size={16} /> Parents / responsable
      </div>
      <Card style={{ marginBottom: 14 }}>
        {info(<Users size={17} />, "Responsable", p.parentNom)}
        {info(<Phone size={17} />, "Téléphone", p.parentTel)}
        {info(<MapPin size={17} />, "Contact", p.parentEmail)}
      </Card>

      <div style={{ fontWeight: 800, color: C.bleu, display: "flex", alignItems: "center", gap: 7, margin: "4px 0 8px" }}><ClipboardList size={16} /> Administratif</div>
      {(() => {
        const sc = statutMedical(p);
        const licBg = p.licenceStatut === "Valide" ? "#E2F4E9" : p.licenceStatut ? "#FBEAD9" : C.grisClair;
        const licCol = p.licenceStatut === "Valide" ? C.vert : p.licenceStatut ? "#B87A2B" : C.gris;
        const cerBg = sc.urgence >= 2 ? "#FBE3E3" : sc.urgence === 1 ? "#FBEAD9" : sc.urgence === 0 ? "#E2F4E9" : C.grisClair;
        return (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 13.5, color: C.gris }}>Licence</span>
              <Pastille bg={licBg} color={licCol}>{p.licenceStatut || "Non renseignée"}</Pastille>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "4px 0", borderTop: `1px solid ${C.grisClair}` }}>
              <span style={{ fontSize: 13.5, color: C.gris }}>Contrôle médical de la saison</span>
              <Pastille bg={cerBg} color={sc.couleur}>{sc.label}</Pastille>
            </div>
            {(() => { const lm = libelleMutation(p); return (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "4px 0", borderTop: `1px solid ${C.grisClair}` }}>
                <span style={{ fontSize: 13.5, color: C.gris }}>Mutation{p.mutationDate ? ` · validée le ${new Date(p.mutationDate + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}</span>
                <Pastille bg={lm.bg} color={lm.couleur}>{lm.label}</Pastille>
              </div>
            ); })()}
          </Card>
        );
      })()}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 0 8px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.gris }}>Statistiques{saisonsJoueur.length <= 1 ? ` de la saison ${saisonSel}` : ""}</span>
        {saisonsJoueur.length > 1 && (
          <select value={saisonSel} onChange={(e) => setSaisonSel(e.target.value)} style={{ border: `1px solid ${C.grisClair}`, borderRadius: 9, padding: "5px 9px", fontSize: 12.5, fontWeight: 700, color: C.encre, background: "#fff" }}>
            {saisonsJoueur.map((s) => <option key={s} value={s}>{s === saisonCourante() ? `${s} (en cours)` : s}</option>)}
          </select>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 12 }}>
        {[["Matchs", nbMatchsEquipe >= assi.matchs && nbMatchsEquipe > 0 ? `${assi.matchs}/${nbMatchsEquipe}` : assi.matchs], ["Minutes", stats.minutes], ["Buts", stats.buts], ["Passes", stats.passes], ["Note", stats.moy != null ? stats.moy.toFixed(1) : "-"]].map(([l, v]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 4px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.bleu }}>{v}</div>
            <div style={{ fontSize: 9.5, color: C.gris, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {moyGroupe && (
        <div style={{ background: "#EAF0F7", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 12.5, lineHeight: 1.5 }}>
          <span style={{ color: C.gris }}>Note moyenne du groupe : </span>
          <span style={{ fontWeight: 800, color: C.bleu }}>{moyGroupe.moy.toFixed(1)}</span>
          <span style={{ color: C.gris }}> · sur {moyGroupe.n} joueur{moyGroupe.n > 1 ? "s" : ""} noté{moyGroupe.n > 1 ? "s" : ""} de la catégorie.</span>
          {stats.moy != null && (
            <span style={{ fontWeight: 700, color: stats.moy >= moyGroupe.moy ? C.vert : "#B87A2B" }}> {p.prenom} est {stats.moy >= moyGroupe.moy ? "au-dessus" : "en dessous"} de la moyenne du groupe.</span>
          )}
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, margin: "0 0 6px" }}>Assiduité{nbSeancesSaison ? ` · sur ${nbSeancesSaison} séance${nbSeancesSaison > 1 ? "s" : ""} · ${tauxSaison}% de présence` : ""}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[["Présences", nbSeancesSaison ? `${assi.presences} / ${nbSeancesSaison}` : `${assi.presences}`, C.vert], ["Absences", assi.absences, C.rouge], ["Retards", assi.retards, C.jauneFonce]].map(([l, v, col]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div>
            <div style={{ fontSize: 10.5, color: C.gris, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {(cartonsActifs || assi.jaunes > 0 || assi.rouges > 0) && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, margin: "0 0 6px" }}>Discipline</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 6 }}>
            {[["Avertissements retenus", jaunesActifsRegle(p, db), "#E3B505"], ["Cartons rouges", assi.rouges, C.rouge]].map(([l, v, col]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div>
                <div style={{ fontSize: 10.5, color: C.gris, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.gris, marginBottom: 14, lineHeight: 1.5 }}>Avertissements retenus selon le barème FFF : cartons jaunes des 3 derniers mois{p.cat === "Ligue 2" ? " (Ligue 2 : cumul saison, seuil 5)" : ` (suspension à ${seuilSuspension(p.cat)})`}. Total de la saison : {assi.jaunes} jaune{assi.jaunes > 1 ? "s" : ""}. Les avertissements sont effacés après une suspension.</div>
          {(() => {
            const risque = risqueSuspension(p, db, p.cat);
            const cAct = cartonsActifsJoueur(p, db);
            const susp = +p.suspension || 0;
            const setSusp = (delta) => mutate((d) => {
              const pl = d.players.find((x) => x.id === p.id);
              const N = Math.max(0, (+pl.suspension || 0) + delta);
              pl.suspension = N;
              if (N > 0) {
                pl.discDate = hoyISO(); // toute suspension ferme révoque les avertissements
                const prochains = (d.matches || []).filter((m) => m.cat === pl.cat && m.date && m.date >= hoyISO()).sort((a, b) => a.date.localeCompare(b.date));
                if (prochains.length >= N) pl.suspensionFin = prochains[N - 1].date;
              } else {
                pl.suspensionFin = "";
              }
              return d;
            });
            const marquerVus = () => mutate((d) => { const pl = d.players.find((x) => x.id === p.id); const a = assiduiteJoueur(pl, d, saisonCourante()); pl.discRef = { jaunes: a.jaunes, rouges: a.rouges }; return d; });
            const setDateFin = (v) => mutate((d) => { const pl = d.players.find((x) => x.id === p.id); pl.suspensionFin = v || ""; return d; });
            const bloque = estSuspendu(p);
            const dispoTxt = p.suspensionFin ? `disponible le ${new Date(p.suspensionFin + "T00:00:00").toLocaleDateString("fr-FR")}` : "";
            return (
              <div style={{ marginBottom: 16 }}>
                {risque.alerte && (
                  <div style={{ background: "#FBE3E3", border: `1px solid ${C.rouge}`, color: C.rouge, borderRadius: 10, padding: 10, fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
                    Risque de suspension : {risque.raison}. Vérifie auprès de la commission, puis règle le nombre de matchs ci-dessous.
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#fff", borderRadius: 12, padding: "11px 12px", border: `1px solid ${bloque ? C.rouge : C.grisClair}` }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Suspension</div>
                    <div style={{ fontSize: 12, color: bloque ? C.rouge : C.gris }}>{bloque ? ("Bloqué en compo" + (susp > 0 ? `, ${susp} match${susp > 1 ? "s" : ""} à purger` : "") + (dispoTxt ? `, ${dispoTxt}` : "")) : "Aucune suspension"}</div>
                  </div>
                  <Compteur label="" val={susp} onMinus={() => setSusp(-1)} onPlus={() => setSusp(1)} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Field label="Disponible le (fin de suspension)"><Inp type="date" value={p.suspensionFin || ""} onChange={(e) => setDateFin(e.target.value)} /></Field>
                </div>
                <div style={{ fontSize: 11.5, color: C.gris, marginTop: 2, lineHeight: 1.5 }}>Indique le nombre de matchs de suspension : la date de disponibilité se calcule automatiquement d'après le calendrier de la catégorie. La suspension et le carton rouge disparaissent tout seuls une fois cette date passée. Tu peux aussi ajuster la date à la main.</div>
              </div>
            );
          })()}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 8px" }}>
        <div style={{ fontWeight: 800, color: C.bleu, display: "flex", alignItems: "center", gap: 7 }}><Gauge size={16} /> Tests physiques</div>
        <button onClick={() => setTestEdit(true)} style={{ background: "none", border: "none", color: C.bleu, cursor: "pointer", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Nouveau test</button>
      </div>
      {tests.length === 0 ? (
        <Card style={{ marginBottom: 14, textAlign: "center", color: C.gris, fontSize: 13, padding: 18 }}>Aucun test enregistré</Card>
      ) : (
        <Card style={{ marginBottom: 14 }}>
          <GraphTests tests={tests} cat={p.cat} />
        </Card>
      )}

      {jumpActif(p.cat) && (
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: -8, marginBottom: 14, lineHeight: 1.5 }}>
          Tests de détente (SJ, CMJ, CMJB, DJ) et vitesse suivis pour les catégories de formation et professionnelles.
        </div>
      )}

      {blessures.length > 0 && (
        <>
          <div style={{ fontWeight: 800, color: C.bleu, display: "flex", alignItems: "center", gap: 7, margin: "4px 0 8px" }}><HeartPulse size={16} /> Suivi blessures</div>
          <Card style={{ marginBottom: 8 }}>
            {blessures.map((b, i) => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < blessures.length - 1 ? `1px solid ${C.grisClair}` : "none" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.zone || "Blessure"}</div>
                  <div style={{ fontSize: 12, color: C.gris }}>{b.debut ? `Depuis le ${new Date(b.debut + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.duree ? ` · arrêt estimé ${b.duree}` : ""}</div>
                </div>
                <Pastille bg={b.fini ? "#E2F4E9" : "#FBE3E3"} color={b.fini ? C.vert : C.rouge}>{b.fini ? "Rétabli" : "En cours"}</Pastille>
              </div>
            ))}
          </Card>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 8px" }}>
        <div style={{ fontWeight: 800, color: C.bleu, display: "flex", alignItems: "center", gap: 7 }}><ClipboardList size={16} /> Bilans et entretiens</div>
        <button onClick={() => setBilanEdit({ date: hoyISO() })} style={{ background: "none", border: "none", color: C.bleu, cursor: "pointer", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} /> Nouveau bilan</button>
      </div>
      {bilansSaison.length === 0 ? (
        <Card style={{ marginBottom: 14, textAlign: "center", color: C.gris, fontSize: 13, padding: 16 }}>Aucun bilan pour la saison {saisonSel}</Card>
      ) : (
        <div style={{ marginBottom: 6 }}>{bilansSaison.map((b) => <CarteBilan key={b.id} b={b} onEdit={() => setBilanEdit(b)} />)}</div>
      )}

      {p.parcours && p.parcours.length > 0 && (
        <>
          <div style={{ fontWeight: 800, color: C.bleu, display: "flex", alignItems: "center", gap: 7, margin: "4px 0 8px" }}><Trophy size={16} /> Parcours ({p.parcours.length} saison{p.parcours.length > 1 ? "s" : ""})</div>
          {p.parcours.map((s, i) => <CarteSaisonParcours key={(s.saison || "") + i} s={s} precedente={p.parcours[i + 1] || null} />)}
        </>
      )}

      {bilanEdit && <EditBilan bilan={bilanEdit} educateurs={educateurs} onClose={() => setBilanEdit(null)}
        onSave={(b) => {
          mutate((d) => {
            const pl = d.players.find((x) => x.id === p.id);
            pl.bilans = pl.bilans || [];
            if (b.id) { const i = pl.bilans.findIndex((x) => x.id === b.id); pl.bilans[i] = b; }
            else pl.bilans.push({ ...b, id: uid() });
            return d;
          });
          setBilanEdit(null);
        }}
        onDelete={bilanEdit.id ? () => {
          mutate((d) => { const pl = d.players.find((x) => x.id === p.id); pl.bilans = (pl.bilans || []).filter((x) => x.id !== bilanEdit.id); return d; });
          setBilanEdit(null);
        } : null} />}

      {testEdit && <EditTest joueur={p} onClose={() => setTestEdit(false)} onSave={(t) => {
        mutate((d) => {
          const pl = d.players.find((x) => x.id === p.id);
          pl.tests = pl.tests || []; pl.tests.push({ ...t, id: uid() });
          return d;
        });
        setTestEdit(false);
      }} />}

      {confirmer && (
        <Modal title="Supprimer le joueur" onClose={() => setConfirmer(false)}
          footer={<><Btn variant="ghost" full onClick={() => setConfirmer(false)}>Annuler</Btn><Btn variant="danger" full onClick={onDelete}>Supprimer</Btn></>}>
          <div style={{ fontSize: 14, color: C.encre, lineHeight: 1.5 }}>Supprimer définitivement <strong>{p.prenom} {p.nom}</strong> de l'effectif ? Cette action est irréversible.</div>
        </Modal>
      )}
    </Modal>
  );
}


function GraphTests({ tests, cat }) {
  const avecJump = jumpActif(cat);
  const series = avecJump
    ? [["vma", "VMA", "km/h", C.bleu], ["cmj", "CMJ", "cm", C.jaune], ["v10", "10 m", "s", C.vert]]
    : [["vma", "VMA", "km/h", C.bleu], ["v10", "10 m", "s", C.vert], ["v20", "20 m", "s", C.jaune]];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${series.length}, 1fr)`, gap: 8, marginBottom: 14 }}>
        {series.map(([k, lab, unit, col]) => {
          const derniere = [...tests].reverse().find((t) => t[k] != null && t[k] !== "");
          return (
            <div key={k} style={{ textAlign: "center", background: "#F7F9FC", borderRadius: 10, padding: "10px 4px" }}>
              <div style={{ fontSize: 10.5, color: C.gris, fontWeight: 700 }}>{lab}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: col }}>{derniere ? derniere[k] : "-"}</div>
              <div style={{ fontSize: 9.5, color: C.gris }}>{unit}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tests.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "5px 0", borderTop: `1px solid ${C.grisClair}` }}>
            <span style={{ color: C.gris, minWidth: 52 }}>{t.date ? jjmm(t.date) : "-"}</span>
            <span style={{ flex: 1 }}>VMA <strong>{t.vma || "-"}</strong> · 10m <strong>{t.v10 || "-"}</strong>{avecJump ? <> · CMJ <strong>{t.cmj || "-"}</strong></> : <> · 20m <strong>{t.v20 || "-"}</strong></>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditTest({ joueur, onClose, onSave }) {
  const avecJump = jumpActif(joueur.cat);
  const d0 = new Date();
  const [t, setT] = useState({ date: `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`, vma: "", v10: "", v20: "", v40: "", sj: "", cmj: "", cmjb: "", dj: "" });
  const set = (k, v) => setT((o) => ({ ...o, [k]: v }));
  const champNum = (k, lab, unit) => (
    <Field label={`${lab}${unit ? ` (${unit})` : ""}`}>
      <Inp type="number" inputMode="decimal" value={t[k]} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  return (
    <Modal title="Nouveau test physique" onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => onSave(t)}><Save size={16} /> Enregistrer le test</Btn>}>
      <Field label="Date du test"><Inp type="date" value={t.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <div style={{ fontWeight: 800, color: C.bleu, fontSize: 13, margin: "6px 0 8px" }}>Vitesse</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {champNum("vma", "VMA", "km/h")}
        {champNum("v10", "Vitesse 10 m", "s")}
        {champNum("v20", "Vitesse 20 m", "s")}
        {champNum("v40", "Vitesse 40 m", "s")}
      </div>
      {avecJump && (
        <>
          <div style={{ fontWeight: 800, color: C.bleu, fontSize: 13, margin: "10px 0 8px" }}>Détente (sauts)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {champNum("sj", "Squat Jump", "cm")}
            {champNum("cmj", "CMJ", "cm")}
            {champNum("cmjb", "CMJ bras", "cm")}
            {champNum("dj", "Drop Jump", "cm")}
          </div>
        </>
      )}
    </Modal>
  );
}

function EditJoueur({ joueur, cat, onClose, onSave }) {
  const [f, setF] = useState({
    prenom: "", nom: "", dob: "", taille: "", poids: "", poste: "", pied: "Droit",
    numero: "", licence: "", club: "FCSM", photo: "", jonglages: { fort: "", faible: "", tete: "" },
    parentNom: "", parentTel: "", parentEmail: "", mutation: "", mutationDate: "", ...joueur,
  });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const setJo = (k, v) => setF((o) => ({ ...o, jonglages: { ...(o.jonglages || {}), [k]: v } }));
  const fileRef = useRef(null);

  function choisirPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    compresserImage(file, 640, (dataUrl) => set("photo", dataUrl));
  }

  return (
    <Modal title={joueur.id ? "Modifier le joueur" : "Nouveau joueur"} onClose={onClose}
      footer={<Btn variant="accent" full disabled={!f.prenom || !f.nom} onClick={() => onSave({ ...f, taille: f.taille ? +f.taille : "", poids: f.poids ? +f.poids : "", numero: f.numero !== "" ? +f.numero : "" })}><Save size={16} /> Enregistrer</Btn>}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div onClick={() => fileRef.current && fileRef.current.click()} style={{ cursor: "pointer", position: "relative" }}>
          <PhotoFiche p={f} w={70} h={88} />
          <div style={{ position: "absolute", bottom: -4, right: -4, background: C.jaune, borderRadius: 9, width: 26, height: 26, display: "grid", placeItems: "center", border: "2px solid #fff" }}>
            <Camera size={14} color={C.bleuNuit} />
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: C.gris, flex: 1 }}>Touche la photo pour l'ajouter ou la changer. Cadre le visage, elle sera compressée automatiquement.</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={choisirPhoto} style={{ display: "none" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Prénom"><Inp value={f.prenom} onChange={(e) => set("prenom", e.target.value)} /></Field>
        <Field label="Nom"><Inp value={f.nom} onChange={(e) => set("nom", e.target.value)} /></Field>
      </div>
      <Field label="Date de naissance"><Inp type="date" value={f.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Taille (cm)"><Inp type="number" inputMode="numeric" value={f.taille} onChange={(e) => set("taille", e.target.value)} /></Field>
        <Field label="Poids (kg)"><Inp type="number" inputMode="numeric" value={f.poids} onChange={(e) => set("poids", e.target.value)} /></Field>
      </div>
      <Field label="Poste">
        <Sel value={f.poste} onChange={(e) => set("poste", e.target.value)}>
          <option value="">Choisir un poste</option>
          {POSTES.map((p) => <option key={p}>{p}</option>)}
        </Sel>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Pied fort">
          <Sel value={f.pied} onChange={(e) => set("pied", e.target.value)}>
            <option>Droit</option><option>Gauche</option><option>Ambidextre</option>
          </Sel>
        </Field>
        <Field label={`Numéro (1 à ${maxNumero(f.cat)})`}><Inp type="number" inputMode="numeric" min={1} max={maxNumero(f.cat)} value={f.numero} onChange={(e) => set("numero", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Numéro de licence"><Inp value={f.licence} onChange={(e) => set("licence", e.target.value)} /></Field>
        <Field label="Statut de la licence">
          <Sel value={f.licenceStatut || ""} onChange={(e) => set("licenceStatut", e.target.value)}>
            <option value="">Non renseignée</option>
            <option>Valide</option>
            <option>En cours</option>
            <option>À renouveler</option>
          </Sel>
        </Field>
        <Field label="Type de licence">
          <Sel value={f.mutation && f.mutation !== "club" ? "mutation" : ""} onChange={(e) => set("mutation", e.target.value)}>
            <option value="">Licence club (même club)</option>
            <option value="mutation">Mutation (vient d'un autre club)</option>
          </Sel>
        </Field>
        <Field label="Date de validation de la licence">
          <Inp type="date" value={f.mutationDate || ""} onChange={(e) => set("mutationDate", e.target.value)} />
          {f.mutation && f.mutation !== "club" ? (() => { const lm = libelleMutation(f); return <div style={{ fontSize: 12, color: lm.couleur, fontWeight: 700, marginTop: 5 }}>{f.mutationDate ? `Classé : ${lm.label.toLowerCase()}` : "Renseigne la date pour classer la mutation"}</div>; })() : null}
        </Field>
        <Field label="Contrôle médical de la saison">
          <Sel value={f.medicalSaison === saisonCourante() ? (f.medicalStatut || "") : ""} onChange={(e) => { const v = e.target.value; set("medicalStatut", v); set("medicalSaison", v ? saisonCourante() : ""); }}>
            <option value="">À faire</option>
            <option value="questionnaire">Questionnaire de santé fait (dispensé de certificat)</option>
            <option value="certificat">Certificat médical fourni</option>
          </Sel>
        </Field>
        <Field label="Club"><Inp value={f.club} onChange={(e) => set("club", e.target.value)} /></Field>
      </div>

      {jonglagesActifs(f.cat) && (<>
      <div style={{ fontWeight: 800, color: C.bleu, fontSize: 13, margin: "8px 0" }}>Jonglages (max 50)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Field label="Pied fort"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).fort} onChange={(e) => setJo("fort", e.target.value)} /></Field>
        <Field label="Pied faible"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).faible} onChange={(e) => setJo("faible", e.target.value)} /></Field>
        <Field label="Jonglage alterné"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).tete} onChange={(e) => setJo("tete", e.target.value)} /></Field>
      </div>
      </>)}

      <div style={{ fontWeight: 800, color: C.bleu, fontSize: 13, margin: "8px 0" }}>Parents / responsable</div>
      <Field label="Nom du responsable"><Inp value={f.parentNom} onChange={(e) => set("parentNom", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Téléphone"><Inp value={f.parentTel} onChange={(e) => set("parentTel", e.target.value)} /></Field>
        <Field label="Email"><Inp type="email" value={f.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}


/* ============================================================
   Composition d'équipe
   ============================================================ */
const FORMATS_MULTI = { U13: [8, 10, 11], "Foot loisirs": [11, 9, 8], "Foot santé": [6, 5] };
function Compo({ players, cat, catInfo, db, mutate }) {
  const matchsCat = (db.matches || []).filter((m) => m.cat === cat).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const aujourdhui = hoyISO();
  const matchProchain = matchsCat.find((m) => (m.date || "") >= aujourdhui);
  const matchDefaut = matchProchain ? matchProchain.id : (matchsCat.length ? matchsCat[matchsCat.length - 1].id : "");
  const [matchSel, setMatchSel] = useState(matchDefaut);
  const key = matchSel || cat;
  const formats = FORMATS_MULTI[cat] || [catInfo.type];
  const lineupRaw = db.lineups[key] || {};
  const typeFoot = (lineupRaw.format && formats.includes(lineupRaw.format)) ? lineupRaw.format : formats[0];
  const formationsDispo = Object.keys(FORMATIONS[typeFoot]);
  const lineup = db.lineups[key] || { formation: formationsDispo[0], slots: {}, remplacants: [] };
  const formation = FORMATIONS[typeFoot][lineup.formation] || FORMATIONS[typeFoot][formationsDispo[0]];
  const remplacants = lineup.remplacants || [];
  const capitaine = lineup.capitaine || null;
  const GK_COL = "#2FA36B"; // couleur distincte du gardien
  const [pick, setPick] = useState(null);       // index de slot à remplir
  const [pickRempl, setPickRempl] = useState(false);

  // Convoqués : 12 maxi en foot à 8, 16 maxi en foot à 11, sinon titulaires plus 4 (foot à 4 et à 5)
  const maxConvoques = typeFoot === 8 ? 12 : typeFoot === 11 ? 16 : typeFoot === 10 ? 14 : typeFoot === 9 ? 13 : formation.length + 8;
  const maxRempl = maxConvoques - formation.length;

  function changerFormat(fmt) {
    const slotsLoc = { ...(lineup.slots || {}) };
    const remplLoc = [...(lineup.remplacants || [])];
    const capLoc = lineup.capitaine || null;
    mutate((d) => {
      const lu = d.lineups[key] || { slots: {}, remplacants: [] };
      lu.format = fmt;
      const nouvelleFormation = Object.keys(FORMATIONS[fmt])[0];
      lu.formation = nouvelleFormation;
      const nbSlots = FORMATIONS[fmt][nouvelleFormation].length;
      const ex = (lu.slots && Object.keys(lu.slots).length) ? lu.slots : slotsLoc;
      const nouveaux = {};
      Object.keys(ex || {}).forEach((idx) => { if (+idx < nbSlots) nouveaux[idx] = ex[idx]; });
      lu.slots = nouveaux;
      lu.remplacants = (lu.remplacants && lu.remplacants.length) ? lu.remplacants : remplLoc;
      if (!lu.capitaine) lu.capitaine = capLoc;
      d.lineups[key] = lu;
      return d;
    });
  }
  function setFormation(name) {
    const slotsLoc = { ...(lineup.slots || {}) };
    const remplLoc = [...(lineup.remplacants || [])];
    const capLoc = lineup.capitaine || null;
    const fmtLoc = lineup.format;
    mutate((d) => {
      const ex = d.lineups[key] || {};
      const slots = (ex.slots && Object.keys(ex.slots).length) ? ex.slots : slotsLoc;
      const rempl = (ex.remplacants && ex.remplacants.length) ? ex.remplacants : remplLoc;
      d.lineups[key] = { formation: name, slots, remplacants: rempl, capitaine: ex.capitaine || capLoc, format: ex.format || fmtLoc };
      return d;
    });
  }
  function assign(slotIndex, joueurId) {
    mutate((d) => {
      const lu = d.lineups[key] || { formation: lineup.formation, slots: {}, remplacants: [] };
      lu.remplacants = lu.remplacants || [];
      Object.keys(lu.slots).forEach((k) => { if (lu.slots[k] === joueurId) delete lu.slots[k]; });
      if (joueurId) {
        lu.slots[slotIndex] = joueurId;
        lu.remplacants = lu.remplacants.filter((id) => id !== joueurId); // un titulaire n'est plus remplaçant
      } else { delete lu.slots[slotIndex]; }
      d.lineups[key] = lu; return d;
    });
    setPick(null);
  }
  function ajouterRemplacant(joueurId) {
    mutate((d) => {
      const lu = d.lineups[key] || { formation: lineup.formation, slots: {}, remplacants: [] };
      lu.remplacants = lu.remplacants || [];
      if (!lu.remplacants.includes(joueurId) && lu.remplacants.length < maxRempl) lu.remplacants.push(joueurId);
      d.lineups[key] = lu; return d;
    });
    setPickRempl(false);
  }
  function retirerRemplacant(joueurId) {
    mutate((d) => {
      const lu = d.lineups[key]; if (!lu) return d;
      lu.remplacants = (lu.remplacants || []).filter((id) => id !== joueurId);
      return d;
    });
  }
  function designerCapitaine(joueurId) {
    mutate((d) => {
      const lu = d.lineups[key] || { formation: lineup.formation, slots: {}, remplacants: [] };
      lu.capitaine = (lu.capitaine === joueurId) ? null : joueurId;
      d.lineups[key] = lu; return d;
    });
  }

  function setNumero(pid, val) {
    const mx = maxNumero(cat);
    const n = val === "" ? "" : Math.max(1, Math.min(mx, parseInt(val, 10) || 1));
    mutate((d) => { const pl = (d.players || []).find((x) => x.id === pid); if (pl) pl.numero = n; return d; });
  }
  const compoVide = Object.keys(lineup.slots || {}).length === 0;
  const derniereCompo = (() => {
    let best = null, bestN = 0;
    Object.keys(db.lineups || {}).forEach((k) => { if (k === key) return; const lu = db.lineups[k]; const n = (lu && lu.slots) ? Object.keys(lu.slots).length : 0; if (n > bestN) { bestN = n; best = lu; } });
    return best;
  })();
  function reprendreCompo() {
    if (!derniereCompo) return;
    mutate((d) => { d.lineups[key] = { formation: derniereCompo.formation, slots: { ...(derniereCompo.slots || {}) }, remplacants: [...(derniereCompo.remplacants || [])], capitaine: derniereCompo.capitaine || null, format: derniereCompo.format }; return d; });
  }
  const used = Object.values(lineup.slots || {});
  const convoques = used.length + remplacants.length;
  const benchDispo = players.filter((p) => !used.includes(p.id) && !remplacants.includes(p.id));

  return (
    <div>
      <h2 style={{ margin: "4px 0 12px", fontSize: 20, fontWeight: 900 }}>Composition {cat}</h2>

      {matchsCat.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.gris, display: "block", marginBottom: 5 }}>Composition pour le match</label>
          <select value={matchSel} onChange={(e) => setMatchSel(e.target.value)} style={{
            width: "100%", padding: "11px 12px", borderRadius: 12, border: `1px solid ${C.grisClair}`,
            background: "#fff", fontWeight: 700, fontSize: 14, color: C.encre,
          }}>
            <option value="">Composition générale (sans match)</option>
            {matchsCat.map((m) => (
              <option key={m.id} value={m.id}>
                {(m.date ? fmtDate(m.date) : "Date à définir")}{m.adversaire ? ` · ${m.adversaire}` : ""}{m.lieu ? ` (${m.lieu})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {compoVide && derniereCompo && (
        <div style={{ background: "#EAF0F7", border: `1px solid ${C.bleu}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: C.encre, marginBottom: 8, lineHeight: 1.4 }}>Ce match n'a pas encore de composition. Tu peux repartir de ta dernière composition plutôt que de tout refaire, puis l'ajuster.</div>
          <Btn variant="accent" full onClick={reprendreCompo}>Reprendre la dernière composition</Btn>
        </div>
      )}

      {formats.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {formats.map((ft) => (
            <button key={ft} onClick={() => changerFormat(ft)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "10px 8px",
              fontWeight: 800, fontSize: 14, background: typeFoot === ft ? C.bleu : "#EEF2F8", color: typeFoot === ft ? "#fff" : C.gris,
            }}>Foot à {ft}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {formationsDispo.map((name) => {
          const active = lineup.formation === name;
          return (
            <button key={name} onClick={() => setFormation(name)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: 12, padding: "11px 8px",
              fontWeight: 900, fontSize: 16, background: active ? C.jaune : "#fff",
              color: active ? C.bleuNuit : C.gris, boxShadow: "0 1px 3px rgba(10,42,107,0.08)",
            }}>{name}</button>
          );
        })}
      </div>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8 }}>
        Système au choix de l'éducateur · Foot à {typeFoot}. Touche un poste pour placer un joueur, puis désigner le capitaine.
      </div>
      <div style={{ display: "flex", gap: 14, marginBottom: 10, fontSize: 11.5, fontWeight: 700, color: C.gris }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.jaune, display: "inline-block" }} /> Joueur</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#2FA36B", display: "inline-block" }} /> Gardien</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 13, height: 13, borderRadius: "50%", background: C.bleuNuit, color: C.jaune, fontSize: 8, fontWeight: 900, display: "grid", placeItems: "center" }}>C</span> Capitaine</span>
      </div>

      {/* Terrain aux couleurs du club */}
      <div style={{
        position: "relative", width: "100%", paddingBottom: "135%", borderRadius: 18,
        background: `repeating-linear-gradient(${C.bleu}, ${C.bleu} 11%, ${C.bleuNuit} 11%, ${C.bleuNuit} 22%)`,
        border: `3px solid ${C.jaune}`, overflow: "hidden", marginBottom: 14,
      }}>
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "50%", height: 2, background: "rgba(255,203,5,0.45)" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 70, height: 70, borderRadius: "50%", border: `2px solid rgba(255,203,5,0.45)`, transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "absolute", left: "28%", right: "28%", bottom: 0, height: "13%", border: `2px solid rgba(255,203,5,0.45)`, borderBottom: "none" }} />
        <div style={{ position: "absolute", left: "28%", right: "28%", top: 0, height: "13%", border: `2px solid rgba(255,203,5,0.45)`, borderTop: "none" }} />

        {formation.map((slot, i) => {
          const pid = lineup.slots?.[i];
          const p = pid ? players.find((x) => x.id === pid) : null;
          const isGK = slot.l === "G";
          const estCap = p && capitaine === p.id;
          const couleurCercle = isGK ? GK_COL : C.jaune;
          const bordure = isGK ? GK_COL : "#fff";
          return (
            <button key={i} onClick={() => setPick(i)} style={{
              position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, transform: "translate(-50%,-50%)",
              border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <div style={{ position: "relative" }}>
                {p && p.photo ? (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `3px solid ${bordure}`, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }}>
                    <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 18%", display: "block" }} />
                  </div>
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: p ? couleurCercle : "rgba(255,255,255,0.18)",
                    border: `2px solid ${p ? bordure : "rgba(255,255,255,0.55)"}`,
                    color: p ? (isGK ? "#fff" : C.bleuNuit) : "#fff", display: "grid", placeItems: "center",
                    fontWeight: 900, fontSize: 13,
                  }}>{p ? initials(p) : slot.l}</div>
                )}
                {estCap && (
                  <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: C.bleuNuit, color: C.jaune, border: `2px solid ${C.jaune}`, display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 900 }}>C</div>
                )}
                {p && p.numero != null && p.numero !== "" && (
                  <div style={{ position: "absolute", bottom: -4, right: -4, minWidth: 18, height: 18, padding: "0 3px", borderRadius: 9, background: C.bleuNuit, color: "#fff", border: "2px solid #fff", display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 900 }}>{p.numero}</div>
                )}
              </div>
              <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.55)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: p && p.numero != null && p.numero !== "" ? 7 : 0 }}>
                {p ? (p.prenom && p.nom ? `${p.prenom[0]}. ${p.nom}` : (p.nom || p.prenom)) : slot.l}
              </span>
            </button>
          );
        })}
      </div>

      {/* Remplaçants */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><ArrowRightLeft size={17} color={C.bleu} /> Remplaçants ({remplacants.length}/{maxRempl})</div>
        {remplacants.length < maxRempl
          ? <Btn variant="accent" size="sm" onClick={() => setPickRempl(true)}><Plus size={15} /> Ajouter</Btn>
          : <Btn variant="ghost" size="sm" onClick={() => setPickRempl(true)}><Users size={15} /> Effectif restant ({benchDispo.length})</Btn>}
      </div>
      {remplacants.length === 0 ? (
        <div style={{ fontSize: 13, color: C.gris, marginBottom: 10 }}>Aucun remplaçant. Banc jusqu'à {maxRempl} joueurs.</div>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
          {remplacants.map((pid) => {
            const p = players.find((x) => x.id === pid);
            if (!p) return null;
            return (
              <div key={pid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}` }}>
                <Avatar p={p} size={34} radius={9} />
                <div style={{ flex: 1, fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.prenom} {p.nom}</div>
                <span style={{ fontSize: 12, color: C.gris }}>{p.poste || ""}</span>
                <X size={16} color={C.gris} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => retirerRemplacant(pid)} />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 13, color: C.gris }}>
        Titulaires {Object.keys(lineup.slots || {}).length}/{formation.length} · Convoqués {convoques}/{maxConvoques}
        {catInfo.type === 11 ? " (14 à 16 conseillés)" : ""} · Disponibles {benchDispo.length}
      </div>

      {pick != null && (
        <Modal title={`Placer au poste ${formation[pick].l}`} onClose={() => setPick(null)}>
          {lineup.slots?.[pick] && (
            <>
              <Btn variant={capitaine === lineup.slots[pick] ? "accent" : "ghost"} full style={{ marginBottom: 10 }} onClick={() => designerCapitaine(lineup.slots[pick])}>
                <Star size={16} /> {capitaine === lineup.slots[pick] ? "Retirer le brassard" : "Désigner capitaine"}
              </Btn>
              <Field label={`Numéro de maillot (1 à ${maxNumero(cat)})`}>
                <Inp type="number" inputMode="numeric" min={1} max={maxNumero(cat)} value={(players.find((x) => x.id === lineup.slots[pick]) || {}).numero ?? ""} onChange={(e) => setNumero(lineup.slots[pick], e.target.value)} placeholder="Numéro" />
              </Field>
              <Btn variant="danger" full style={{ marginTop: 10, marginBottom: 12 }} onClick={() => assign(pick, null)}>
                <X size={16} /> Retirer le joueur de ce poste
              </Btn>
            </>
          )}
          {players.length === 0 ? (
            <Empty icon={<Users size={24} color={C.gris} />} text="Aucun joueur dans l'effectif" />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {players.map((p) => {
                const placeAilleurs = used.includes(p.id) && lineup.slots?.[pick] !== p.id;
                const estRempl = remplacants.includes(p.id);
                const susp = estSuspendu(p);
                return (
                  <button key={p.id} onClick={() => { if (susp) return; assign(pick, p.id); }} disabled={susp} style={{
                    display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 12,
                    border: `1px solid ${susp ? "#F3C9C9" : C.grisClair}`, background: susp ? "#FDF2F2" : "#fff", cursor: susp ? "not-allowed" : "pointer", textAlign: "left", opacity: susp ? 0.75 : 1,
                  }}>
                    <Avatar p={p} size={38} radius={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div>
                      <div style={{ fontSize: 12, color: susp ? C.rouge : C.gris }}>{susp ? ("Suspendu" + (p.suspensionFin && p.suspensionFin > hoyISO() ? `, dispo ${jjmm(p.suspensionFin)}` : "")) : (p.poste || "Poste libre")}</div>
                    </div>
                    {susp ? <Pastille bg="#FBE3E3" color={C.rouge}>Suspendu</Pastille> : placeAilleurs ? <Pastille bg={C.grisClair} color={C.gris}>déjà placé</Pastille> : estRempl ? <Pastille bg="#FFF3DA" color={C.jauneFonce}>banc</Pastille> : null}
                  </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {pickRempl && (
        <Modal title={remplacants.length >= maxRempl ? "Effectif restant" : "Ajouter un remplaçant"} onClose={() => setPickRempl(false)}>
          {remplacants.length >= maxRempl
            ? <div style={{ fontSize: 12.5, color: "#B87A2B", fontWeight: 700, marginBottom: 10, lineHeight: 1.5, background: "#FFF7E6", border: "1px solid #F0DBA8", borderRadius: 10, padding: 10 }}>Banc complet ({maxRempl}). Voici les joueurs non convoqués. Pour en ajouter un, retire d'abord un remplaçant.</div>
            : <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Banc jusqu'à {maxRempl} joueurs (convoqués {convoques}/{maxConvoques}).</div>}
          {benchDispo.length === 0 ? (
            <Empty icon={<Users size={24} color={C.gris} />} text="Aucun joueur disponible" sub="Tous les joueurs sont déjà titulaires ou sur le banc" />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {benchDispo.map((p) => {
                const susp = estSuspendu(p);
                const bancPlein = remplacants.length >= maxRempl;
                const bloque = susp || bancPlein;
                return (
                <button key={p.id} onClick={() => { if (bloque) return; ajouterRemplacant(p.id); }} disabled={bloque} style={{
                  display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 12,
                  border: `1px solid ${susp ? "#F3C9C9" : C.grisClair}`, background: susp ? "#FDF2F2" : "#fff", cursor: bloque ? "default" : "pointer", textAlign: "left", opacity: susp ? 0.75 : 1,
                }}>
                  <Avatar p={p} size={38} radius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: 12, color: susp ? C.rouge : C.gris }}>{susp ? ("Suspendu" + (p.suspensionFin && p.suspensionFin > hoyISO() ? `, dispo ${jjmm(p.suspensionFin)}` : "")) : (p.poste || "Poste libre")}</div>
                  </div>
                  {susp ? <Pastille bg="#FBE3E3" color={C.rouge}>Suspendu</Pastille> : null}
                </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}


/* ============================================================
   Matchs : calendrier, score, rapport, notes
   ============================================================ */
function Matchs({ players, cat, catInfo, db, mutate, peutValider, profil }) {
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(null);
  const [filtre, setFiltre] = useState("Tous");
  const [saisonSel, setSaisonSel] = useState(saisonCourante());
  const tous = db.matches.filter((m) => m.cat === cat).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const saisons = (() => {
    const set = [...new Set(tous.map((m) => saisonDe(m.date)).filter(Boolean))];
    if (!set.includes(saisonCourante())) set.push(saisonCourante());
    return set.sort().reverse();
  })();
  const parSaison = tous.filter((m) => saisonDe(m.date) === saisonSel);
  const matches = filtre === "Tous" ? parSaison : parSaison.filter((m) => (m.type || "Championnat") === filtre);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Matchs {cat}</h2>
        <Btn variant="accent" size="sm" onClick={() => setEdit({ cat, lieu: "Domicile", type: "Championnat" })}><Plus size={16} /> Match</Btn>
      </div>

      {saisons.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.gris, display: "block", marginBottom: 5 }}>Saison</label>
          <Sel value={saisonSel} onChange={(e) => setSaisonSel(e.target.value)}>
            {saisons.map((s) => <option key={s} value={s}>{s === saisonCourante() ? `${s} (en cours)` : s}</option>)}
          </Sel>
        </div>
      )}

      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {["Tous", ...TYPES_MATCH].map((t) => {
          const actif = filtre === t;
          return (
            <button key={t} onClick={() => setFiltre(t)} style={{
              flex: "0 0 auto", border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px",
              fontWeight: 800, fontSize: 12.5, background: actif ? C.bleu : "#fff", color: actif ? "#fff" : C.gris,
              boxShadow: "0 1px 3px rgba(10,42,107,0.08)",
            }}>{t}</button>
          );
        })}
      </div>

      {matches.length === 0 ? (
        <Empty icon={<CalendarDays size={26} color={C.gris} />} text="Aucun match" sub={filtre === "Tous" ? "Programme une rencontre au calendrier" : `Aucun match de type ${filtre}`} />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {matches.map((m) => {
            const joue = m.scorePour != null && m.scoreContre != null;
            let res = null, bg = C.grisClair, col = C.gris;
            if (joue) {
              if (+m.scorePour > +m.scoreContre) { res = "V"; bg = "#E2F4E9"; col = C.vert; }
              else if (+m.scorePour === +m.scoreContre) { res = "N"; }
              else { res = "D"; bg = "#FBE3E3"; col = C.rouge; }
            }
            return (
              <Card key={m.id} onClick={() => setOpen(m)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{fmtDate(m.date)} · {m.lieu}{m.type ? ` · ${m.type}` : ""}</span>
                  {res ? <Pastille bg={bg} color={col}>{res}</Pastille> : <Pastille bg={C.jaune} color={C.bleuNuit}>À venir</Pastille>}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{m.lieu === "Domicile" ? CLUB : (m.adversaire || "Adversaire")} <span style={{ color: C.gris, fontWeight: 600 }}>contre</span> {m.lieu === "Domicile" ? (m.adversaire || "Adversaire") : CLUB}</div>
                  {joue && <div style={{ fontWeight: 900, fontSize: 18, color: C.bleu }}>{m.lieu === "Domicile" ? `${m.scorePour} - ${m.scoreContre}` : `${m.scoreContre} - ${m.scorePour}`}</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {edit && <EditMatch match={edit} onClose={() => setEdit(null)} onSave={(m) => {
        mutate((d) => {
          if (m.id) { const i = d.matches.findIndex((x) => x.id === m.id); d.matches[i] = { ...d.matches[i], ...m }; }
          else d.matches.push({ ...m, id: uid(), buteurs: {}, passeurs: {}, tempsJeu: {}, notes: {} });
          return d;
        });
        setEdit(null);
      }} />}

      {open && <RapportMatch match={open} players={players} db={db} mutate={mutate} peutValider={peutValider} profil={profil}
        onClose={() => setOpen(null)}
        onEdit={() => { setEdit(open); setOpen(null); }}
        onDelete={() => { mutate((d) => { d.matches = d.matches.filter((x) => x.id !== open.id); return d; }); setOpen(null); }} />}
    </div>
  );
}

function EditMatch({ match, onClose, onSave }) {
  const [f, setF] = useState({ type: "Championnat", lieu: "Domicile", ...match });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={match.id ? "Modifier le match" : "Nouveau match"} onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>}>
      <Field label="Date"><Inp type="date" value={f.date || ""} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Adversaire"><Inp value={f.adversaire || ""} onChange={(e) => set("adversaire", e.target.value)} placeholder="Nom de l'équipe" /></Field>
      <Field label="Type de match">
        <Sel value={f.type || "Championnat"} onChange={(e) => set("type", e.target.value)}>
          {TYPES_MATCH.map((t) => <option key={t}>{t}</option>)}
        </Sel>
      </Field>
      <Field label="Lieu">
        <Sel value={f.lieu || "Domicile"} onChange={(e) => set("lieu", e.target.value)}>
          <option>Domicile</option><option>Extérieur</option>
        </Sel>
      </Field>
      <Field label="Nom de la compétition (optionnel)"><Inp value={f.competition || ""} onChange={(e) => set("competition", e.target.value)} placeholder="Journée 5, Coupe du Doubs..." /></Field>
      <Field label="Heure du match"><Inp type="time" value={f.heure || ""} onChange={(e) => set("heure", e.target.value)} /></Field>
      <Field label="Terrain ou lieu du match"><Inp value={f.lieuMatch || ""} onChange={(e) => set("lieuMatch", e.target.value)} placeholder="Synthétique centre, stade adverse..." /></Field>
      <Field label="Intendance (optionnel)"><Inp value={f.intendance || ""} onChange={(e) => set("intendance", e.target.value)} placeholder="Goûters, bouteilles d'eau..." /></Field>
      <div style={{ fontWeight: 800, margin: "6px 0", color: C.bleu }}>Score (laisser vide si non joué)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Buts SOCHAUX"><Inp type="number" min="0" value={f.scorePour ?? ""} onChange={(e) => set("scorePour", e.target.value === "" ? null : e.target.value)} /></Field>
        <Field label="Buts adverses"><Inp type="number" min="0" value={f.scoreContre ?? ""} onChange={(e) => set("scoreContre", e.target.value === "" ? null : e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function RosterEncadrement({ db, mutate, onClose }) {
  const liste = db.encadrement || [];
  const [nom, setNom] = useState("");
  const [role, setRole] = useState(ROLES_ENCADREMENT[0]);
  const [licence, setLicence] = useState("");
  function ajouter() {
    const n = nom.trim(); if (!n) return;
    mutate((d) => { d.encadrement = d.encadrement || []; d.encadrement.push({ id: uid(), nom: n, role, licence: licence.trim() }); return d; });
    setNom(""); setLicence("");
  }
  function retirer(id) {
    mutate((d) => { d.encadrement = (d.encadrement || []).filter((x) => x.id !== id); return d; });
  }
  return (
    <Modal title="Encadrement : éducateurs, dirigeants, délégués, arbitres" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Saisis une fois les noms et numéros de licence, ils seront proposés pour chaque match.</div>
      <Field label="Nom et prénom"><Inp value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom et prénom" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Field label="Rôle">
          <Sel value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES_ENCADREMENT.map((r) => <option key={r}>{r}</option>)}
          </Sel>
        </Field>
        <Field label="N° de licence"><Inp value={licence} onChange={(e) => setLicence(e.target.value)} placeholder="Optionnel" /></Field>
      </div>
      <Btn variant="accent" full onClick={ajouter}><Plus size={16} /> Ajouter à la liste</Btn>
      <div style={{ marginTop: 14, display: "grid", gap: 4 }}>
        {liste.length === 0 ? <Empty icon={<Users size={22} color={C.gris} />} text="Aucun nom enregistré" /> :
          ROLES_ENCADREMENT.map((r) => {
            const gens = liste.filter((x) => x.role === r);
            if (gens.length === 0) return null;
            return (
              <div key={r}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.gris, margin: "8px 0 4px" }}>{r}s</div>
                {gens.map((x) => (
                  <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}`, marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{x.nom}</div>
                      {x.licence ? <div style={{ fontSize: 12, color: C.gris }}>Licence {x.licence}</div> : null}
                    </div>
                    <X size={16} color={C.gris} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => retirer(x.id)} />
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </Modal>
  );
}

function Convocation({ db, cat, match, mutate, onClose }) {
  const [copie, setCopie] = useState(false);
  const cur = db.matches.find((x) => x.id === match.id) || match;
  const lu = (db.lineups || {})[match.id] || (db.lineups || {})[cat] || {};
  const cap = lu.capitaine;
  const nomDe = (id) => { const p = db.players.find((x) => x.id === id); return p ? `${p.prenom} ${p.nom}`.trim() : null; };
  const titulaires = Object.values(lu.slots || {}).map((id) => ({ id, nom: nomDe(id) })).filter((x) => x.nom);
  const remplacants = (lu.remplacants || []).map((id) => ({ id, nom: nomDe(id) })).filter((x) => x.nom);
  const total = titulaires.length + remplacants.length;

  function maj(patch) {
    mutate((d) => { const m = d.matches.find((x) => x.id === match.id); if (m) Object.assign(m, patch); return d; });
  }

  const t = cur.transport || {}, e = cur.encadrement || {};
  const lignesEnc = [
    e.dirigeant ? `Dirigeant : ${e.dirigeant}` : null,
    e.delegue ? `Délégué : ${e.delegue}` : null,
    e.arbitre ? `Arbitre : ${e.arbitre}` : null,
  ].filter(Boolean);

  const texte = [
    `CONVOCATION ${cat}`,
    `${CLUB} contre ${cur.adversaire || "Adversaire"}${cur.type ? ` (${cur.type})` : ""}`,
    `${cur.date ? fmtDate(cur.date) : "Date à définir"}${cur.lieu ? ` - ${cur.lieu}` : ""}`,
    (cur.rdv || cur.lieuRdv) ? `Rendez-vous : ${[cur.rdv, cur.lieuRdv].filter(Boolean).join(" - ")}` : null,
    "",
    `Convoqués (${total}) :`,
    ...titulaires.map((x, i) => `${i + 1}. ${x.nom}${x.id === cap ? " (capitaine)" : ""}`),
    ...(remplacants.length ? ["", "Remplaçants :", ...remplacants.map((x) => `- ${x.nom}`)] : []),
    (cur.lieu === "Extérieur" && t.mode) ? `\nTransport : ${resumeTransport(t)}` : null,
    lignesEnc.length ? `\nEncadrement :\n${lignesEnc.join("\n")}` : null,
  ].filter((l) => l !== null && l !== undefined).join("\n");

  function copier() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte).then(() => setCopie(true)).catch(() => setCopie(false));
      }
    } catch (er) { setCopie(false); }
  }

  return (
    <Modal title="Feuille de convocation" onClose={onClose}
      footer={<Btn variant="accent" full disabled={total === 0} onClick={copier}><Send size={16} /> {copie ? "Texte copié" : "Copier le texte"}</Btn>}>
      <Field label="Heure de rendez-vous"><Inp type="time" value={cur.rdv || ""} onChange={(ev) => maj({ rdv: ev.target.value })} /></Field>
      <Field label="Lieu de rendez-vous (optionnel)"><Inp value={cur.lieuRdv || ""} onChange={(ev) => maj({ lieuRdv: ev.target.value })} placeholder="Parking du stade, adresse..." /></Field>
      {total === 0 ? (
        <Empty icon={<Users size={22} color={C.gris} />} text="Aucun joueur convoqué" sub="Place des joueurs dans la composition pour générer la convocation" />
      ) : (
        <textarea readOnly value={texte} rows={Math.min(22, 9 + total)} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", fontSize: 13, lineHeight: 1.5 }} />
      )}
      <div style={{ fontSize: 11.5, color: C.gris, marginTop: 8 }}>La liste vient de la composition de la catégorie (titulaires et remplaçants). Tu peux aussi sélectionner le texte à la main pour l'envoyer aux parents.</div>
    </Modal>
  );
}


function OrgaMatch({ match, db, mutate, onClose, peutValider }) {
  const [roster, setRoster] = useState(false);
  const [causeRefus, setCauseRefus] = useState(false);
  const [cause, setCause] = useState("");
  const [resaRefus, setResaRefus] = useState(false);
  const [resaCause, setResaCause] = useState("");
  const [convoc, setConvoc] = useState(false);
  const cur = db.matches.find((x) => x.id === match.id) || match;
  const t = cur.transport || {};
  const e = cur.encadrement || {};
  const r = cur.reservation || {};
  const exterieur = cur.lieu === "Extérieur";
  const domicile = cur.lieu === "Domicile";
  const liste = db.encadrement || [];
  const parRole = (rl) => liste.filter((x) => x.role === rl);
  const ciOrga = CATEGORIES.find((x) => x.id === cur.cat);
  const u17plus = !!(ciOrga && (ciOrga.groupe === "Formation" || ciOrga.groupe === "PRO"));
  const optAssist = ["Prise en charge par l'équipe adverse", "Joueur du club accompagné d'un dirigeant", "Joueur de l'équipe adverse accompagné d'un dirigeant"];
  const champs = [
    { role: "Éducateur", key: "educateur", src: "Éducateur" },
    { role: "Coach adjoint", key: "coachAdjoint", src: "Éducateur" },
    ...(u17plus ? [
      { role: "Coach des gardiens", key: "coachGardiens", src: "Coach des gardiens" },
      { role: "Préparateur physique", key: "prepaPhysique", src: "Préparateur physique" },
    ] : []),
    { role: "Dirigeant", key: "dirigeant", src: "Dirigeant" },
    { role: "Délégué", key: "delegue", src: "Délégué" },
    { role: "Arbitre central", key: "arbitre", src: "Arbitre", options: ["Prise en charge par l'équipe adverse"] },
    { role: "Arbitre assistant 1", key: "assistant1", src: "Arbitre", options: optAssist },
    { role: "Arbitre assistant 2", key: "assistant2", src: "Arbitre", options: optAssist },
    { role: "Arbitre assistant 3", key: "assistant3", src: "Arbitre", options: optAssist },
  ];

  function majTransport(patch) {
    mutate((d) => { const m = d.matches.find((x) => x.id === match.id); if (m) m.transport = { ...(m.transport || {}), ...patch }; return d; });
  }
  function majEncadrement(patch) {
    mutate((d) => { const m = d.matches.find((x) => x.id === match.id); if (m) m.encadrement = { ...(m.encadrement || {}), ...patch }; return d; });
  }
  function majReservation(patch) {
    mutate((d) => { const m = d.matches.find((x) => x.id === match.id); if (m) m.reservation = { ...(m.reservation || {}), ...patch }; return d; });
  }
  function toggleVestiaire(champ, v) {
    const arr = r[champ] || [];
    majReservation({ [champ]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] });
  }
  function toggleMinibus(b) {
    const arr = t.minibus || [];
    majTransport({ minibus: arr.includes(b) ? arr.filter((x) => x !== b) : [...arr, b] });
  }
  function repondre(accepte) {
    if (accepte) majTransport({ statut: "acceptee", cause: "" });
    else majTransport({ statut: "refusee", cause: cause.trim() });
    setCauseRefus(false); setCause("");
  }
  function refuserResa() {
    majReservation({ statut: "refusee", cause: resaCause.trim() });
    setResaRefus(false); setResaCause("");
  }

  return (
    <Modal title="Organisation du match" onClose={onClose}>
      <Btn variant="accent" full style={{ marginBottom: 16 }} onClick={() => setConvoc(true)}><Send size={16} /> Feuille de convocation</Btn>
      {domicile && (
        <>
          <div style={{ fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><MapPin size={17} color={C.bleu} /> Terrain et vestiaires</div>
          <div style={{ fontSize: 12, color: C.gris, marginBottom: 10 }}>Match à domicile. La demande est validée par le responsable, qui fixe l'heure de libération du vestiaire.</div>

          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Terrain demandé</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {TERRAINS.map((ter) => {
              const on = r.terrain === ter;
              return (
                <button key={ter} onClick={() => majReservation({ terrain: ter })} style={{
                  flex: 1, border: `1px solid ${on ? C.bleu : C.grisClair}`, cursor: "pointer", borderRadius: 11, padding: "11px 10px",
                  fontWeight: 800, fontSize: 13.5, background: on ? C.bleu : "#fff", color: on ? "#fff" : C.encre,
                }}>{ter}</button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Vestiaires équipe(s) du club</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {VESTIAIRES.map((v) => {
              const on = (r.vestiairesClub || []).includes(v);
              return (
                <button key={v} onClick={() => toggleVestiaire("vestiairesClub", v)} style={{
                  border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "9px 13px", fontWeight: 800, fontSize: 13.5,
                  background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                }}>{v}</button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Vestiaires visiteurs</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {VESTIAIRES.map((v) => {
              const on = (r.vestiairesVisiteurs || []).includes(v);
              return (
                <button key={v} onClick={() => toggleVestiaire("vestiairesVisiteurs", v)} style={{
                  border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "9px 13px", fontWeight: 800, fontSize: 13.5,
                  background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                }}>{v}</button>
              );
            })}
          </div>

          <div style={{ background: "#F4F7FB", border: `1px solid ${C.grisClair}`, borderRadius: 12, padding: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: C.gris, fontWeight: 800 }}>Validation responsable :</span>
              {r.statut === "validee" ? <Pastille bg="#E2F4E9" color={C.vert}>Validée</Pastille>
                : r.statut === "refusee" ? <Pastille bg="#FBE3E3" color={C.rouge}>Refusée</Pastille>
                  : <Pastille bg={C.jaune} color={C.bleuNuit}>En attente</Pastille>}
            </div>
            {r.statut === "validee" && r.heureLiberation ? (
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.bleu, marginBottom: 6 }}>Vestiaire à libérer à {r.heureLiberation}</div>
            ) : null}
            {r.statut === "refusee" && r.cause ? <div style={{ fontSize: 13, color: C.rouge, marginBottom: 6 }}>Cause : {r.cause}</div> : null}

            {peutValider ? (
              !resaRefus ? (
                <>
                  <Field label="Heure de libération du vestiaire">
                    <Inp type="time" value={r.heureLiberation || ""} onChange={(ev) => majReservation({ heureLiberation: ev.target.value })} />
                  </Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="accent" size="sm" onClick={() => majReservation({ statut: "validee", cause: "" })}><Check size={15} /> Valider</Btn>
                    <Btn variant="danger" size="sm" onClick={() => { setResaCause(""); setResaRefus(true); }}><X size={15} /> Refuser</Btn>
                  </div>
                </>
              ) : (
                <div>
                  <Field label="Cause du refus">
                    <Inp value={resaCause} onChange={(ev) => setResaCause(ev.target.value)} placeholder="Terrain indisponible, créneau pris..." />
                  </Field>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="danger" size="sm" disabled={!resaCause.trim()} onClick={refuserResa}>Confirmer le refus</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setResaRefus(false)}>Annuler</Btn>
                  </div>
                </div>
              )
            ) : (
              <div style={{ fontSize: 12, color: C.gris }}>{r.heureLiberation ? `Heure de libération fixée : ${r.heureLiberation}. ` : ""}Seul le responsable valide ces demandes et fixe l'heure de libération.</div>
            )}
          </div>
        </>
      )}

      {exterieur && (<>
      <div style={{ fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><MapPin size={17} color={C.bleu} /> Transport</div>
      <div style={{ fontSize: 12, color: C.gris, marginBottom: 10 }}>Match à l'extérieur : choisis le transport.</div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Mode de transport</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {MODES_TRANSPORT.map((m) => {
            const on = t.mode === m;
            return (
              <button key={m} onClick={() => majTransport({ mode: m })} style={{
                border: `1px solid ${on ? C.bleu : C.grisClair}`, cursor: "pointer", borderRadius: 11, padding: "11px 13px",
                fontWeight: 800, fontSize: 14, textAlign: "left", background: on ? C.bleu : "#fff", color: on ? "#fff" : C.encre,
              }}>{m}</button>
            );
          })}
        </div>
        {t.mode === "Minibus club" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Minibus du club (plusieurs possibles)</div>
            <div style={{ display: "flex", gap: 8 }}>
              {MINIBUS.map((b) => {
                const on = (t.minibus || []).includes(b);
                return (
                  <button key={b} onClick={() => toggleMinibus(b)} style={{
                    flex: 1, border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "10px 6px", fontWeight: 900, fontSize: 15,
                    background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                  }}>{b}</button>
                );
              })}
            </div>
          </div>
        )}
        {t.mode === "Bus en location" && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 2 }}>Loueur</div>
            <div style={{ fontSize: 11.5, color: "#B87A2B", fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>ADJ en priorité (contrat du club). Choisir Hertz seulement si ADJ n'est pas disponible.</div>
            <div style={{ display: "flex", gap: 8 }}>
              {LOUEURS.map((l) => {
                const on = t.loueur === l;
                return (
                  <button key={l} onClick={() => majTransport({ loueur: l })} style={{
                    flex: 1, border: `1px solid ${on ? C.jaune : C.grisClair}`, cursor: "pointer", borderRadius: 10, padding: "10px 8px", fontWeight: 900, fontSize: 15,
                    background: on ? C.jaune : "#fff", color: on ? C.bleuNuit : C.gris,
                  }}>{l}</button>
                );
              })}
            </div>
          </div>
        )}
        {t.mode === "Voitures des parents" && (
          <div style={{ marginBottom: 12 }}>
            <Field label="Nombre de voitures qui accompagnent"><Inp type="number" inputMode="numeric" value={t.nbVoitures || ""} onChange={(ev) => majTransport({ nbVoitures: ev.target.value })} placeholder="Ex : 4" /></Field>
            <Field label="Noms des parents qui conduisent"><Inp value={t.parents || ""} onChange={(ev) => majTransport({ parents: ev.target.value })} placeholder="Ex : Dupont, Martin, Diallo" /></Field>
          </div>
        )}
        {t.mode && (
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, color: C.gris, fontWeight: 700 }}>Réponse :</span>
              {t.statut === "acceptee" ? <Pastille bg="#E2F4E9" color={C.vert}>Acceptée</Pastille>
                : t.statut === "refusee" ? <Pastille bg="#FBE3E3" color={C.rouge}>Refusée</Pastille>
                  : <Pastille bg={C.jaune} color={C.bleuNuit}>En attente</Pastille>}
            </div>
            {t.statut === "refusee" && t.cause ? <div style={{ fontSize: 13, color: C.rouge, marginBottom: 8 }}>Cause : {t.cause}</div> : null}
            {!causeRefus ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="accent" size="sm" onClick={() => repondre(true)}><Check size={15} /> Accepter</Btn>
                <Btn variant="danger" size="sm" onClick={() => { setCause(""); setCauseRefus(true); }}><X size={15} /> Refuser</Btn>
              </div>
            ) : (
              <div>
                <Field label="Cause du refus">
                  <Inp value={cause} onChange={(ev) => setCause(ev.target.value)} placeholder="Minibus indisponible, déjà réservé..." />
                </Field>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="danger" size="sm" disabled={!cause.trim()} onClick={() => repondre(false)}>Confirmer le refus</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => setCauseRefus(false)}>Annuler</Btn>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </>)}

      <div style={{ fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}><ShieldAlert size={17} color={C.bleu} /> Encadrement</div>
      <div style={{ fontSize: 12, color: C.gris, marginBottom: 10 }}>Désigne le dirigeant, le délégué et l'arbitre depuis la liste enregistrée.</div>
      {champs.map(({ role, key, src, options }) => {
        const gens = parRole(src || role);
        const opts = options || [];
        return (
          <Field key={key} label={role}>
            <Sel value={e[key] || ""} onChange={(ev) => majEncadrement({ [key]: ev.target.value })}>
              <option value="">Non désigné</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
              {gens.map((g) => <option key={g.id}>{g.nom}</option>)}
              {e[key] && !gens.some((g) => g.nom === e[key]) && !opts.includes(e[key]) ? <option value={e[key]}>{e[key]}</option> : null}
            </Sel>
          </Field>
        );
      })}
      <Btn variant="ghost" full onClick={() => setRoster(true)}><Edit3 size={16} /> Modifier la liste des noms</Btn>

      {roster && <RosterEncadrement db={db} mutate={mutate} onClose={() => setRoster(false)} />}
      {convoc && <Convocation db={db} cat={cur.cat} match={match} mutate={mutate} onClose={() => setConvoc(false)} />}
    </Modal>
  );
}


function exporterRapportMatchPDF(jsPDF, match, players, db, educateur) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595, H = 842, M = 40;
  const navy = [14, 30, 51], bleu = [26, 53, 83], orr = [198, 162, 76], encre = [22, 32, 46], gris = [122, 130, 142], trait = [228, 232, 238], rouge = [181, 72, 63], vert = [47, 163, 107], blanc = [255, 255, 255];
  const sc = (a) => doc.setTextColor(a[0], a[1], a[2]);
  const sf = (a) => doc.setFillColor(a[0], a[1], a[2]);
  const sd = (a) => doc.setDrawColor(a[0], a[1], a[2]);
  const cur = (db.matches || []).find((x) => x.id === match.id) || match;
  const joue = cur.scorePour != null && cur.scoreContre != null;
  const dom = match.lieu === "Domicile";
  const g = dom ? "SOCHAUX" : (match.adversaire || "Adversaire");
  const dr = dom ? (match.adversaire || "Adversaire") : "SOCHAUX";
  const score = joue ? (dom ? `${cur.scorePour} - ${cur.scoreContre}` : `${cur.scoreContre} - ${cur.scorePour}`) : "Score à venir";
  const nomOf = (id) => { const p = players.find((x) => x.id === id); return p ? `${p.prenom} ${p.nom}` : ""; };
  const luM = (db.lineups && db.lineups[match.id]) || null;
  const luC = (db.lineups && db.lineups[match.cat]) || null;
  const nbSlots = (lu) => (lu && lu.slots) ? Object.keys(lu.slots).length : 0;
  let lineup = nbSlots(luM) ? luM : (nbSlots(luC) ? luC : null);
  if (!lineup && db.lineups) { let bN = 0; Object.keys(db.lineups).forEach((k) => { const n = nbSlots(db.lineups[k]); if (n > bN) { bN = n; lineup = db.lineups[k]; } }); }
  const typeFoot = (lineup && lineup.format) || ((CATEGORIES.find((c) => c.id === match.cat) || {}).type) || 8;
  const formations = FORMATIONS[typeFoot] || {};
  const systeme = (lineup && lineup.formation) || Object.keys(formations)[0] || "";
  const slotsDef = formations[systeme] || [];
  const slots = (lineup && lineup.slots) || {};
  const rempl = (lineup && lineup.remplacants) || [];
  const capit = (lineup && lineup.capitaine) || null;
  const buts = players.filter((p) => cur.buteurs && cur.buteurs[p.id]).map((p) => `${p.nom} (${cur.buteurs[p.id]})`);
  const passes = players.filter((p) => cur.passeurs && cur.passeurs[p.id]).map((p) => `${p.nom} (${cur.passeurs[p.id]})`);
  const notes = players.map((p) => cur.notes && cur.notes[p.id] && cur.notes[p.id].note).filter((n) => n);
  const moyNote = notes.length ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : null;
  let hommeMatch = null, meilleure = 0; players.forEach((p) => { const n = cur.notes && cur.notes[p.id] && cur.notes[p.id].note; if (n && n > meilleure) { meilleure = n; hommeMatch = p; } });
  const temps = players.map((p) => cur.tempsJeu && cur.tempsJeu[p.id]).filter((t) => t);
  const nbUtilises = temps.length;
  const tempsMoy = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;

  sf(navy); doc.rect(0, 0, W, 4, "F");
  if (typeof LOGO_CLUB === "string" && LOGO_CLUB) { try { doc.addImage(LOGO_CLUB, "PNG", W - M - 34, 8, 34, 41); } catch (e) {} }
  sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("FC SOCHAUX-MONTBÉLIARD", M, 30);
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  doc.text(secteurLabel(match.cat) + " - Rapport de match" + (match.cat ? " - " + match.cat : "") + (educateur ? " - Éducateur : " + educateur : ""), M, 44);
  sd(orr); doc.setLineWidth(1); doc.line(M, 52, W - M, 52); doc.setLineWidth(0.5);
  let y = 74;
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const infos = [fmtDate(match.date), match.lieu, match.type, match.competition, systeme ? "Système " + systeme : ""].filter(Boolean).join("   -   ");
  if (infos) { doc.text(infos, M, y); y += 20; }
  sc(encre); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(g, M, y);
  sc(bleu); doc.setFontSize(17); const sw = doc.getTextWidth(score); doc.text(score, W / 2 - sw / 2, y);
  sc(encre); doc.setFontSize(13); const drw = doc.getTextWidth(dr); doc.text(dr, W - M - drw, y);
  y += 22; sd(trait); doc.line(M, y, W - M, y); y += 16;

  sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Résumé", M, y); y += 14;
  const resume = [
    ["Buteurs", buts.length ? buts.join(", ") : "-"],
    ["Passeurs", passes.length ? passes.join(", ") : "-"],
    ["Homme du match", hommeMatch ? `${hommeMatch.prenom} ${hommeMatch.nom} (${meilleure}/7)` : "-"],
    ["Moyenne de l'équipe", moyNote ? `${moyNote}/7` : "-"],
    ["Joueurs utilisés", String(nbUtilises || "-")],
    ["Temps de jeu moyen", tempsMoy ? `${tempsMoy} min` : "-"],
  ];
  resume.forEach(([k, v]) => {
    sc(gris); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.text(k + " :", M, y);
    sc(encre); doc.setFont("helvetica", "normal");
    const kw = doc.getTextWidth(k + " : ");
    const w = doc.splitTextToSize(v, W - 2 * M - kw - 4);
    w.forEach((ln, i) => doc.text(ln, M + kw + 4, y + i * 12));
    y += Math.max(12, w.length * 12) + 2;
  });
  y += 10;

  if (slotsDef.length) {
    if (y > H - 340) { doc.addPage(); y = 50; }
    sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Composition" + (systeme ? " (" + systeme + ")" : ""), M, y); y += 12;
    const TW = 210, TH = 290, Tx = M, Ty = y;
    sf(bleu); doc.roundedRect(Tx, Ty, TW, TH, 6, 6, "F");
    sd(blanc); doc.setLineWidth(0.7);
    doc.line(Tx, Ty + TH / 2, Tx + TW, Ty + TH / 2);
    doc.circle(Tx + TW / 2, Ty + TH / 2, 20);
    doc.rect(Tx + TW * 0.28, Ty, TW * 0.44, 26);
    doc.rect(Tx + TW * 0.28, Ty + TH - 26, TW * 0.44, 26);
    slotsDef.forEach((s, i) => {
      const cx = Tx + (s.x / 100) * TW, cy = Ty + (s.y / 100) * TH;
      const jid = slots[i]; const j = players.find((p) => p.id === jid);
      const gk = s.l === "G"; const r = 11;
      let photoOk = false;
      if (j && j.photo) {
        try {
          doc.saveGraphicsState();
          doc.circle(cx, cy, r); doc.clip(); doc.discardPath();
          let iw = r * 2, ih = r * 2;
          try { const pr = doc.getImageProperties(j.photo); const ar = pr.width / pr.height; if (ar > 1) iw = r * 2 * ar; else ih = (r * 2) / ar; } catch (e) {}
          doc.addImage(j.photo, "JPEG", cx - iw / 2, cy - ih / 2, iw, ih);
          doc.restoreGraphicsState();
          photoOk = true;
        } catch (e) { try { doc.restoreGraphicsState(); } catch (e2) {} photoOk = false; }
      }
      if (photoOk) { sd(blanc); doc.setLineWidth(1.3); doc.circle(cx, cy, r, "S"); doc.setLineWidth(0.5); }
      else {
        sf(gk ? vert : blanc); doc.circle(cx, cy, r, "F");
        sc(gk ? blanc : navy); doc.setFont("helvetica", "bold"); doc.setFontSize(6); doc.text(s.l, cx, cy + 2, { align: "center" });
      }
      if (j) { sc(blanc); doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.text(((j.nom || "") + (capit === jid ? " (C)" : "")).slice(0, 14), cx, cy + r + 7, { align: "center" }); }
    });
    const Rx = Tx + TW + 20; let ry = Ty + 4;
    sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Remplaçants", Rx, ry); ry += 15;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); sc(encre);
    if (rempl.length) { rempl.forEach((id) => { const nm = nomOf(id); if (nm) { doc.text("- " + nm, Rx, ry); ry += 13; } }); }
    else { sc(gris); doc.setFont("helvetica", "italic"); doc.text("Aucun", Rx, ry); ry += 13; doc.setFont("helvetica", "normal"); }
    y = Math.max(Ty + TH, ry) + 20;
  }

  if (y > H - 160) { doc.addPage(); y = 50; }
  sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Feuille de match", M, y); y += 15;
  const xJ = M, xB = 258, xP = 305, xM = 358, xN = 408, xD = 455;
  sc(gris); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  doc.text("Joueur", xJ, y); doc.text("Buts", xB, y, { align: "center" }); doc.text("Passes", xP, y, { align: "center" }); doc.text("Min", xM, y, { align: "center" }); doc.text("Note", xN, y, { align: "center" }); doc.text("Discipline", xD, y);
  y += 4; sd(trait); doc.line(M, y, W - M, y); y += 13;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  if (!players.length) { sc(gris); doc.setFont("helvetica", "italic"); doc.text("Aucun joueur sur la feuille.", xJ, y); y += 14; }
  players.forEach((p) => {
    if (y > H - 60) { doc.addPage(); y = 50; }
    const b = (cur.buteurs && cur.buteurs[p.id]) || 0, a = (cur.passeurs && cur.passeurs[p.id]) || 0;
    const t = cur.tempsJeu && cur.tempsJeu[p.id]; const note = cur.notes && cur.notes[p.id] && cur.notes[p.id].note;
    const cj = (cur.jaunes && cur.jaunes[p.id]) || 0, crg = !!(cur.rouges && cur.rouges[p.id]), bl = !!(cur.blesses && cur.blesses[p.id]);
    const cbl = !!(cur.blancs && cur.blancs[p.id]);
    const cm = (cur.cartonsMin && cur.cartonsMin[p.id]) || {};
    const jStr = cj ? `${cj} jaune${cj > 1 ? "s" : ""}${cm.jaune ? ` (${cm.jaune}')` : ""}` : "";
    const blcStr = cbl ? `blanc${cm.blanc ? ` (${cm.blanc}')` : ""}` : "";
    const rStr = crg ? `rouge${cm.rouge ? ` (${cm.rouge}')` : ""}` : "";
    const disc = [jStr, blcStr, rStr, bl ? "blessé" : ""].filter(Boolean).join(", ") || "-";
    sc(encre); doc.setFont("helvetica", "normal"); doc.text(`${p.prenom} ${p.nom}`.slice(0, 32), xJ, y);
    doc.text(String(b), xB, y, { align: "center" }); doc.text(String(a), xP, y, { align: "center" });
    doc.text(t != null && t !== "" ? String(t) : "-", xM, y, { align: "center" }); doc.text(note ? `${note}/7` : "-", xN, y, { align: "center" });
    sc(crg || bl ? rouge : gris); doc.text(disc.slice(0, 22), xD, y);
    y += 14;
  });
  y += 8; sd(trait); doc.line(M, y, W - M, y); y += 18;

  if (cur.rapport && cur.rapport.trim()) {
    if (y > H - 80) { doc.addPage(); y = 50; }
    sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Compte rendu", M, y); y += 15;
    sc(encre); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const w = doc.splitTextToSize(cur.rapport.trim(), W - 2 * M);
    w.forEach((ln) => { if (y > H - 40) { doc.addPage(); y = 50; } doc.text(ln, M, y); y += 13; });
  }
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Édité le " + new Date().toLocaleDateString("fr-FR"), M, H - 16);
  doc.save("Rapport_" + (match.cat || "match") + "_" + String(match.date || "").replace(/[^0-9A-Za-z]/g, "_") + ".pdf");
}

function RapportMatch({ match, players, db, mutate, onClose, onEdit, onDelete, peutValider, profil }) {
  const [noteFor, setNoteFor] = useState(null);
  const [orga, setOrga] = useState(false);
  const [msgPdf, setMsgPdf] = useState(null);
  const joue = match.scorePour != null && match.scoreContre != null;

  function compteur(champ, joueurId, delta) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m[champ] = m[champ] || {};
      const v = Math.max(0, (+m[champ][joueurId] || 0) + delta);
      if (v === 0) delete m[champ][joueurId]; else m[champ][joueurId] = v;
      return d;
    });
  }
  function setTemps(joueurId, val) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.tempsJeu = m.tempsJeu || {};
      if (val === "" || +val === 0) delete m.tempsJeu[joueurId]; else m.tempsJeu[joueurId] = +val;
      return d;
    });
  }
  function setRapport(txt) {
    mutate((d) => { d.matches.find((x) => x.id === match.id).rapport = txt; return d; });
  }
  function cycleJaune(joueurId) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.jaunes = m.jaunes || {};
      const v = ((+m.jaunes[joueurId] || 0) + 1) % 3;
      if (v === 0) delete m.jaunes[joueurId]; else m.jaunes[joueurId] = v;
      return d;
    });
  }
  function toggleRouge(joueurId) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.rouges = m.rouges || {};
      const pl = d.players.find((x) => x.id === joueurId);
      if (m.rouges[joueurId]) {
        delete m.rouges[joueurId];
        // retire la suspension automatique si elle n'a pas encore été affinée (toujours 1 match)
        if (pl && (+pl.suspension || 0) === 1) { pl.suspension = 0; pl.suspensionFin = ""; }
      } else {
        m.rouges[joueurId] = 1;
        // suspension automatique minimale : 1 match ferme, pour le match suivant
        if (pl) {
          pl.suspension = 1;
          const prochains = (d.matches || []).filter((x) => x.cat === m.cat && x.date && x.date > (m.date || "")).sort((a, b) => a.date.localeCompare(b.date));
          pl.suspensionFin = prochains.length ? prochains[0].date : "";
        }
      }
      return d;
    });
  }
  function toggleBlanc(joueurId) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.blancs = m.blancs || {};
      if (m.blancs[joueurId]) delete m.blancs[joueurId]; else m.blancs[joueurId] = 1;
      return d;
    });
  }
  function setMinCarton(joueurId, type, val) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.cartonsMin = m.cartonsMin || {};
      m.cartonsMin[joueurId] = { ...(m.cartonsMin[joueurId] || {}), [type]: val };
      return d;
    });
  }
  function toggleBlesse(joueurId) {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.blesses = m.blesses || {};
      d.injuries = d.injuries || [];
      if (m.blesses[joueurId]) {
        delete m.blesses[joueurId];
        d.injuries = d.injuries.filter((b) => !(b.auto && b.matchId === match.id && b.joueurId === joueurId));
      } else {
        m.blesses[joueurId] = true;
        d.injuries.push({ id: uid(), cat: match.cat, joueurId, zone: "Blessé en match", debut: match.date || "", duree: "", suivi: "", fini: false, matchId: match.id, auto: true });
      }
      return d;
    });
  }
  const ciMatch = CATEGORIES.find((c) => c.id === match.cat);
  const cartonsActifs = (ciMatch && ciMatch.type === 11) || match.cat === "U13";
  const cur = db.matches.find((x) => x.id === match.id);
  async function telechargerRapport() {
    setMsgPdf("Préparation du PDF...");
    try { const jsPDF = await chargerJsPDF(); exporterRapportMatchPDF(jsPDF, match, players, db, profil && profil.nom); setMsgPdf(null); }
    catch (e) { setMsgPdf("Module d'impression indisponible. Sur le site en ligne, le document se génère normalement."); }
  }

  const ligne = (p) => {
    const b = cur.buteurs?.[p.id] || 0, a = cur.passeurs?.[p.id] || 0;
    const t = cur.tempsJeu?.[p.id] ?? "";
    const note = cur.notes?.[p.id]?.note;
    const cj = cur.jaunes?.[p.id] || 0;
    const cr = !!cur.rouges?.[p.id];
    const cb = !!cur.blancs?.[p.id];
    const cm = cur.cartonsMin?.[p.id] || {};
    const bl = !!cur.blesses?.[p.id];
    return (
      <Card key={p.id} style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12 }}>{initials(p)}</div>
          <div style={{ flex: 1, fontWeight: 800 }}>{p.prenom} {p.nom}</div>
          <button onClick={() => setNoteFor(p)} style={{
            border: "none", cursor: "pointer", borderRadius: 10, padding: "6px 11px", fontWeight: 900,
            background: note ? C.jaune : C.grisClair, color: note ? C.bleuNuit : C.gris, fontSize: 14,
          }}>{note ? `${note}/7` : "Noter"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Compteur label="Buts" val={b} onMinus={() => compteur("buteurs", p.id, -1)} onPlus={() => compteur("buteurs", p.id, 1)} />
          <Compteur label="Passes" val={a} onMinus={() => compteur("passeurs", p.id, -1)} onPlus={() => compteur("passeurs", p.id, 1)} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>Minutes</span>
            <input type="number" min="0" value={t} onChange={(e) => setTemps(p.id, e.target.value)}
              style={{ width: 58, padding: "6px 8px", borderRadius: 9, border: `1px solid ${C.grisClair}`, fontSize: 14, textAlign: "center" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
          {cartonsActifs && (
            <button onClick={() => cycleJaune(p.id)} title="Carton jaune (touche pour 1 ou 2)" style={{
              display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${cj ? "#E3B505" : C.grisClair}`, cursor: "pointer",
              borderRadius: 9, padding: "7px 11px", fontWeight: 800, fontSize: 13, background: cj ? "#FFF3CC" : "#fff", color: C.encre,
            }}>
              <span style={{ width: 12, height: 16, borderRadius: 2, background: "#F2C200", display: "inline-block" }} />
              Jaune{cj === 2 ? " x2" : ""}
            </button>
          )}
          {cartonsActifs && (
            <button onClick={() => toggleBlanc(p.id)} title="Carton blanc (exclusion temporaire)" style={{
              display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${cb ? C.bleu : C.grisClair}`, cursor: "pointer",
              borderRadius: 9, padding: "7px 11px", fontWeight: 800, fontSize: 13, background: cb ? "#EAF0F7" : "#fff", color: C.encre,
            }}>
              <span style={{ width: 12, height: 16, borderRadius: 2, background: "#fff", border: "1px solid #C7CEDA", display: "inline-block" }} />
              Blanc
            </button>
          )}
          {cartonsActifs && (
            <button onClick={() => toggleRouge(p.id)} title="Carton rouge" style={{
              display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${cr ? "#B5483F" : C.grisClair}`, cursor: "pointer",
              borderRadius: 9, padding: "7px 11px", fontWeight: 800, fontSize: 13, background: cr ? "#FBE3E3" : "#fff", color: C.encre,
            }}>
              <span style={{ width: 12, height: 16, borderRadius: 2, background: "#D33A2C", display: "inline-block" }} />
              Rouge
            </button>
          )}
          <button onClick={() => toggleBlesse(p.id)} title="Blessé (ajouté à l'infirmerie)" style={{
            display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${bl ? "#B5483F" : C.grisClair}`, cursor: "pointer",
            borderRadius: 9, padding: "7px 11px", fontWeight: 800, fontSize: 13, background: bl ? "#FBE3E3" : "#fff", color: bl ? C.rouge : C.encre,
          }}>
            <HeartPulse size={14} /> Blessé
          </button>
        </div>
        {(cj > 0 || cb || cr) && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
            <span style={{ fontSize: 11.5, color: C.gris, fontWeight: 700 }}>Minute(s)</span>
            {cj > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.gris }}>Jaune</span>
                <input value={cm.jaune || ""} onChange={(e) => setMinCarton(p.id, "jaune", e.target.value)} placeholder="min" style={{ width: 54, padding: "5px 7px", borderRadius: 8, border: `1px solid ${C.grisClair}`, fontSize: 13, textAlign: "center" }} />
              </span>
            )}
            {cb && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.gris }}>Blanc</span>
                <input value={cm.blanc || ""} onChange={(e) => setMinCarton(p.id, "blanc", e.target.value)} placeholder="min" style={{ width: 54, padding: "5px 7px", borderRadius: 8, border: `1px solid ${C.grisClair}`, fontSize: 13, textAlign: "center" }} />
              </span>
            )}
            {cr && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.gris }}>Rouge</span>
                <input value={cm.rouge || ""} onChange={(e) => setMinCarton(p.id, "rouge", e.target.value)} placeholder="min" style={{ width: 54, padding: "5px 7px", borderRadius: 8, border: `1px solid ${C.grisClair}`, fontSize: 13, textAlign: "center" }} />
              </span>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <Modal title="Rapport de match" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onEdit} full><Edit3 size={16} /> Modifier</Btn>
        <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>
      </>}>
      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{fmtDate(match.date)} · {match.lieu}{match.type ? ` · ${match.type}` : ""}{match.competition ? ` · ${match.competition}` : ""}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 8 }}>
          <strong style={{ fontSize: 16 }}>{match.lieu === "Domicile" ? CLUB : match.adversaire}</strong>
          {joue
            ? <span style={{ fontSize: 26, fontWeight: 900, color: C.bleu }}>{match.lieu === "Domicile" ? `${match.scorePour} - ${match.scoreContre}` : `${match.scoreContre} - ${match.scorePour}`}</span>
            : <span style={{ fontSize: 14, fontWeight: 800, color: C.gris }}>à venir</span>}
          <strong style={{ fontSize: 16 }}>{match.lieu === "Domicile" ? match.adversaire : CLUB}</strong>
        </div>
      </Card>

      <Card onClick={() => setOrga(true)} style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.bleu, color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto" }}><MapPin size={18} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>Organisation du match</div>
          <div style={{ fontSize: 12, color: C.gris, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {(() => {
              const t = cur.transport || {}, e = cur.encadrement || {}, r = cur.reservation || {};
              const parts = [];
              if (match.lieu === "Domicile") {
                parts.push(r.statut === "validee" ? `Terrain validé${r.heureLiberation ? `, vestiaire libéré ${r.heureLiberation}` : ""}` : r.statut === "refusee" ? "Terrain refusé" : "Terrain à valider");
              }
              if (match.lieu === "Extérieur") {
                parts.push(t.mode ? `${t.mode}${t.statut === "acceptee" ? " (accepté)" : t.statut === "refusee" ? " (refusé)" : " (en attente)"}` : "Transport à définir");
              }
              if (e.arbitre) parts.push(`Arbitre : ${e.arbitre}`);
              return parts.length ? parts.join(" · ") : "À renseigner";
            })()}
          </div>
        </div>
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <div style={{ fontWeight: 800, marginBottom: 8 }}>Feuille de match</div>
      {players.length === 0 ? <Empty icon={<Users size={22} color={C.gris} />} text="Aucun joueur" /> :
        <div style={{ display: "grid", gap: 9 }}>{players.map(ligne)}</div>}

      <div style={{ fontWeight: 800, margin: "16px 0 8px" }}>Compte rendu du match</div>
      <textarea value={cur.rapport || ""} onChange={(e) => setRapport(e.target.value)} rows={10}
        placeholder="Analyse de la rencontre, points forts, axes de progrès..."
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", fontSize: 15.5, lineHeight: 1.5, minHeight: 220 }} />
      <div style={{ fontSize: 11.5, color: C.gris, marginTop: 4 }}>Aucune limite de longueur. Tu peux étirer la zone par le coin en bas à droite.</div>

      <Btn variant="accent" full style={{ marginTop: 16 }} onClick={telechargerRapport}><FileDown size={16} /> Exporter le rapport en PDF</Btn>
      {msgPdf && <div style={{ fontSize: 12.5, color: C.encre, background: C.fond, borderRadius: 10, padding: 10, marginTop: 8 }}>{msgPdf}</div>}

      {noteFor && <NoterJoueur match={match} player={noteFor} db={db} mutate={mutate} onClose={() => setNoteFor(null)} />}
      {orga && <OrgaMatch match={match} db={db} mutate={mutate} peutValider={peutValider} onClose={() => setOrga(false)} />}
    </Modal>
  );
}

function Compteur({ label, val, onMinus, onPlus }) {
  const b = { width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 16, background: C.grisClair, color: C.bleu };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{label}</span>
      <button style={b} onClick={onMinus}>−</button>
      <span style={{ fontWeight: 900, minWidth: 16, textAlign: "center" }}>{val}</span>
      <button style={{ ...b, background: C.jaune, color: C.bleuNuit }} onClick={onPlus}>+</button>
    </div>
  );
}

function NoterJoueur({ match, player, db, mutate, onClose }) {
  const m0 = db.matches.find((x) => x.id === match.id);
  const existing = (m0.notes && m0.notes[player.id]) || {};
  const [n, setN] = useState({ note: existing.note || "", commentaire: existing.commentaire || "", ...AXES.reduce((o, a) => ({ ...o, [a.k]: existing[a.k] || "" }), {}) });
  const [minutes, setMinutes] = useState((m0.tempsJeu && m0.tempsJeu[player.id] != null) ? m0.tempsJeu[player.id] : "");

  function save() {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.notes = m.notes || {};
      m.notes[player.id] = { ...n };
      m.tempsJeu = m.tempsJeu || {};
      if (minutes === "" || +minutes === 0) delete m.tempsJeu[player.id]; else m.tempsJeu[player.id] = +minutes;
      return d;
    });
    onClose();
  }

  const echelle = (current, onPick) => (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5, 6, 7].map((v) => (
        <button key={v} onClick={() => onPick(v)} style={{
          flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 900, fontSize: 14,
          background: +current === v ? C.bleu : C.grisClair, color: +current === v ? "#fff" : C.gris,
        }}>{v}</button>
      ))}
    </div>
  );

  return (
    <Modal title={`Noter ${player.prenom} ${player.nom}`} onClose={onClose}
      footer={<Btn variant="accent" full onClick={save}><Save size={16} /> Valider la note</Btn>}>
      <Field label="Minutes jouées">
        <Inp type="number" min="0" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="Temps de jeu en minutes" />
      </Field>
      <Field label="Note globale (1 à 7)">{echelle(n.note, (v) => setN((p) => ({ ...p, note: v })))}</Field>
      <div style={{ height: 6 }} />
      {AXES.map((a) => (
        <Field key={a.k} label={a.label}>{echelle(n[a.k], (v) => setN((p) => ({ ...p, [a.k]: v })))}</Field>
      ))}
      <Field label="Commentaire">
        <textarea value={n.commentaire} onChange={(e) => setN((p) => ({ ...p, commentaire: e.target.value }))} rows={3}
          placeholder="Qualités observées, points à travailler..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
    </Modal>
  );
}


/* ============================================================
   Entrainements, presences et blessures
   ============================================================ */
function Entrainements({ players, cat, db, mutate }) {
  const today = new Date();
  const [sous, setSous] = useState("planning");
  const [annee, setAnnee] = useState(today.getFullYear());
  const [mois, setMois] = useState(today.getMonth());
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(null);
  const [blessure, setBlessure] = useState(null);
  const [recap, setRecap] = useState(false);

  const config = db.config || { trainingDays: {}, breaks: {} };
  const jours = config.trainingDays?.[cat] || [];
  const breaks = config.breaks || {};

  function toggleJour(dow) {
    mutate((d) => {
      d.config = d.config || { trainingDays: {}, breaks: {} };
      d.config.trainingDays = d.config.trainingDays || {};
      const cur = d.config.trainingDays[cat] || [];
      d.config.trainingDays[cat] = cur.includes(dow) ? cur.filter((x) => x !== dow) : [...cur, dow];
      return d;
    });
  }
  function setBreakWeeks(hid, weeks) {
    mutate((d) => {
      d.config = d.config || { trainingDays: {}, breaks: {} };
      d.config.breaks = d.config.breaks || {};
      d.config.breaks[hid] = weeks;
      return d;
    });
  }

  const entries = useMemo(() => {
    const nb = daysInMonth(annee, mois);
    const prefix = `${annee}-${pad(mois + 1)}`;
    const existants = {};
    db.trainings.forEach((t) => { if (t.cat === cat && t.date && t.date.startsWith(prefix)) existants[t.date] = t; });
    const seen = new Set();
    const list = [];
    for (let day = 1; day <= nb; day++) {
      const s = dateStr(annee, mois, day);
      const dow = dowOf(annee, mois, day);
      const existing = existants[s];
      const estJour = jours.includes(dow);
      if (!estJour && !existing) continue;
      const h = holidayOf(s, breaks);
      if (h && h.arret && !existing) {
        if (!seen.has(h.id)) { seen.add(h.id); list.push({ type: "vac", date: s, holiday: h }); }
        continue;
      }
      list.push({ type: "session", date: s, training: existing });
    }
    return list;
  }, [annee, mois, jours, breaks, db.trainings, cat]);

  const blessures = db.injuries.filter((i) => i.cat === cat).sort((a, b) => (a.fini === b.fini) ? 0 : a.fini ? 1 : -1);

  const ongletStyle = (on) => ({
    flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 800,
    background: on ? C.bleu : "#fff", color: on ? "#fff" : C.gris, boxShadow: "0 1px 3px rgba(10,42,107,0.06)",
  });
  const ordreJours = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={ongletStyle(sous === "planning")} onClick={() => setSous("planning")}>Planning et présences</button>
        <button style={ongletStyle(sous === "infirmerie")} onClick={() => setSous("infirmerie")}>Infirmerie</button>
      </div>

      {sous === "planning" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <Sel value={mois} onChange={(e) => setMois(+e.target.value)} style={{ flex: 2 }}>
              {MOIS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </Sel>
            <Sel value={annee} onChange={(e) => setAnnee(+e.target.value)} style={{ flex: 1 }}>
              {[2025, 2026, 2027].map((a) => <option key={a} value={a}>{a}</option>)}
            </Sel>
          </div>

          <Card style={{ marginBottom: 12, padding: 13 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.gris, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 9 }}>Jours d'entraînement</div>
            <div style={{ display: "flex", gap: 6 }}>
              {ordreJours.map((dow) => {
                const on = jours.includes(dow);
                return (
                  <button key={dow} onClick={() => toggleJour(dow)} style={{
                    flex: 1, border: "none", cursor: "pointer", borderRadius: 9, padding: "9px 0", fontSize: 12.5, fontWeight: 800,
                    background: on ? C.jaune : C.grisClair, color: on ? C.bleuNuit : C.gris,
                  }}>{JOURS_COURT[dow]}</button>
                );
              })}
            </div>
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <Btn variant="primary" size="sm" onClick={() => setRecap(true)}><ClipboardList size={16} /> Récap présences</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setEdit({ cat, presence: {} })}><Plus size={16} /> Séance ponctuelle</Btn>
          </div>
          <Btn variant="accent" full style={{ marginBottom: 12 }} onClick={() => setBlessure({ cat, circonstance: "entrainement", debut: hoyISO() })}><HeartPulse size={16} /> Signaler un joueur blessé à l'entraînement</Btn>

          {entries.length === 0 ? (
            <Empty icon={<Dumbbell size={26} color={C.gris} />} text="Aucune séance ce mois" sub={jours.length === 0 ? "Choisis d'abord les jours d'entraînement" : "Aucun entraînement sur les jours choisis"} />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {entries.map((en) => {
                if (en.type === "vac") {
                  const h = en.holiday;
                  const complet = h.full || h.court;
                  return (
                    <Card key={"v" + h.id} style={{ background: "#FFF8E6", borderColor: "#F2DFA0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.jauneFonce }}>
                        <CalendarDays size={17} /> Vacances {h.nom}
                      </div>
                      <div style={{ fontSize: 12.5, color: C.gris, margin: "5px 0 9px" }}>
                        Du {jjmm(h.debut)} au {jjmm(addDays(h.reprise, -1))} · {complet ? "arrêt complet" : "arrêt programmé"}
                      </div>
                      {!complet && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>Arrêt</span>
                          {[1, 2].map((w) => {
                            const on = (breaks[h.id] || 2) === w;
                            return (
                              <button key={w} onClick={() => setBreakWeeks(h.id, w)} style={{
                                border: "none", cursor: "pointer", borderRadius: 8, padding: "6px 12px", fontSize: 12.5, fontWeight: 800,
                                background: on ? C.bleu : C.grisClair, color: on ? "#fff" : C.gris,
                              }}>{w} semaine{w > 1 ? "s" : ""}</button>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                }
                const t = en.training;
                const pres = Object.values(t?.presence || {});
                const nbPres = pres.filter((x) => x === "present" || x === "retard").length;
                const nbAbs = pres.filter((x) => x === "absent" || x === "malade").length;
                const nbBl = pres.filter((x) => x === "blesse").length;
                return (
                  <Card key={en.date} onClick={() => t ? setOpen(t) : setEdit({ cat, date: en.date, presence: {} })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: t ? 8 : 0 }}>
                      <div style={{ fontWeight: 800 }}>{jourLong(en.date)}</div>
                      {t ? <Pastille bg="#E2F4E9" color={C.vert}>{nbPres} présents</Pastille> : <Pastille bg={C.jaune} color={C.bleuNuit}>À pointer</Pastille>}
                    </div>
                    {t && (
                      <>
                        {t.theme && <div style={{ fontSize: 13, color: C.gris, marginBottom: 8 }}>{t.theme}</div>}
                        <div style={{ display: "flex", gap: 7 }}>
                          <Pastille bg="#FBE3E3" color={C.rouge}>{nbAbs} absents</Pastille>
                          {nbBl > 0 && <Pastille bg="#FFF3DA" color={C.jauneFonce}>{nbBl} blessés</Pastille>}
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {sous === "infirmerie" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn variant="accent" size="sm" onClick={() => setBlessure({ cat, circonstance: "entrainement", debut: hoyISO() })}><Plus size={16} /> Signaler un blessé</Btn>
          </div>
          {blessures.length === 0 ? (
            <Empty icon={<HeartPulse size={26} color={C.gris} />} text="Aucune blessure" sub="Tant mieux pour le groupe" />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {blessures.map((b) => {
                const p = db.players.find((x) => x.id === b.joueurId);
                const clubType = priseEnChargeMedicale(b.cat);
                const estClub = b.priseEnCharge ? b.priseEnCharge === "club" : clubType !== "parents";
                const patho = b.pathologie && b.pathologie !== "Autre" ? b.pathologie : (b.zone || b.signeCoach || "Blessure à évaluer");
                return (
                  <Card key={b.id} onClick={() => setBlessure(b)} style={{ borderColor: b.fini ? C.grisClair : "#F3C9C9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{p ? `${p.prenom} ${p.nom}` : "Joueur supprimé"}</strong>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {b.phase ? <Pastille bg="#E7EEF6" color={C.bleu}>{b.phase}</Pastille> : null}
                        <Pastille bg={b.fini ? "#E2F4E9" : "#FBE3E3"} color={b.fini ? C.vert : C.rouge}>{b.fini ? "Rétabli" : "En cours"}</Pastille>
                      </div>
                    </div>
                    <div style={{ fontSize: 13.5, color: C.encre, marginTop: 5, fontWeight: 700 }}>{patho}{b.cote ? ` (${texteCote(b.cote)})` : ""}{b.circonstance ? `, ${texteCirconstance(b.circonstance)}` : ""}</div>
                    <div style={{ fontSize: 12.5, color: C.gris, marginTop: 2 }}>
                      {b.debut ? `blessé le ${new Date(b.debut + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.datePriseEnCharge ? ` · pris en charge le ${new Date(b.datePriseEnCharge + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.dateRetour ? ` · retour prévu ${new Date(b.dateRetour + "T00:00:00").toLocaleDateString("fr-FR")}` : (b.duree ? ` · arrêt estimé ${b.duree}` : "")}{b.kine ? ` · kiné ${b.kine}` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: estClub ? C.bleu : "#B87A2B", marginTop: 4, fontWeight: 700 }}>{estClub ? (clubType === "pro" ? "Suivi club, professionnels" : "Suivi club, centre de formation") : "Soins pris en charge par les parents"}</div>
                    {b.phase === "P4" && b.testRetour ? <div style={{ fontSize: 12, color: b.testRetour === "valide" ? C.vert : C.rouge, marginTop: 3, fontWeight: 700 }}>{b.testRetour === "valide" ? "Test validé, retour sur le terrain" : `Test non validé${b.raisonNonRetour ? " : " + b.raisonNonRetour : ""}`}</div> : null}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {edit && <EditSeance seance={edit} players={players} onClose={() => setEdit(null)} onSave={(s) => {
        mutate((d) => { s.id ? (d.trainings[d.trainings.findIndex((x) => x.id === s.id)] = s) : d.trainings.push({ ...s, id: uid() }); return d; });
        setEdit(null);
      }} />}

      {open && <DetailSeance seance={open} players={players} mutate={mutate} db={db}
        onClose={() => setOpen(null)}
        onEdit={() => { setEdit(open); setOpen(null); }}
        onDelete={() => { mutate((d) => { d.trainings = d.trainings.filter((x) => x.id !== open.id); return d; }); setOpen(null); }} />}

      {blessure && <EditBlessure blessure={blessure} players={players} onClose={() => setBlessure(null)}
        onSave={(b) => { mutate((d) => { b.id ? (d.injuries[d.injuries.findIndex((x) => x.id === b.id)] = b) : d.injuries.push({ ...b, id: uid() }); return d; }); setBlessure(null); }}
        onDelete={blessure.id ? () => { mutate((d) => { d.injuries = d.injuries.filter((x) => x.id !== blessure.id); return d; }); setBlessure(null); } : null} />}

      {recap && <RecapPresences players={players} db={db} cat={cat} annee={annee} mois={mois} onClose={() => setRecap(false)} />}
    </div>
  );
}

function RecapPresences({ players, db, cat, annee, mois, onClose }) {
  const prefix = `${annee}-${pad(mois + 1)}`;
  const seancesMois = db.trainings.filter((t) => t.cat === cat && t.date && t.date.startsWith(prefix));
  const pointees = seancesMois.filter((t) => t.presence && Object.keys(t.presence).length);
  const total = pointees.length;
  const themes = [...new Set(seancesMois.map((t) => t.theme).filter(Boolean))];

  const rows = players.map((p) => {
    let pr = 0, ab = 0, bl = 0, re = 0;
    pointees.forEach((s) => {
      const st = s.presence[p.id];
      if (st === "present") pr++; else if (st === "retard") { pr++; re++; } else if (st === "absent" || st === "malade") ab++; else if (st === "blesse") bl++;
    });
    const taux = total ? Math.round((pr / total) * 100) : 0;
    return { p, pr, ab, bl, re, taux };
  }).sort((a, b) => b.taux - a.taux || b.pr - a.pr);

  return (
    <Modal title={`Récap présences · ${MOIS[mois]} ${annee}`} onClose={onClose}>
      {total === 0 ? (
        <Empty icon={<ClipboardList size={24} color={C.gris} />} text="Aucune séance pointée ce mois" sub="Pointe les présences pour voir le récap" />
      ) : (
        <>
          <div style={{ fontSize: 13, color: C.gris, marginBottom: 12 }}>
            {total} séance{total > 1 ? "s" : ""} pointée{total > 1 ? "s" : ""}. Taux = présences sur le total des séances.
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11.5, fontWeight: 700, color: C.gris, flexWrap: "wrap" }}>
            <span style={{ color: C.vert }}>● Présents</span>
            <span style={{ color: C.rouge }}>● Absents (malades inclus)</span>
            <span style={{ color: "#C67C3C" }}>● Retards</span>
            <span style={{ color: C.jauneFonce }}>● Blessés</span>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(({ p, pr, ab, bl, re, taux }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}` }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.prenom} {p.nom}</div>
                <Pastille bg="#E2F4E9" color={C.vert}>{pr}</Pastille>
                <Pastille bg="#FBE3E3" color={C.rouge}>{ab}</Pastille>
                <Pastille bg="#FBEAD9" color="#C67C3C">{re}</Pastille>
                <Pastille bg="#FFF3DA" color={C.jauneFonce}>{bl}</Pastille>
                <div style={{ width: 44, textAlign: "right", fontWeight: 900, color: C.bleu }}>{taux}%</div>
              </div>
            ))}
          </div>
          {themes.length > 0 && (
            <>
              <div style={{ fontWeight: 800, margin: "16px 0 8px" }}>Thèmes travaillés ce mois</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {themes.map((t) => <Pastille key={t} bg={C.grisClair} color={C.encre}>{t}</Pastille>)}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

function EditSeance({ seance, players, onClose, onSave }) {
  const [f, setF] = useState({ presence: {}, ...seance });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setP = (id, v) => setF((p) => ({ ...p, presence: { ...p.presence, [id]: v } }));
  const tousPresents = () => setF((o) => { const pr = { ...(o.presence || {}) }; players.forEach((p) => { if (pr[p.id] !== "blesse") pr[p.id] = "present"; }); return { ...o, presence: pr }; });
  const opts = [["present", "Présent", C.vert], ["absent", "Absent", C.rouge], ["malade", "Malade", "#8E5AA8"], ["retard", "Retard", "#C67C3C"], ["blesse", "Blessé", C.jauneFonce]];
  const themesConnus = THEMES.flatMap((g) => g.items);
  const [autreTheme, setAutreTheme] = useState(!!(seance.theme && !themesConnus.includes(seance.theme)));

  return (
    <Modal title={seance.id ? "Modifier la séance" : "Nouvelle séance"} onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>}>
      <Field label="Date"><Inp type="date" value={f.date || ""} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Thème de la séance">
        <Sel value={autreTheme ? "__autre__" : (f.theme || "")} onChange={(e) => {
          const v = e.target.value;
          if (v === "__autre__") { setAutreTheme(true); set("theme", ""); }
          else { setAutreTheme(false); set("theme", v); }
        }}>
          <option value="">Choisir un thème</option>
          {THEMES.map((g) => (
            <optgroup key={g.groupe} label={g.groupe}>
              {g.items.map((it) => <option key={it} value={it}>{it}</option>)}
            </optgroup>
          ))}
          <option value="__autre__">Autre (à préciser)</option>
        </Sel>
      </Field>
      {autreTheme && <Field label="Thème personnalisé"><Inp value={f.theme || ""} onChange={(e) => set("theme", e.target.value)} placeholder="Saisis ton thème" /></Field>}
      <Field label="Précisions (contenu, objectifs)">
        <textarea value={f.details || ""} onChange={(e) => set("details", e.target.value)} rows={3}
          placeholder="Exercices, consignes, objectifs de la séance..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0" }}>
        <span style={{ fontWeight: 800, color: C.bleu }}>Présences</span>
        {players.length > 0 && <Btn variant="ghost" size="sm" onClick={tousPresents}><Check size={15} /> Tous présents</Btn>}
      </div>
      {players.length === 0 ? <Empty icon={<Users size={22} color={C.gris} />} text="Aucun joueur" /> :
        <div style={{ display: "grid", gap: 8 }}>
          {players.map((p) => (
            <div key={p.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.grisClair}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{p.prenom} {p.nom}</div>
              <div style={{ display: "flex", gap: 5 }}>
                {opts.map(([val, lab, col]) => {
                  const on = f.presence[p.id] === val;
                  return (
                    <button key={val} onClick={() => setP(p.id, on ? null : val)} style={{
                      flex: 1, border: "none", cursor: "pointer", borderRadius: 9, padding: "7px 2px", fontSize: 11.5, fontWeight: 800,
                      background: on ? col : C.grisClair, color: on ? "#fff" : C.gris,
                    }}>{lab}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>}
    </Modal>
  );
}

function DetailSeance({ seance, players, onClose, onEdit, onDelete }) {
  const groupes = { present: [], absent: [], malade: [], retard: [], blesse: [] };
  players.forEach((p) => { const st = seance.presence?.[p.id]; if (st && groupes[st]) groupes[st].push(p); });
  const bloc = (titre, arr, col) => arr.length > 0 && (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 800, color: col, marginBottom: 6 }}>{titre} ({arr.length})</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {arr.map((p) => <Pastille key={p.id} bg={C.grisClair} color={C.encre}>{p.prenom} {p.nom}</Pastille>)}
      </div>
    </div>
  );
  return (
    <Modal title="Détail de la séance" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onEdit} full><Edit3 size={16} /> Modifier</Btn>
        <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>
      </>}>
      <div style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>{fmtDate(seance.date)}</div>
      <div style={{ fontWeight: 900, fontSize: 17, margin: "4px 0 6px" }}>{seance.theme || "Séance d'entraînement"}</div>
      {seance.details ? <div style={{ fontSize: 13.5, color: C.gris, marginBottom: 14, whiteSpace: "pre-wrap" }}>{seance.details}</div> : <div style={{ height: 8 }} />}
      {bloc("Présents", groupes.present, C.vert)}
      {bloc("Absents", groupes.absent, C.rouge)}
      {bloc("Malades", groupes.malade, "#8E5AA8")}
      {bloc("Retards", groupes.retard, "#C67C3C")}
      {bloc("Blessés", groupes.blesse, C.jauneFonce)}
    </Modal>
  );
}

const PATHOLOGIES = [
  "Entorse de la cheville",
  "Lésion des ischio-jambiers",
  "Lésion du quadriceps",
  "Lésion du mollet",
  "Lésion des adducteurs",
  "Pubalgie",
  "Tendinite rotulienne",
  "Tendinite d'Achille",
  "Entorse du genou",
  "Rupture des ligaments croisés (LCA)",
  "Lésion du ménisque",
  "Syndrome fémoro-patellaire",
  "Maladie d'Osgood-Schlatter",
  "Fracture",
  "Contusion ou choc",
  "Lombalgie",
  "Aponévrosite plantaire",
  "Autre",
];
const PATHOLOGIES_COACH = [...PATHOLOGIES.slice(0, -1), "Douleurs cervicales", "Douleurs du dos", "Autre"];
/* Mode de prise en charge medicale selon la categorie */
function priseEnChargeMedicale(cat) {
  const ci = CATEGORIES.find((c) => c.id === cat);
  if (!ci) return "parents";
  if (ci.groupe === "Féminines") return "parents";
  if (cat === "Ligue 2") return "pro";
  if (cat === "U17 NAT" || cat === "U19 NAT" || cat === "N2") return "formation";
  return "parents";
}
function texteCote(c) { return c === "droit" ? "côté droit" : c === "gauche" ? "côté gauche" : c === "deux" ? "des deux côtés" : ""; }
function texteCirconstance(c) { return c === "entrainement" ? "à l'entraînement" : c === "match" ? "en match" : c === "test" ? "lors d'un test physique" : c === "autre" ? "autre circonstance" : ""; }
function EditBlessure({ blessure, players, medical, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ fini: false, pathologie: "", cote: "", circonstance: "", kine: "", dateRetour: "", datePriseEnCharge: "", phase: "", testRetour: "", raisonNonRetour: "", priseEnCharge: (priseEnChargeMedicale(blessure.cat) === "parents" ? "parents" : "club"), ...blessure });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const sousType = priseEnChargeMedicale(f.cat);
  const interne = f.priseEnCharge === "club";
  const [msgPdf, setMsgPdf] = useState(null);
  async function exporterDossier() {
    setMsgPdf("Préparation du PDF...");
    try { const jsPDF = await chargerJsPDF(); exporterSuiviMedicalPDF(jsPDF, [f], { players }, f.cat); setMsgPdf(null); }
    catch (e) { setMsgPdf("Module d'impression indisponible. Sur le site en ligne, le document se génère normalement."); }
  }
  return (
    <Modal title={blessure.id ? "Suivi médical" : "Nouvelle blessure"} onClose={onClose}
      footer={<>
        <Btn variant="accent" full onClick={() => onSave({ ...f, fini: (f.phase === "P4" && f.testRetour === "valide") ? true : f.fini })}><Save size={16} /> Enregistrer</Btn>
        {onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}
      </>}>
      <Field label="Joueur">
        <Sel value={f.joueurId || ""} onChange={(e) => set("joueurId", e.target.value)}>
          <option value="">Choisir un joueur</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
        </Sel>
      </Field>
      <Btn variant="ghost" full disabled={!f.joueurId} onClick={exporterDossier}><FileDown size={16} /> Exporter ce dossier en PDF</Btn>
      {msgPdf && <div style={{ fontSize: 12, color: msgPdf.includes("indisponible") ? C.rouge : C.gris, margin: "6px 0 2px", textAlign: "center" }}>{msgPdf}</div>}
      <div style={{ height: 12 }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Prise en charge</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        {[["parents", "Par les parents"], ["club", "Par le club (équipe médicale)"]].map(([v, lab]) => {
          const on = f.priseEnCharge === v;
          return (
            <button key={v} onClick={() => { if (medical) return; set("priseEnCharge", v); }} disabled={medical} style={{
              flex: 1, border: "none", cursor: medical ? "not-allowed" : "pointer", borderRadius: 10, padding: "10px 6px", fontWeight: 800, fontSize: 12.5,
              background: on ? C.bleu : "#EEF2F8", color: on ? "#fff" : C.gris, opacity: (medical && !on) ? 0.55 : 1,
            }}>{lab}</button>
          );
        })}
      </div>
      {interne
        ? <div style={{ fontSize: 11.5, color: C.bleu, marginBottom: 12, fontWeight: 700 }}>{sousType === "pro" ? "Professionnels du club" : "Centre de formation"}. Ce joueur apparaît dans la rubrique Suivi médical, renseignée par l'équipe médicale.</div>
        : <div style={{ fontSize: 11.5, color: "#B87A2B", marginBottom: 12 }}>Soins gérés par les parents. Renseigne les retours ci-dessous.</div>}
      {medical && <div style={{ background: "#EAF0F7", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: C.gris, marginBottom: 12, lineHeight: 1.5 }}>Informations renseignées par le coach, non modifiables ici. Complète le suivi médical plus bas.</div>}
      {!medical && (
        <>
          <Field label="Blessure visible (optionnel)">
            <Inp value={f.signeCoach || ""} onChange={(e) => set("signeCoach", e.target.value)} placeholder="Seulement si c'est évident, par exemple entorse cheville" />
          </Field>
          <div style={{ fontSize: 11.5, color: C.gris, marginBottom: 12, lineHeight: 1.5 }}>Tu n'as pas besoin de donner la pathologie précise, c'est l'équipe médicale qui la renseignera. Indique seulement ce qui se voit, si c'est le cas.</div>
        </>
      )}
      {medical && (
        <>
          {f.signeCoach ? <div style={{ fontSize: 12.5, color: C.encre, background: "#F4F7FB", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>Signalé par le coach : {f.signeCoach}</div> : null}
          <Field label="Pathologie">
            <Sel value={f.pathologie || ""} onChange={(e) => set("pathologie", e.target.value)}>
              <option value="">Choisir une pathologie</option>
              {PATHOLOGIES.map((p) => <option key={p}>{p}</option>)}
            </Sel>
          </Field>
          {f.pathologie === "Autre" && <Field label="Préciser la pathologie"><Inp value={f.zone || ""} onChange={(e) => set("zone", e.target.value)} placeholder="Nature de la blessure" /></Field>}
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Côté touché</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["droit", "Droit"], ["gauche", "Gauche"], ["deux", "Les deux"]].map(([v, lab]) => {
              const on = f.cote === v;
              return (
                <button key={v} onClick={() => set("cote", on ? "" : v)} style={{
                  flex: 1, border: "none", cursor: "pointer", borderRadius: 10, padding: "10px 6px", fontWeight: 800, fontSize: 13,
                  background: on ? C.bleu : "#EEF2F8", color: on ? "#fff" : C.gris,
                }}>{lab}</button>
              );
            })}
          </div>
        </>
      )}
      <Field label="Survenue lors de">
        <Sel value={f.circonstance || ""} onChange={(e) => set("circonstance", e.target.value)} disabled={medical} style={medical ? { background: "#F0F1F3", color: C.gris } : undefined}>
          <option value="">Non précisé</option>
          <option value="entrainement">Un entraînement</option>
          <option value="match">Un match</option>
          <option value="test">Un test (vitesse ou VMA)</option>
          <option value="autre">Autre</option>
        </Sel>
      </Field>
      <Field label="Kiné qui suit le joueur"><Inp value={f.kine || ""} onChange={(e) => set("kine", e.target.value)} placeholder="Nom du kiné" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Date de la blessure"><Inp type="date" value={f.debut || ""} onChange={(e) => set("debut", e.target.value)} disabled={medical} style={medical ? { background: "#F0F1F3", color: C.gris } : undefined} />{medical ? <span style={{ display: "block", fontSize: 11, color: C.gris, marginTop: 3 }}>Renseignée par le coach, non modifiable ici</span> : null}</Field>
        <Field label="Date de retour prévue"><Inp type="date" value={f.dateRetour || ""} onChange={(e) => set("dateRetour", e.target.value)} /></Field>
      </div>
      {interne && (
        <>
          <Field label="Date de prise en charge par l'équipe médicale"><Inp type="date" value={f.datePriseEnCharge || ""} onChange={(e) => set("datePriseEnCharge", e.target.value)} disabled={!medical} style={!medical ? { background: "#F0F1F3", color: C.gris } : undefined} />{!medical ? <span style={{ display: "block", fontSize: 11, color: C.gris, marginTop: 3 }}>Renseignée par l'équipe médicale</span> : null}</Field>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6, marginTop: 2 }}>Évolution de la réathlétisation</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["P1", "P2", "P3", "P4"].map((ph) => {
              const on = f.phase === ph;
              return (
                <button key={ph} onClick={() => set("phase", on ? "" : ph)} style={{
                  flex: 1, border: "none", cursor: "pointer", borderRadius: 10, padding: "11px 0", fontWeight: 900, fontSize: 15,
                  background: on ? C.bleu : "#EEF2F8", color: on ? "#fff" : C.gris,
                }}>{ph}</button>
              );
            })}
          </div>
          {f.phase === "P4" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Test de retour sur le terrain</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[["valide", "Validé, retour terrain"], ["non", "Non validé"]].map(([v, lab]) => {
                  const on = f.testRetour === v;
                  return (
                    <button key={v} onClick={() => set("testRetour", on ? "" : v)} style={{
                      flex: 1, border: "none", cursor: "pointer", borderRadius: 10, padding: "11px 6px", fontWeight: 800, fontSize: 13,
                      background: on ? (v === "valide" ? C.vert : C.rouge) : "#EEF2F8", color: on ? "#fff" : C.gris,
                    }}>{lab}</button>
                  );
                })}
              </div>
              {f.testRetour === "non" && <Field label="Pourquoi le retour n'est pas validé"><textarea value={f.raisonNonRetour || ""} onChange={(e) => set("raisonNonRetour", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="Douleur persistante, test non concluant..." /></Field>}
            </>
          )}
        </>
      )}
      <Field label="Suivi / soins"><textarea value={f.suivi || ""} onChange={(e) => set("suivi", e.target.value)} rows={3} placeholder="Protocole, rééducation, reprise progressive..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} /></Field>
      <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", marginTop: 4 }}>
        <input type="checkbox" checked={!!f.fini} onChange={(e) => set("fini", e.target.checked)} style={{ width: 19, height: 19 }} />
        <span style={{ fontWeight: 700 }}>Joueur rétabli et de retour</span>
      </label>
    </Modal>
  );
}


/* ============================================================
   Detection / scouting adverse
   ============================================================ */

const CRENEAUX_DEFAUT = ["08h00", "09h00", "10h00", "11h00", "12h00", "13h00", "13h30", "14h00", "14h30", "15h30", "16h30", "17h30", "18h00", "19h00", "20h00"];

function EditCasePlanning({ typeLabel, colonne, creneau, actuel, cats, peutValider, avecActivite, onClose, onSave, onDelete, onValider }) {
  const [occupants, setOccupants] = useState(actuel && actuel.equipe ? actuel.equipe.split(" + ").map((x) => x.trim()).filter(Boolean) : []);
  const [saisie, setSaisie] = useState("");
  const [activite, setActivite] = useState((actuel && actuel.activite) || "match");
  const [fin, setFin] = useState((actuel && actuel.fin) || "");
  const ajouter = (nom) => { const n = (nom || "").trim(); if (n && !occupants.includes(n)) setOccupants([...occupants, n]); };
  const retirer = (nom) => setOccupants(occupants.filter((x) => x !== nom));
  return (
    <Modal title={`${typeLabel} ${colonne}`} onClose={onClose}
      footer={
        <>
          <Btn variant="accent" full disabled={occupants.length === 0} onClick={() => onSave(occupants.join(" + "), activite, fin)}><Save size={16} /> {peutValider ? "Attribuer" : "Demander"}</Btn>
          {actuel && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}
        </>
      }>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Créneau de {creneau}. Tu peux mettre plusieurs équipes qui se partagent ce {typeLabel.toLowerCase()}, par exemple U14 et U15, ou ajouter le district. {peutValider ? "En tant que responsable, ton attribution est directement validée." : "Ta demande sera à valider par la direction."}</div>

      {actuel && (
        <div style={{ background: actuel.statut === "valide" ? "#E2F4E9" : "#FBEAD9", borderRadius: 11, padding: 11, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{actuel.equipe}</div>
          <div style={{ fontSize: 12.5, color: C.gris, marginTop: 2 }}>{actuel.statut === "valide" ? "Créneau validé" : "En attente de validation"}{actuel.demandeur ? ` · demandé par ${actuel.demandeur}` : ""}</div>
          {peutValider && actuel.statut !== "valide" && (
            <Btn variant="accent" size="sm" style={{ marginTop: 9 }} onClick={onValider}><Check size={15} /> Valider ce créneau</Btn>
          )}
        </div>
      )}

      {avecActivite && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["match", "Match"], ["entrainement", "Entraînement"]].map(([v, lab]) => (
              <button key={v} onClick={() => setActivite(v)} style={{
                flex: 1, border: "none", cursor: "pointer", borderRadius: 10, padding: "9px 0", fontWeight: 800, fontSize: 13.5,
                background: activite === v ? C.bleu : "#EEF2F8", color: activite === v ? "#fff" : C.gris,
              }}>{lab}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Durée du créneau</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.bleu, whiteSpace: "nowrap" }}>De {creneau} à</span>
          <div style={{ flex: 1 }}><Inp type="time" value={fin ? fin.replace("h", ":") : ""} onChange={(e) => setFin(e.target.value ? e.target.value.replace(":", "h") : "")} /></div>
        </div>
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: 5, lineHeight: 1.4 }}>Laisse vide pour n'occuper que ce créneau. Sinon, tous les créneaux jusqu'à l'heure de fin sont réservés d'un coup.</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Équipes sur ce créneau</div>
      {occupants.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          {occupants.map((o) => (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E2F4E9", border: "1px solid #BFE3CD", borderRadius: 999, padding: "6px 11px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.encre }}>{o}</span>
              <X size={14} color={C.gris} style={{ cursor: "pointer" }} onClick={() => retirer(o)} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Aucune équipe pour l'instant. Ajoute une équipe du club ci-dessous, ou saisis un nom.</div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}><Inp value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="District, équipe adverse..." /></div>
        <Btn variant="accent" disabled={!saisie.trim()} onClick={() => { ajouter(saisie); setSaisie(""); }}><Plus size={16} /> Ajouter</Btn>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 8 }}>Raccourcis équipes du club</div>
      {GROUPES.map((g) => {
        const catsG = cats.filter((cat) => { const ci = CATEGORIES.find((x) => x.id === cat); return ci && ci.groupe === g; });
        if (catsG.length === 0) return null;
        return (
          <div key={g} style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {catsG.map((cat) => {
                const dejaLa = occupants.includes(cat);
                return (
                  <button key={cat} onClick={() => ajouter(cat)} disabled={dejaLa} style={{
                    border: `1px solid ${C.grisClair}`, cursor: dejaLa ? "default" : "pointer", borderRadius: 999, padding: "6px 12px",
                    fontSize: 12.5, fontWeight: 700, background: dejaLa ? "#E2F4E9" : "#fff", color: dejaLa ? C.vert : C.bleu, opacity: dejaLa ? 0.7 : 1,
                  }}>{dejaLa ? "✓ " : ""}{cat}</button>
                );
              })}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

function exporterPlanningSemainePDF(jsPDF, sem, occ, label, cat, typeLabel, codeCouleur) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = 842, H = 595, M = 28;
  const navy = [14, 30, 51], bleu = [26, 53, 83], orr = [198, 162, 76], encre = [22, 32, 46], gris = [122, 130, 142], trait = [210, 215, 222], blanc = [255, 255, 255];
  const vert = [47, 109, 67], org = [184, 122, 43];
  const sc = (a) => doc.setTextColor(a[0], a[1], a[2]);
  const sf = (a) => doc.setFillColor(a[0], a[1], a[2]);
  const sd = (a) => doc.setDrawColor(a[0], a[1], a[2]);
  const coul = codeCouleur === "o" ? org : vert;
  sf(navy); doc.rect(0, 0, W, 4, "F");
  sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("FC SOCHAUX-MONTBÉLIARD", M, 28);
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(typeLabel + " - Semaine du " + label + "  -  " + cat, M, 42);
  sd(orr); doc.setLineWidth(1); doc.line(M, 48, W - M, 48); doc.setLineWidth(0.5);
  const labW = 100, colW = (W - 2 * M - labW) / 7, x0 = M;
  let y = 62;
  sf(bleu); doc.rect(x0, y, labW, 20, "F"); sc(blanc); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text(typeLabel, x0 + 4, y + 13);
  sem.forEach((j, i) => { const x = x0 + labW + i * colW; sf(bleu); doc.rect(x, y, colW, 20, "F"); doc.text(j.court, x + 4, y + 13); });
  y += 20;
  if (!occ.length) { sc(gris); doc.setFont("helvetica", "italic"); doc.setFontSize(9.5); doc.text("Aucune réservation pour cette semaine.", x0 + 4, y + 16); }
  occ.forEach((row) => {
    doc.setFontSize(7.5);
    const wrapped = row.cells.map((cell) => { const arr = []; cell.forEach((t) => { const w = doc.splitTextToSize(t, colW - 8); w.forEach((ln) => arr.push(ln)); }); return arr; });
    const maxL = Math.max(1, ...wrapped.map((a) => a.length));
    const rowH = Math.max(22, maxL * 8 + 8);
    if (y + rowH > H - 30) { doc.addPage(); y = 40; }
    sf(blanc); sd(trait); doc.rect(x0, y, labW, rowH); sc(encre); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    const lw = doc.splitTextToSize(row.nom, labW - 8); lw.forEach((ln, k) => doc.text(ln, x0 + 4, y + 11 + k * 9));
    sem.forEach((j, i) => {
      const x = x0 + labW + i * colW; doc.rect(x, y, colW, rowH);
      let yy = y + 10; const arr = wrapped[i];
      if (!arr.length) { sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("-", x + 4, yy); }
      else arr.forEach((ln) => { sc(coul); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(ln, x + 4, yy); yy += 8; });
    });
    y += rowH;
  });
  y += 16;
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text("Édité le " + new Date().toLocaleDateString("fr-FR"), M, H - 14);
  doc.save("Planning_" + typeLabel.toLowerCase() + "_semaine_" + label.replace(/[^0-9A-Za-z]/g, "_") + ".pdf");
}

function PlanningSemaine({ db, cat, type, onClose }) {
  const [offset, setOffset] = useState(0);
  const [msg, setMsg] = useState(null);
  const typeLabel = type === "vestiaires" ? "Vestiaires" : "Terrains";
  const liste = type === "vestiaires" ? VESTIAIRES : TERRAINS;
  const couleur = type === "vestiaires" ? "#B87A2B" : C.vert;
  const codeCouleur = type === "vestiaires" ? "o" : "v";
  const { jours, label } = useMemo(() => {
    const d = new Date(); const isodow = (d.getDay() + 6) % 7;
    const lu = new Date(d); lu.setDate(d.getDate() - isodow + offset * 7);
    const arr = [];
    for (let i = 0; i < 7; i++) { const x = new Date(lu); x.setDate(lu.getDate() + i); arr.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`); }
    return { jours: arr, label: `${jjmm(arr[0])} au ${jjmm(arr[6])}` };
  }, [offset]);
  function occupation() {
    return liste.map((nom) => {
      const cells = jours.map((dstr) => {
        const parDate = (db.planning && db.planning[type]) || {};
        const cases = parDate[dstr] || {};
        return Object.keys(cases).filter((k) => k.slice(k.indexOf("__") + 2) === nom).map((k) => { const cr = k.slice(0, k.indexOf("__")); const c = cases[k]; return `${cr} · ${c.equipe}${c.statut === "valide" ? "" : " · à valider"}`; }).sort();
      });
      return { nom: type === "vestiaires" ? "Vestiaire " + nom : nom, cells, used: cells.some((c) => c.length) };
    }).filter((o) => o.used);
  }
  async function telecharger() {
    setMsg("Préparation du PDF...");
    try {
      const jsPDF = await chargerJsPDF();
      const sem = jours.map((dstr) => ({ court: new Date(dstr + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" }) + " " + jjmm(dstr) }));
      exporterPlanningSemainePDF(jsPDF, sem, occupation(), label, cat, typeLabel, codeCouleur);
      setMsg(null);
    } catch (e) { setMsg("Module d'impression indisponible. Sur le site en ligne, le document se génère normalement."); }
  }
  const occ = occupation();
  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 70, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{typeLabel} · semaine · {cat}</div>
      </header>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.grisClair}`, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Btn variant="ghost" size="sm" onClick={() => setOffset(offset - 1)}><ChevronLeft size={15} /> Précédent</Btn>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.encre }}>{label}</span>
          <Btn variant="ghost" size="sm" onClick={() => setOffset(offset + 1)}>Suivant <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} /></Btn>
        </div>
        <Btn variant="accent" full onClick={telecharger}><FileDown size={16} /> Imprimer la semaine (PDF)</Btn>
        {msg && <div style={{ fontSize: 12.5, color: C.encre, background: C.fond, borderRadius: 10, padding: 10 }}>{msg}</div>}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Occupation des {typeLabel.toLowerCase()} de la catégorie {cat} pour la semaine. Fais défiler sur le côté ou tourne l'écran en paysage pour tout voir.</div>
        {occ.length ? (
          <div style={{ overflowX: "auto", border: `1px solid ${C.grisClair}`, borderRadius: 12, background: "#fff", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 120 + 7 * 128 }}>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: C.bleu, color: "#fff", fontSize: 11, fontWeight: 800, padding: "8px", textAlign: "left", minWidth: 120, zIndex: 1 }}>{typeLabel}</th>
                  {jours.map((dstr) => (
                    <th key={dstr} style={{ background: C.bleu, color: "#fff", fontSize: 10.5, fontWeight: 800, padding: "8px 6px", minWidth: 128, borderLeft: "1px solid rgba(255,255,255,0.15)", textTransform: "capitalize", lineHeight: 1.3 }}>
                      {new Date(dstr + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long" })}<br />{jjmm(dstr)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {occ.map((o, ri) => (
                  <tr key={o.nom} style={{ background: ri % 2 ? "#F7F9FC" : "#fff" }}>
                    <td style={{ position: "sticky", left: 0, background: ri % 2 ? "#EEF2F8" : "#fff", fontSize: 12, fontWeight: 800, color: C.encre, padding: "8px", borderTop: `1px solid ${C.grisClair}`, verticalAlign: "top", zIndex: 1 }}>{o.nom}</td>
                    {o.cells.map((cell, i) => (
                      <td key={i} style={{ borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, padding: 6, verticalAlign: "top", minWidth: 128 }}>
                        {cell.length ? cell.map((t, k) => <div key={k} style={{ fontSize: 10.5, color: couleur, fontWeight: 600, padding: "3px 0", lineHeight: 1.3, borderBottom: `1px solid ${C.fond}` }}>{t}</div>) : <span style={{ fontSize: 11, color: C.gris }}>-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.gris, background: "#fff", border: `1px solid ${C.grisClair}`, borderRadius: 12, padding: 16 }}>Aucune réservation de {typeLabel.toLowerCase()} pour cette semaine.</div>
        )}
      </div>
    </div>
  );
}

function Planning({ db, mutate, cats, profil, peutValider, cat, onClose }) {
  const [type, setType] = useState("vestiaires");
  const d0 = new Date();
  const [date, setDate] = useState(`${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`);
  const [edit, setEdit] = useState(null);
  const [gererCreneaux, setGererCreneaux] = useState(false);
  const [showSemaine, setShowSemaine] = useState(false);
  const [nvCreneau, setNvCreneau] = useState("");
  const [editCreneau, setEditCreneau] = useState(null);
  const [nvHeure, setNvHeure] = useState("");
  const [vue, setVue] = useState("jour");
  const [colSem, setColSem] = useState(null);
  const [semOffset, setSemOffset] = useState(0);

  const colonnes = type === "vestiaires" ? VESTIAIRES : TERRAINS;
  const typeLabel = type === "vestiaires" ? "Vestiaire" : "Terrain";
  const creneaux = (db.planning && db.planning.creneaux) || CRENEAUX_DEFAUT;
  const data = (db.planning && db.planning[type] && db.planning[type][date]) || {};
  const cle = (cr, col) => `${cr}__${col}`;
  const moi = (profil && profil.nom) || "Éducateur";
  const colSemActif = colonnes.includes(colSem) ? colSem : colonnes[0];
  const joursSem = useMemo(() => {
    const base = new Date(date + "T00:00:00");
    const isodow = (base.getDay() + 6) % 7;
    const lu = new Date(base); lu.setDate(base.getDate() - isodow + semOffset * 7);
    const arr = [];
    for (let i = 0; i < 7; i++) { const x = new Date(lu); x.setDate(lu.getDate() + i); arr.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`); }
    return arr;
  }, [date, semOffset]);
  const labelSem = joursSem.length ? `${jjmm(joursSem[0])} au ${jjmm(joursSem[6])}` : "";

  function ecrire(cr, col, valeur, dateCible) {
    const dt = dateCible || date;
    mutate((d) => {
      d.planning = d.planning || { creneaux: CRENEAUX_DEFAUT, vestiaires: {}, terrains: {} };
      d.planning[type] = d.planning[type] || {};
      d.planning[type][dt] = d.planning[type][dt] || {};
      if (valeur === null) delete d.planning[type][dt][cle(cr, col)];
      else d.planning[type][dt][cle(cr, col)] = valeur;
      return d;
    });
  }
  function ecrirePlage(crDebut, col, valeur, fin, dateCible) {
    const dt = dateCible || date;
    const mins = (s) => { if (!s) return 0; const p = String(s).replace("h", ":").split(":"); return (+p[0]) * 60 + (+(p[1] || 0)); };
    const debM = mins(crDebut);
    const finM = mins(fin);
    const crs = (fin && finM > debM) ? creneaux.filter((cr) => mins(cr) >= debM && mins(cr) < finM) : [crDebut];
    const liste = crs.length ? crs : [crDebut];
    mutate((d) => {
      d.planning = d.planning || { creneaux: CRENEAUX_DEFAUT, vestiaires: {}, terrains: {} };
      d.planning[type] = d.planning[type] || {};
      d.planning[type][dt] = d.planning[type][dt] || {};
      liste.forEach((cr) => {
        if (valeur === null) delete d.planning[type][dt][cle(cr, col)];
        else d.planning[type][dt][cle(cr, col)] = { ...valeur, debut: crDebut, fin: fin || undefined };
      });
      return d;
    });
  }
  function ajouterCreneau(t) {
    if (!t) return;
    const cr = t.replace(":", "h");
    mutate((d) => {
      d.planning = d.planning || { creneaux: CRENEAUX_DEFAUT.slice(), vestiaires: {}, terrains: {} };
      const liste = (d.planning.creneaux || CRENEAUX_DEFAUT).slice();
      if (!liste.includes(cr)) { liste.push(cr); liste.sort(); }
      d.planning.creneaux = liste;
      return d;
    });
  }
  function supprimerCreneau(cr) {
    mutate((d) => {
      d.planning = d.planning || {};
      d.planning.creneaux = ((d.planning.creneaux || CRENEAUX_DEFAUT)).filter((x) => x !== cr);
      return d;
    });
  }
  function modifierCreneau(ancien, t) {
    if (!t) return;
    const nv = t.replace(":", "h");
    if (nv === ancien) return;
    mutate((d) => {
      d.planning = d.planning || { creneaux: CRENEAUX_DEFAUT.slice(), vestiaires: {}, terrains: {} };
      let liste = (d.planning.creneaux || CRENEAUX_DEFAUT).slice().map((x) => (x === ancien ? nv : x));
      liste = [...new Set(liste)].sort();
      d.planning.creneaux = liste;
      ["vestiaires", "terrains"].forEach((tp) => {
        const parDate = d.planning[tp] || {};
        Object.keys(parDate).forEach((dt) => {
          const cases = parDate[dt];
          Object.keys(cases).forEach((k) => {
            const idx = k.indexOf("__");
            const cr = k.slice(0, idx), col = k.slice(idx + 2);
            if (cr === ancien) { cases[`${nv}__${col}`] = cases[k]; delete cases[k]; }
          });
        });
      });
      return d;
    });
  }

  const couleur = (c) => {
    if (!c) return { bg: "#fff", fg: C.gris, bd: C.grisClair };
    if (c.statut === "valide") return { bg: "#E2F4E9", fg: C.vert, bd: "#BFE3CD" };
    return { bg: "#FBEAD9", fg: "#B87A2B", bd: "#EBD3AE" };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Planning des {type === "vestiaires" ? "vestiaires" : "terrains"}</div>
      </header>

      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, borderBottom: `1px solid ${C.grisClair}`, background: "#fff" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[["vestiaires", "Vestiaires"], ["terrains", "Terrains"]].map(([v, lab]) => (
            <button key={v} onClick={() => setType(v)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "10px 0", fontWeight: 800, fontSize: 14,
              background: type === v ? C.bleu : "#EEF2F8", color: type === v ? "#fff" : C.gris,
            }}>{lab}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["jour", "Jour"], ["semaine", "Semaine"]].map(([v, lab]) => (
            <button key={v} onClick={() => setVue(v)} style={{ flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "9px 0", fontWeight: 800, fontSize: 13.5, background: vue === v ? C.jaune : "#EEF2F8", color: vue === v ? C.bleuNuit : C.gris }}>{lab}</button>
          ))}
        </div>
        {vue === "jour" ? (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}><Inp type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <Btn variant="ghost" onClick={() => setGererCreneaux(true)}><Timer size={16} /> Créneaux</Btn>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.bleu, textTransform: "capitalize" }}>{jourLong(date)}</div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Btn variant="ghost" size="sm" onClick={() => setSemOffset(semOffset - 1)}><ChevronLeft size={15} /> Précédent</Btn>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.encre }}>{labelSem}</span>
              <Btn variant="ghost" size="sm" onClick={() => setSemOffset(semOffset + 1)}>Suivant <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} /></Btn>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 5 }}>{typeLabel} à réserver</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {colonnes.map((col) => (
                  <button key={col} onClick={() => setColSem(col)} style={{ border: "none", cursor: "pointer", borderRadius: 9, padding: "7px 11px", fontWeight: 800, fontSize: 12.5, background: colSemActif === col ? C.bleu : "#EEF2F8", color: colSemActif === col ? "#fff" : C.gris }}>{col}</button>
                ))}
              </div>
            </div>
            <Btn variant="ghost" onClick={() => setGererCreneaux(true)}><Timer size={16} /> Créneaux</Btn>
          </>
        )}
        <Btn variant="primary" size="sm" onClick={() => setShowSemaine(true)}><CalendarDays size={16} /> Vue d'ensemble à imprimer (PDF)</Btn>
        <div style={{ display: "flex", gap: 14, fontSize: 11.5, fontWeight: 700, color: C.gris }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#E2F4E9", border: "1px solid #BFE3CD", display: "inline-block" }} /> Validé</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#FBEAD9", border: "1px solid #EBD3AE", display: "inline-block" }} /> En attente</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#fff", border: `1px solid ${C.grisClair}`, display: "inline-block" }} /> Libre</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        <div style={{ overflowX: "auto", border: `1px solid ${C.grisClair}`, borderRadius: 12, background: "#fff" }}>
          {vue === "jour" ? (
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 130 + colonnes.length * 96 }}>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: C.bleu, color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 8px", textAlign: "left", minWidth: 66, zIndex: 1 }}>Horaire</th>
                  {colonnes.map((col) => (
                    <th key={col} style={{ background: C.bleu, color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 8px", minWidth: 96, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{typeLabel} {col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creneaux.map((cr, ri) => (
                  <tr key={cr} style={{ background: ri % 2 ? "#F7F9FC" : "#fff" }}>
                    <td onClick={() => { setEditCreneau(cr); setNvHeure(cr.replace("h", ":")); }} style={{ position: "sticky", left: 0, background: ri % 2 ? "#EEF2F8" : "#fff", fontWeight: 800, fontSize: 12.5, padding: "10px 8px", borderTop: `1px solid ${C.grisClair}`, zIndex: 1, cursor: "pointer", color: C.bleu }}>{cr}</td>
                    {colonnes.map((col) => {
                      const c = data[cle(cr, col)];
                      const co = couleur(c);
                      return (
                        <td key={col} onClick={() => setEdit({ cr, col })} style={{ padding: 5, borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, cursor: "pointer", verticalAlign: "middle" }}>
                          <div style={{ background: co.bg, border: `1px solid ${co.bd}`, borderRadius: 8, minHeight: 34, padding: "5px 7px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: c ? C.encre : C.grisClair, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c ? c.equipe : "+"}</span>
                            {c && c.activite && <span style={{ fontSize: 9, fontWeight: 700, color: c.activite === "match" ? C.bleu : "#7A8290" }}>{c.activite === "match" ? "Match" : "Entraînement"}</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 66 + 7 * 104 }}>
              <thead>
                <tr>
                  <th style={{ position: "sticky", left: 0, background: C.bleu, color: "#fff", fontSize: 12, fontWeight: 800, padding: "10px 8px", textAlign: "left", minWidth: 66, zIndex: 1 }}>Horaire</th>
                  {joursSem.map((dstr) => (
                    <th key={dstr} style={{ background: C.bleu, color: "#fff", fontSize: 11, fontWeight: 800, padding: "8px 6px", minWidth: 104, borderLeft: "1px solid rgba(255,255,255,0.15)", textTransform: "capitalize", lineHeight: 1.3 }}>{new Date(dstr + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}<br />{jjmm(dstr)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creneaux.map((cr, ri) => (
                  <tr key={cr} style={{ background: ri % 2 ? "#F7F9FC" : "#fff" }}>
                    <td onClick={() => { setEditCreneau(cr); setNvHeure(cr.replace("h", ":")); }} style={{ position: "sticky", left: 0, background: ri % 2 ? "#EEF2F8" : "#fff", fontWeight: 800, fontSize: 12.5, padding: "10px 8px", borderTop: `1px solid ${C.grisClair}`, zIndex: 1, cursor: "pointer", color: C.bleu }}>{cr}</td>
                    {joursSem.map((dstr) => {
                      const casesJ = (db.planning && db.planning[type] && db.planning[type][dstr]) || {};
                      const c = casesJ[cle(cr, colSemActif)];
                      const co = couleur(c);
                      return (
                        <td key={dstr} onClick={() => setEdit({ cr, col: colSemActif, dateJour: dstr })} style={{ padding: 5, borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, cursor: "pointer", verticalAlign: "middle" }}>
                          <div style={{ background: co.bg, border: `1px solid ${co.bd}`, borderRadius: 8, minHeight: 34, padding: "5px 7px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: c ? C.encre : C.grisClair, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c ? c.equipe : "+"}</span>
                            {c && c.activite && <span style={{ fontSize: 9, fontWeight: 700, color: c.activite === "match" ? C.bleu : "#7A8290" }}>{c.activite === "match" ? "Match" : "Entraînement"}</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: 10, lineHeight: 1.5 }}>{vue === "jour" ? `Touche une case pour réserver un ${typeLabel.toLowerCase()}. Fais défiler le tableau sur le côté pour voir toutes les colonnes.` : `Semaine du ${typeLabel.toLowerCase()} « ${colSemActif} ». Touche une case pour le réserver ce jour à cette heure. Change de ${typeLabel.toLowerCase()} au-dessus pour gérer les autres.`}</div>
      </div>

      {edit && (() => {
        const dt = edit.dateJour || date;
        const casesDt = (db.planning && db.planning[type] && db.planning[type][dt]) || {};
        const actuel = casesDt[cle(edit.cr, edit.col)];
        return (
          <EditCasePlanning
            typeLabel={typeLabel} colonne={edit.col} creneau={edit.cr} actuel={actuel} cats={cats} peutValider={peutValider} avecActivite={type === "terrains"}
            onClose={() => setEdit(null)}
            onSave={(equipe, activite, fin) => { ecrirePlage(edit.cr, edit.col, { equipe, activite: type === "terrains" ? activite : undefined, statut: peutValider ? "valide" : "attente", demandeur: moi }, fin, edit.dateJour); setEdit(null); }}
            onValider={() => { const deb = (actuel && actuel.debut) || edit.cr; ecrirePlage(deb, edit.col, { ...actuel, statut: "valide" }, actuel && actuel.fin, edit.dateJour); setEdit(null); }}
            onDelete={() => { const deb = (actuel && actuel.debut) || edit.cr; ecrirePlage(deb, edit.col, null, actuel && actuel.fin, edit.dateJour); setEdit(null); }}
          />
        );
      })()}

      {showSemaine && <PlanningSemaine db={db} cat={cat} type={type} onClose={() => setShowSemaine(false)} />}
      {gererCreneaux && (
        <Modal title="Gérer les créneaux" onClose={() => setGererCreneaux(false)}>
          <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Ajoute les horaires dont tu as besoin, par exemple 17h15 ou 17h45. Ils s'appliquent aux plannings terrains et vestiaires.</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1 }}><Inp type="time" value={nvCreneau} onChange={(e) => setNvCreneau(e.target.value)} /></div>
            <Btn variant="accent" disabled={!nvCreneau} onClick={() => { ajouterCreneau(nvCreneau); setNvCreneau(""); }}><Plus size={16} /> Ajouter</Btn>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {creneaux.map((cr) => (
              <div key={cr} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${C.grisClair}`, borderRadius: 999, padding: "6px 11px" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{cr}</span>
                <X size={14} color={C.gris} style={{ cursor: "pointer" }} onClick={() => supprimerCreneau(cr)} />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {editCreneau && (
        <Modal title="Modifier le créneau" onClose={() => setEditCreneau(null)}
          footer={<><Btn variant="accent" full onClick={() => { modifierCreneau(editCreneau, nvHeure); setEditCreneau(null); }}><Save size={16} /> Enregistrer</Btn><Btn variant="danger" onClick={() => { supprimerCreneau(editCreneau); setEditCreneau(null); }}><Trash2 size={16} /></Btn></>}>
          <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Ajuste l'heure de ce créneau. Les réservations déjà posées suivront le nouvel horaire.</div>
          <Field label="Heure du créneau"><Inp type="time" value={nvHeure} onChange={(e) => setNvHeure(e.target.value)} /></Field>
        </Modal>
      )}
    </div>
  );
}


const FONCTIONS = ["Éducateur", "Dirigeant", "Responsable", "Manager général", "Directeur du centre"];
const ORDRE_FONCTIONS = ["Directeur du centre", "Manager général", "Responsable", "Dirigeant", "Éducateur"];
function EditAcces({ educateur, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ nom: "", email: "", role: "educateur", fonction: "Éducateur", categories: [], ...educateur });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const sel = f.categories || [];
  const toggleCat = (id) => set("categories", sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const toggleSecteur = (catsG, toutes) => set("categories", toutes ? sel.filter((x) => !catsG.includes(x)) : [...new Set([...sel, ...catsG])]);

  return (
    <Modal title={educateur.id ? "Modifier l'accès" : "Nouvel éducateur"} onClose={onClose}
      footer={<><Btn variant="accent" full disabled={!f.nom.trim()} onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>{educateur.id && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}</>}>
      <Field label="Nom et prénom"><Inp value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Nom et prénom" /></Field>
      <Field label="Adresse email"><Inp type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="prenom.nom@club.fr" /></Field>
      <Field label="Fonction dans le club">
        <Sel value={f.fonction || "Éducateur"} onChange={(e) => set("fonction", e.target.value)}>
          {FONCTIONS.map((fn) => <option key={fn}>{fn}</option>)}
        </Sel>
      </Field>
      <Field label="Rôle">
        <div style={{ display: "flex", gap: 8 }}>
          {[["educateur", "Éducateur"], ["admin", "Administrateur"]].map(([v, lab]) => (
            <button key={v} onClick={() => set("role", v)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: 10, padding: "10px 0", fontWeight: 800, fontSize: 13.5,
              background: f.role === v ? C.bleu : "#EEF2F8", color: f.role === v ? "#fff" : C.gris,
            }}>{lab}</button>
          ))}
        </div>
      </Field>

      {f.role === "admin" ? (
        <div style={{ background: "#EEF2F8", borderRadius: 11, padding: 12, fontSize: 13, color: C.encre }}>L'administrateur a accès à tous les secteurs et gère les droits des autres.</div>
      ) : (
        <>
          <div style={{ fontWeight: 800, color: C.bleu, margin: "6px 0 8px" }}>Secteurs et catégories autorisés</div>
          {GROUPES.map((g) => {
            const catsG = CATEGORIES.filter((c) => c.groupe === g).map((c) => c.id);
            if (catsG.length === 0) return null;
            const toutes = catsG.every((c) => sel.includes(c));
            return (
              <div key={g} style={{ marginBottom: 12, border: `1px solid ${C.grisClair}`, borderRadius: 12, padding: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.encre, textTransform: "uppercase", letterSpacing: 0.4 }}>{g}</span>
                  <button onClick={() => toggleSecteur(catsG, toutes)} style={{ border: "none", cursor: "pointer", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 800, background: toutes ? C.bleu : "#EEF2F8", color: toutes ? "#fff" : C.bleu }}>{toutes ? "Tout retirer" : "Tout le secteur"}</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {catsG.map((id) => {
                    const on = sel.includes(id);
                    return (
                      <button key={id} onClick={() => toggleCat(id)} style={{
                        border: `1px solid ${on ? C.bleu : C.grisClair}`, cursor: "pointer", borderRadius: 999, padding: "6px 12px",
                        fontSize: 12.5, fontWeight: 700, background: on ? C.bleu : "#fff", color: on ? "#fff" : C.gris,
                      }}>{id}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </Modal>
  );
}

function AccesSecteurs({ db, mutate, estAdmin, onClose }) {
  const [edit, setEdit] = useState(null);
  const liste = db.acces || [];

  if (!estAdmin) {
    return (
      <PleinEcran>
        <div style={{ maxWidth: 340 }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Accès réservé</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, lineHeight: 1.5 }}>Cette page est réservée à l'administrateur du club.</div>
          <Btn variant="accent" onClick={onClose} style={{ marginTop: 16 }}>Retour</Btn>
        </div>
      </PleinEcran>
    );
  }

  function enregistrer(e) {
    mutate((d) => {
      d.acces = d.acces || [];
      if (e.id) { const i = d.acces.findIndex((x) => x.id === e.id); d.acces[i] = e; }
      else d.acces.push({ ...e, id: uid() });
      return d;
    });
    setEdit(null);
  }
  function supprimer(id) {
    mutate((d) => { d.acces = (d.acces || []).filter((x) => x.id !== id); return d; });
    setEdit(null);
  }
  const resumeAcces = (e) => {
    if (e.role === "admin") return "Accès à tout le club";
    const secteurs = GROUPES.filter((g) => {
      const catsG = CATEGORIES.filter((c) => c.groupe === g).map((c) => c.id);
      return catsG.length && catsG.every((c) => (e.categories || []).includes(c));
    });
    if (secteurs.length) return "Secteurs : " + secteurs.join(", ");
    if ((e.categories || []).length) return (e.categories || []).join(", ");
    return "Aucun accès";
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Droits d'accès</div>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 14 }}>Attribue à chaque éducateur les secteurs auxquels il a accès. Un administrateur voit tout le club et peut gérer ces droits.</div>
        <Btn variant="accent" full style={{ marginBottom: 16 }} onClick={() => setEdit({ role: "educateur", categories: [] })}><Plus size={16} /> Ajouter un éducateur</Btn>

        {liste.length === 0 ? (
          <Empty icon={<Users size={24} color={C.gris} />} text="Aucun éducateur enregistré" sub="Ajoute les éducateurs et définis leurs accès" />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {liste.map((e) => (
              <Card key={e.id} onClick={() => setEdit(e)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{e.nom}</strong>
                  <Pastille bg={e.role === "admin" ? C.jaune : C.grisClair} color={e.role === "admin" ? C.bleuNuit : C.gris}>{e.role === "admin" ? "Administrateur" : "Éducateur"}</Pastille>
                </div>
                {e.email ? <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 4 }}>{e.email}</div> : null}
                <div style={{ fontSize: 13, color: C.encre }}>{resumeAcces(e)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {edit && <EditAcces educateur={edit} onClose={() => setEdit(null)} onSave={enregistrer} onDelete={edit.id ? () => supprimer(edit.id) : null} />}
    </div>
  );
}


function exporterProgrammePDF(jsPDF, matchs, label) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = 842, H = 595, M = 28;
  const navy = [14, 30, 51], bleu = [26, 53, 83], orr = [198, 162, 76], encre = [22, 32, 46], gris = [122, 130, 142], trait = [228, 232, 238], fond = [244, 246, 248];
  const sc = (a) => doc.setTextColor(a[0], a[1], a[2]);
  const sf = (a) => doc.setFillColor(a[0], a[1], a[2]);
  const sd = (a) => doc.setDrawColor(a[0], a[1], a[2]);

  sf(navy); doc.rect(0, 0, W, 4, "F");
  sc(bleu); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("FC SOCHAUX-MONTBÉLIARD", M, 30);
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.text(`Programme de la semaine du ${label}`, M, 44);
  sd(orr); doc.setLineWidth(1); doc.line(M, 52, W - M, 52); doc.setLineWidth(0.5);

  const cols = [
    ["Équipe", 58], ["Date", 74], ["Adversaire", 118], ["Terrain", 104], ["Heure", 38],
    ["Rendez-vous", 106], ["Dirigeants", 92], ["Intendance", 98], ["Transport", 98],
  ];
  const total = cols.reduce((s, c) => s + c[1], 0);
  const scale = (W - 2 * M) / total;
  const larg = cols.map((c) => c[1] * scale);

  let y = 64;
  const enTete = () => {
    sf(bleu); doc.rect(M, y, W - 2 * M, 20, "F");
    sc([255, 255, 255]); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
    let x = M;
    cols.forEach((c, i) => { doc.text(c[0], x + 5, y + 13); x += larg[i]; });
    y += 20;
  };
  enTete();

  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  matchs.forEach((row, ri) => {
    const cells = row.map((val, i) => doc.splitTextToSize(String(val || ""), larg[i] - 8));
    const hLignes = Math.max(1, ...cells.map((l) => l.length));
    const rowH = hLignes * 10 + 6;
    if (y + rowH > H - 24) { doc.addPage(); y = 34; enTete(); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); }
    sf(ri % 2 ? fond : [255, 255, 255]); doc.rect(M, y, W - 2 * M, rowH, "F");
    sd(trait); doc.rect(M, y, W - 2 * M, rowH, "S");
    let x = M;
    cells.forEach((lignes, i) => {
      sc(i === 0 ? bleu : encre);
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      lignes.forEach((l, li) => doc.text(l, x + 5, y + 12 + li * 10));
      x += larg[i];
    });
    y += rowH;
  });

  sd(orr); doc.setLineWidth(0.8); doc.line(M, H - 20, W - M, H - 20); doc.setLineWidth(0.5);
  sc(gris); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")}`, M, H - 10);
  doc.text("FC SOCHAUX-MONTBÉLIARD", W - M, H - 10, { align: "right" });

  doc.save(`Programme_semaine_${label.replace(/[^0-9A-Za-z]/g, "_")}.pdf`);
}

function ProgrammeSemaine({ db, onClose }) {
  const [offset, setOffset] = useState(0);
  const [msg, setMsg] = useState(null);

  const { lundi, dim, label } = useMemo(() => {
    const d = new Date();
    const isodow = (d.getDay() + 6) % 7;
    const lu = new Date(d); lu.setDate(d.getDate() - isodow + offset * 7);
    const di = new Date(lu); di.setDate(lu.getDate() + 6);
    const f = (x) => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
    return { lundi: f(lu), dim: f(di), label: `${jjmm(f(lu))} au ${jjmm(f(di))}` };
  }, [offset]);

  const ordreSecteur = { "PRO": 0, "Formation": 1, "Pré-formation": 2, "École de foot": 3, "Loisirs": 4, "Féminines": 5, "Foot santé": 6 };
  const secteurDe = (cat) => { const ci = CATEGORIES.find((x) => x.id === cat); return ci ? ci.groupe : ""; };
  const rangSecteur = (cat) => { const r = ordreSecteur[secteurDe(cat)]; return r == null ? 9 : r; };
  const ageDe = (cat) => { const m = /U(\d+)/.exec(cat || ""); if (m) return +m[1]; if (["PRO", "N2", "Ligue 2"].includes(cat) || (cat || "").includes("SENIORS")) return 99; return 50; };
  const lieuDe = (m) => m.lieuMatch || (m.lieu === "Domicile" ? ((m.reservation && m.reservation.terrain) || "Domicile") : "Extérieur");
  const rdvDe = (m) => [m.rdv, m.lieuRdv].filter(Boolean).join(" ");
  const dirDe = (m) => { const e = m.encadrement || {}; return [e.dirigeant, e.delegue].filter(Boolean).join(", "); };
  const transDe = (m) => { const t = m.transport || {}; if (!t.mode) return ""; if (t.mode === "Minibus club" && t.minibus && t.minibus.length) return `Minibus ${t.minibus.join("/")}`; if (t.mode === "Bus en location" && t.loueur) return `Bus ${t.loueur}`; return t.mode; };

  const matchs = (db.matches || [])
    .filter((m) => m.date && m.date >= lundi && m.date <= dim)
    .sort((a, b) => rangSecteur(a.cat) - rangSecteur(b.cat) || ageDe(b.cat) - ageDe(a.cat) || (a.cat || "").localeCompare(b.cat || "") || (a.date || "").localeCompare(b.date || ""));

  const rows = matchs.map((m) => [m.cat, fmtDate(m.date), m.adversaire || "", lieuDe(m), m.heure || "", rdvDe(m), dirDe(m), m.intendance || "", transDe(m)]);
  const colsLabels = ["Équipe", "Date", "Adversaire", "Terrain", "Heure", "Rendez-vous", "Dirigeants", "Intendance", "Transport"];

  async function telecharger() {
    setMsg("Préparation du document...");
    try { const jsPDF = await chargerJsPDF(); exporterProgrammePDF(jsPDF, rows, label); setMsg(null); }
    catch (e) { setMsg("Module d'impression indisponible. Sur le site en ligne, le document se génère normalement."); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Programme de la semaine</div>
      </header>

      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.grisClair}`, background: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Btn variant="ghost" size="sm" onClick={() => setOffset(offset - 1)}><ChevronLeft size={15} /> Précédent</Btn>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.encre }}>{label}</span>
          <Btn variant="ghost" size="sm" onClick={() => setOffset(offset + 1)}>Suivant <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} /></Btn>
        </div>
        <Btn variant="accent" full disabled={rows.length === 0} onClick={telecharger}><FileDown size={16} /> Imprimer le programme (PDF)</Btn>
        {msg && <div style={{ fontSize: 12.5, color: C.encre, background: C.fond, borderRadius: 10, padding: 10 }}>{msg}</div>}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {rows.length === 0 ? (
          <Empty icon={<CalendarDays size={26} color={C.gris} />} text="Aucun match cette semaine" sub="Change de semaine ou ajoute des matchs au calendrier" />
        ) : (
          <div style={{ overflowX: "auto", border: `1px solid ${C.grisClair}`, borderRadius: 12, background: "#fff" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
              <thead>
                <tr>{colsLabels.map((l) => <th key={l} style={{ background: C.bleu, color: "#fff", fontSize: 11.5, fontWeight: 800, padding: "9px 8px", textAlign: "left", borderLeft: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap" }}>{l}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} style={{ background: ri % 2 ? "#F7F9FC" : "#fff" }}>
                    {r.map((v, ci) => (
                      <td key={ci} style={{ padding: "9px 8px", borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, fontSize: 12.5, fontWeight: ci === 0 ? 800 : 500, color: ci === 0 ? C.bleu : C.encre, verticalAlign: "top" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: 10, lineHeight: 1.5 }}>Le programme reprend tous les matchs de la semaine, toutes catégories. Fais défiler sur le côté pour voir toutes les colonnes.</div>
      </div>
    </div>
  );
}


function exporterSuiviMedicalPDF(jsPDF, blessures, db, cat) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595, H = 842, M = 40;
  const NAVY = [14, 30, 51], BLEU = [26, 53, 83], OR = [198, 162, 76], ENCRE = [22, 32, 46], GRIS = [122, 130, 142], TRAIT = [228, 232, 238], FOND = [247, 248, 250], ROUGE = [181, 72, 63], VERT = [47, 163, 107];
  const sc = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const sd = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const sf = (c) => doc.setFillColor(c[0], c[1], c[2]);
  try { doc.setProperties({ title: "Suivi médical " + cat, author: CLUB_LONG, creator: CLUB_LONG }); } catch (e) {}

  sf(NAVY); doc.rect(0, 0, W, 5, "F");
  if (typeof LOGO_CLUB === "string" && LOGO_CLUB) { try { doc.addImage(LOGO_CLUB, "PNG", W - M - 34, 14, 34, 41); } catch (e) {} }
  sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(CLUB_LONG, M, 42);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text(secteurLabel(cat).toUpperCase() + "   ·   SUIVI MÉDICAL   ·   " + cat, M, 55);
  sd(OR); doc.setLineWidth(1); doc.line(M, 64, W - M, 64); doc.setLineWidth(0.5);

  let y = 84;
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Joueurs pris en charge par le club, en cours de soin ou de réathlétisation.", M, y);
  y += 20;

  const sautPage = (besoin) => { if (y + besoin > H - 46) { doc.addPage(); y = 56; } };

  if (!blessures.length) {
    sc(GRIS); doc.setFont("helvetica", "italic"); doc.setFontSize(10);
    doc.text("Aucun joueur en suivi médical pour cette catégorie.", M, y);
  }

  blessures.forEach((b) => {
    const p = (db.players || []).find((x) => x.id === b.joueurId);
    const nom = p ? `${p.prenom} ${p.nom}` : "Joueur";
    const patho = (b.pathologie && b.pathologie !== "Autre") ? b.pathologie : (b.zone || b.signeCoach || "Blessure à évaluer");
    const statut = b.fini ? "Rétabli" : "En cours";
    const sType = priseEnChargeMedicale(b.cat);
    const enClub = b.priseEnCharge ? b.priseEnCharge === "club" : sType !== "parents";
    const pecTxt = enClub ? (sType === "pro" ? "Suivi club, professionnels" : "Suivi club, centre de formation") : "Soins pris en charge par les parents";
    const dfr = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR") : null;
    const dates = [b.debut ? "blessé le " + dfr(b.debut) : null, b.datePriseEnCharge ? "pris en charge le " + dfr(b.datePriseEnCharge) : null, b.dateRetour ? "retour prévu " + dfr(b.dateRetour) : null, b.kine ? "kiné " + b.kine : null].filter(Boolean).join("   ·   ");
    const testTxt = b.phase === "P4" && b.testRetour ? (b.testRetour === "valide" ? "Test de retour validé, retour sur le terrain" : "Test de retour non validé" + (b.raisonNonRetour ? " : " + b.raisonNonRetour : "")) : "";

    // hauteur estimée de la carte
    const suiviLignes = b.suivi ? doc.splitTextToSize(b.suivi.trim(), W - 2 * M - 24) : [];
    let hCarte = 74;
    if (dates) hCarte += 14;
    if (testTxt) hCarte += 14;
    if (suiviLignes.length) hCarte += 14 + suiviLignes.length * 11;
    sautPage(hCarte + 12);

    const x = M, w = W - 2 * M, top = y;
    sf(FOND); doc.roundedRect(x, top, w, hCarte, 8, 8, "F");
    let yy = top + 20;
    // nom + statut
    sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(nom + (b.cat ? "   (" + b.cat + ")" : ""), x + 14, yy);
    const badge = statut.toUpperCase();
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    const bw = doc.getTextWidth(badge) + 16;
    sf(b.fini ? [226, 244, 233] : [251, 227, 227]); doc.roundedRect(x + w - 14 - bw, yy - 11, bw, 16, 8, 8, "F");
    sc(b.fini ? VERT : ROUGE); doc.text(badge, x + w - 14 - bw + 8, yy);
    if (b.phase) {
      const pb = b.phase, pw = doc.getTextWidth(pb) + 14;
      sf([231, 238, 246]); doc.roundedRect(x + w - 14 - bw - 6 - pw, yy - 11, pw, 16, 8, 8, "F");
      sc(BLEU); doc.text(pb, x + w - 14 - bw - 6 - pw + 7, yy);
    }
    yy += 18;
    // pathologie
    sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    let pl = patho; if (b.cote) pl += " (" + texteCote(b.cote) + ")"; if (b.circonstance) pl += ", " + texteCirconstance(b.circonstance);
    doc.text(pl, x + 14, yy); yy += 15;
    // dates
    if (dates) { sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(dates, x + 14, yy); yy += 14; }
    // prise en charge
    sc(enClub ? BLEU : [184, 122, 43]); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text(pecTxt, x + 14, yy); yy += 14;
    // test retour
    if (testTxt) { sc(b.testRetour === "valide" ? VERT : ROUGE); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text(testTxt, x + 14, yy); yy += 14; }
    // suivi
    if (suiviLignes.length) {
      sc(GRIS); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("SUIVI ET SOINS", x + 14, yy); yy += 11;
      sc(ENCRE); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      suiviLignes.forEach((ln) => { doc.text(ln, x + 14, yy); yy += 11; });
    }
    y = top + hCarte + 12;
  });

  sd(OR); doc.setLineWidth(0.8); doc.line(M, H - 28, W - M, H - 28); doc.setLineWidth(0.5);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text("Édité le " + new Date().toLocaleDateString("fr-FR"), M, H - 19);
  doc.text(CLUB_LONG, W - M, H - 19, { align: "right" });

  doc.save("Suivi_medical_" + (cat || "").replace(/[^0-9A-Za-z]/g, "_") + "_" + new Date().toISOString().slice(0, 10) + ".pdf");
}

function SuiviMedical({ db, mutate, cat, onClose }) {
  const [edit, setEdit] = useState(null);
  const players = db.players.filter((p) => p.cat === cat);
  const sousType = priseEnChargeMedicale(cat);
  const blessures = (db.injuries || []).filter((i) => i.cat === cat && (i.priseEnCharge ? i.priseEnCharge === "club" : sousType !== "parents")).sort((a, b) => (a.fini === b.fini) ? 0 : a.fini ? 1 : -1);
  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Suivi médical · {cat}</div>
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 14, lineHeight: 1.5 }}>Rubrique de l'équipe médicale : joueurs pris en charge par le club, en réathlétisation ou convalescence. {sousType === "pro" ? "Catégorie professionnelle." : sousType === "formation" ? "Centre de formation." : "Cette catégorie est normalement suivie par les parents ; un joueur n'apparaît ici que si le coach a choisi une prise en charge par le club."}</div>
        <Btn variant="accent" full style={{ marginBottom: 16 }} onClick={() => setEdit({ cat, priseEnCharge: "club" })}><Plus size={16} /> Ajouter un joueur en suivi</Btn>
        {blessures.length === 0 ? (
          <Empty icon={<Activity size={24} color={C.gris} />} text="Aucun joueur en suivi médical" sub="Les blessés pris en charge par le club apparaissent ici" />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {blessures.map((b) => {
              const p = db.players.find((x) => x.id === b.joueurId);
              const patho = b.pathologie && b.pathologie !== "Autre" ? b.pathologie : (b.zone || b.signeCoach || "Blessure à évaluer");
              return (
                <Card key={b.id} onClick={() => setEdit(b)} style={{ borderColor: b.fini ? C.grisClair : "#F3C9C9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{p ? `${p.prenom} ${p.nom}` : "Joueur"}{b.cat ? <span style={{ fontWeight: 600, color: C.gris, fontSize: 13 }}> · {b.cat}</span> : null}</strong>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {b.phase ? <Pastille bg="#E7EEF6" color={C.bleu}>{b.phase}</Pastille> : null}
                      <Pastille bg={b.fini ? "#E2F4E9" : "#FBE3E3"} color={b.fini ? C.vert : C.rouge}>{b.fini ? "Rétabli" : "En cours"}</Pastille>
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: C.encre, marginTop: 5, fontWeight: 700 }}>{patho}{b.cote ? ` (${texteCote(b.cote)})` : ""}{b.circonstance ? `, ${texteCirconstance(b.circonstance)}` : ""}</div>
                  <div style={{ fontSize: 12.5, color: C.gris, marginTop: 2 }}>{b.debut ? `blessé le ${new Date(b.debut + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.datePriseEnCharge ? ` · pris en charge le ${new Date(b.datePriseEnCharge + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.dateRetour ? ` · retour prévu ${new Date(b.dateRetour + "T00:00:00").toLocaleDateString("fr-FR")}` : ""}{b.kine ? ` · kiné ${b.kine}` : ""}</div>
                  {b.phase === "P4" && b.testRetour ? <div style={{ fontSize: 12, color: b.testRetour === "valide" ? C.vert : C.rouge, marginTop: 3, fontWeight: 700 }}>{b.testRetour === "valide" ? "Test validé, retour sur le terrain" : `Test non validé${b.raisonNonRetour ? " : " + b.raisonNonRetour : ""}`}</div> : null}
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {edit && <EditBlessure blessure={edit} players={players} medical onClose={() => setEdit(null)}
        onSave={(b) => { mutate((d) => { d.injuries = d.injuries || []; if (b.id) { d.injuries[d.injuries.findIndex((x) => x.id === b.id)] = b; } else { d.injuries.push({ ...b, id: uid() }); } return d; }); setEdit(null); }}
        onDelete={edit.id ? () => { mutate((d) => { d.injuries = (d.injuries || []).filter((x) => x.id !== edit.id); return d; }); setEdit(null); } : null} />}
    </div>
  );
}

function PlanningHebdo({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Planning hebdomadaire des entraînements</div>
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ fontSize: 12, color: C.gris, marginBottom: 14, lineHeight: 1.5, background: "#EAF0F7", border: `1px solid ${C.grisClair}`, borderRadius: 10, padding: "9px 12px" }}>Créneaux d'entraînement attribués pour la saison. Synthé centre correspond au synthétique plein air, Dôme au synthétique du dôme.</div>
        {(() => {
          const jours = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
          const bgTer = (t) => t === "Dôme" ? "#E7EEF6" : t === "Pouges" ? "#FBEAD9" : "#E2F4E9";
          const colTer = (t) => t === "Dôme" ? C.bleu : t === "Pouges" ? "#B87A2B" : C.vert;
          return (
            <div style={{ overflowX: "auto", border: `1px solid ${C.grisClair}`, borderRadius: 12, background: "#fff", WebkitOverflowScrolling: "touch" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 120 + 7 * 104 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: C.bleu, color: "#fff", fontSize: 11.5, fontWeight: 800, padding: "9px 8px", textAlign: "left", minWidth: 120, zIndex: 1 }}>Catégorie</th>
                    {jours.map((j) => <th key={j} style={{ background: C.bleu, color: "#fff", fontSize: 11.5, fontWeight: 800, padding: "9px 6px", minWidth: 104, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{j.slice(0, 3)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PLANNING_HEBDO.map((sec) => (
                    <React.Fragment key={sec.section}>
                      <tr><td colSpan={8} style={{ background: "#EEF2F8", color: C.bleu, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, padding: "7px 8px" }}>{sec.section}</td></tr>
                      {sec.lignes.map((l, ri) => (
                        <tr key={l.cat} style={{ background: ri % 2 ? "#F7F9FC" : "#fff" }}>
                          <td style={{ position: "sticky", left: 0, background: ri % 2 ? "#EEF2F8" : "#fff", fontSize: 12, fontWeight: 800, color: C.encre, padding: "8px", borderTop: `1px solid ${C.grisClair}`, zIndex: 1 }}>{l.cat}</td>
                          {jours.map((j) => {
                            const cr = l.creneaux.find((x) => x[0] === j);
                            return (
                              <td key={j} style={{ borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, padding: 4, verticalAlign: "middle", textAlign: "center" }}>
                                {cr ? (
                                  <div style={{ background: bgTer(cr[1]), borderRadius: 7, padding: "5px 4px" }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, color: colTer(cr[1]) }}>{cr[1]}</div>
                                    <div style={{ fontSize: 10, color: C.gris, fontWeight: 600, marginTop: 1 }}>{cr[2]}</div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function DocumentsAdmin({ players, cat, onClose }) {
  const lignes = players.map((p) => {
    const sc = statutMedical(p);
    const licProb = p.licenceStatut !== "Valide";
    const urgence = Math.max(sc.urgence, licProb ? 1 : 0);
    return { p, sc, licProb, urgence };
  }).sort((a, b) => b.urgence - a.urgence || (a.p.nom || "").localeCompare(b.p.nom || ""));
  const aSurveiller = lignes.filter((l) => l.urgence > 0).length;
  const mut = compteMutations(players);
  const limH = limiteHorsPeriode(cat);
  const limT = limiteMutesTotal(cat);
  const depasseHors = mut.hors > limH;

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Documents administratifs · {cat}</div>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ background: aSurveiller === 0 ? "#E2F4E9" : "#FBEAD9", color: aSurveiller === 0 ? C.vert : "#B87A2B", borderRadius: 12, padding: "12px 14px", fontWeight: 800, fontSize: 14, marginBottom: 16 }}>
          {aSurveiller === 0 ? "Tous les documents sont à jour" : `${aSurveiller} joueur${aSurveiller > 1 ? "s" : ""} à surveiller`}
        </div>

        {depasseHors && (
          <div style={{ background: "#FBE3E3", border: `1px solid ${C.rouge}`, color: C.rouge, borderRadius: 12, padding: "12px 14px", fontWeight: 700, fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>
            Attention : {mut.hors} joueurs en mutation hors période, pour une limite de {limH} alignable{limH > 1 ? "s" : ""} sur une feuille de match. À toi de décider qui faire signer.
          </div>
        )}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Mutations de la catégorie</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Pastille bg="#E7EEF6" color={C.bleu}>{mut.normale} période normale</Pastille>
            <Pastille bg={depasseHors ? "#FBE3E3" : "#FBEAD9"} color={depasseHors ? C.rouge : "#B87A2B"}>{mut.hors} hors période (max {limH})</Pastille>
            {mut.sansdate > 0 ? <Pastille bg="#FBEAD9" color="#B87A2B">{mut.sansdate} sans date</Pastille> : null}
            {mut.expirees > 0 ? <Pastille bg={C.grisClair} color={C.gris}>{mut.expirees} expirée{mut.expirees > 1 ? "s" : ""}</Pastille> : null}
          </div>
          <div style={{ fontSize: 11.5, color: C.gris, marginTop: 8, lineHeight: 1.5 }}>Total {mut.total} muté{mut.total > 1 ? "s" : ""} actif{mut.total > 1 ? "s" : ""}. Limite de base sur la feuille de match : {limT} mutés dont {limH} hors période. Le total peut être relevé selon le nombre d'arbitres du club.</div>
        </Card>

        {players.length === 0 ? (
          <Empty icon={<ClipboardList size={24} color={C.gris} />} text="Aucun joueur dans cette catégorie" />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {lignes.map(({ p, sc }) => {
              const licBg = p.licenceStatut === "Valide" ? "#E2F4E9" : p.licenceStatut ? "#FBEAD9" : C.grisClair;
              const licCol = p.licenceStatut === "Valide" ? C.vert : p.licenceStatut ? "#B87A2B" : C.gris;
              const cerBg = sc.urgence >= 2 ? "#FBE3E3" : sc.urgence === 1 ? "#FBEAD9" : sc.urgence === 0 ? "#E2F4E9" : C.grisClair;
              return (
                <Card key={p.id}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{p.prenom} {p.nom}</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <Pastille bg={licBg} color={licCol}>Licence : {p.licenceStatut || "non renseignée"}</Pastille>
                    <Pastille bg={cerBg} color={sc.couleur}>Contrôle médical : {sc.label}</Pastille>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: 12, lineHeight: 1.5 }}>Le contrôle médical est à refaire chaque saison, questionnaire de santé ou certificat si exigé. Modifie ces informations depuis la fiche du joueur.</div>
      </div>
    </div>
  );
}


function BilanEquipe({ db, players, cat, onClose, onTournois }) {
  const saisons = useMemo(() => {
    const s = new Set([saisonCourante()]);
    (db.matches || []).forEach((m) => { if (m.cat === cat) { const sa = saisonDe(m.date); if (sa) s.add(sa); } });
    return [...s].sort().reverse();
  }, [db, cat]);
  const [saison, setSaison] = useState(saisons[0]);

  const joues = (db.matches || []).filter((m) => m.cat === cat && saisonDe(m.date) === saison && m.scorePour != null && m.scoreContre != null && m.scorePour !== "" && m.scoreContre !== "");
  let v = 0, n = 0, d = 0, bp = 0, bc = 0;
  joues.forEach((m) => {
    const sp = +m.scorePour, sc = +m.scoreContre;
    bp += sp; bc += sc;
    if (sp > sc) v++; else if (sp === sc) n++; else d++;
  });
  const nbMatchs = joues.length;

  const statsJ = players.map((p) => ({ p, s: statsJoueur(p, db, saison) }));
  const buteurs = statsJ.filter((x) => x.s.buts > 0).sort((a, b) => b.s.buts - a.s.buts).slice(0, 8);
  const passeurs = statsJ.filter((x) => x.s.passes > 0).sort((a, b) => b.s.passes - a.s.passes).slice(0, 8);
  const notes = statsJ.filter((x) => x.s.moy != null).sort((a, b) => b.s.moy - a.s.moy).slice(0, 5);

  const Tuile = ({ val, lab, col }) => (
    <div style={{ background: "#fff", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.grisClair}`, flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: col || C.bleu }}>{val}</div>
      <div style={{ fontSize: 10.5, color: C.gris, marginTop: 2 }}>{lab}</div>
    </div>
  );

  const Classement = ({ titre, data, cle, unite }) => (
    <>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, margin: "16px 0 8px" }}>{titre}</div>
      {data.length === 0 ? (
        <div style={{ fontSize: 13, color: C.gris, padding: "4px 2px" }}>Aucune donnée pour cette saison.</div>
      ) : (
        <Card>
          {data.map((x, i) => (
            <div key={x.p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: i ? `1px solid ${C.grisClair}` : "none" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: i === 0 ? C.jaune : "#EEF2F8", color: i === 0 ? C.bleuNuit : C.gris, fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{i + 1}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{x.p.prenom} {x.p.nom}</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: C.bleu }}>{cle === "moy" ? x.s.moy.toFixed(1) : x.s[cle]}<span style={{ fontSize: 11, color: C.gris, fontWeight: 700 }}> {unite}</span></span>
            </div>
          ))}
        </Card>
      )}
    </>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Bilan de saison · {cat}</div>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Field label="Saison">
          <Sel value={saison} onChange={(e) => setSaison(e.target.value)}>
            {saisons.map((s) => <option key={s} value={s}>{s}</option>)}
          </Sel>
        </Field>
        <Btn variant="ghost" full style={{ margin: "2px 0 14px" }} onClick={onTournois}><Award size={16} /> Ajouter ou gérer les tournois</Btn>

        {nbMatchs === 0 ? (
          <Empty icon={<Trophy size={26} color={C.gris} />} text="Aucun match joué cette saison" sub="Les résultats apparaîtront une fois les scores saisis" />
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, margin: "6px 0 8px" }}>Résultats</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Tuile val={nbMatchs} lab="Matchs" />
              <Tuile val={v} lab="Victoires" col={C.vert} />
              <Tuile val={n} lab="Nuls" col="#B87A2B" />
              <Tuile val={d} lab="Défaites" col={C.rouge} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <Tuile val={bp} lab="Buts marqués" />
              <Tuile val={bc} lab="Buts encaissés" />
              <Tuile val={(bp - bc > 0 ? "+" : "") + (bp - bc)} lab="Différence" col={bp - bc >= 0 ? C.vert : C.rouge} />
            </div>

            <Classement titre="Meilleurs buteurs" data={buteurs} cle="buts" unite="buts" />
            <Classement titre="Meilleurs passeurs" data={passeurs} cle="passes" unite="passes" />
            <Classement titre="Meilleures notes moyennes" data={notes} cle="moy" unite="/ 7" />
          </>
        )}

        {(() => {
          const tournois = (db.tournois || []).filter((t) => t.cat === cat && saisonDe(t.date) === saison).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
          if (tournois.length === 0) return null;
          return (
            <>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, margin: "16px 0 8px" }}>Tournois</div>
              <Card>
                {tournois.map((t, i) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${C.grisClair}` : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: couleurRang(t.place), color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto", fontWeight: 900, fontSize: 12 }}>{t.place ? ordinalRang(t.place) : <Trophy size={15} />}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{t.nom}</div>
                      <div style={{ fontSize: 12, color: C.gris }}>{t.date ? new Date(t.date + "T00:00:00").toLocaleDateString("fr-FR") : ""}</div>
                    </div>
                    {t.place ? <div style={{ fontSize: 14, fontWeight: 900, color: C.bleu }}>{ordinalRang(t.place)}{t.nbEquipes ? <span style={{ fontSize: 11, color: C.gris, fontWeight: 700 }}> / {t.nbEquipes}</span> : null}</div> : null}
                  </div>
                ))}
              </Card>
            </>
          );
        })()}
      </div>
    </div>
  );
}


function ordinalRang(n) {
  const p = parseInt(n, 10);
  if (!p) return "";
  return p === 1 ? "1er" : `${p}e`;
}
function couleurRang(place) {
  const p = parseInt(place, 10);
  if (p === 1) return "#C6A24C";
  if (p === 2) return "#9AA3AD";
  if (p === 3) return "#B08D57";
  return "#8A93A0";
}

function EditTournoi({ tournoi, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ nom: "", date: "", lieu: "", place: "", nbEquipes: "", commentaire: "", ...tournoi });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  return (
    <Modal title={tournoi.id ? "Modifier le tournoi" : "Nouveau tournoi"} onClose={onClose}
      footer={<><Btn variant="accent" full disabled={!f.nom.trim()} onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>{tournoi.id && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}</>}>
      <Field label="Nom du tournoi"><Inp value={f.nom} onChange={(e) => set("nom", e.target.value)} placeholder="Tournoi de printemps, Challenge..." /></Field>
      <Field label="Date"><Inp type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Lieu (optionnel)"><Inp value={f.lieu} onChange={(e) => set("lieu", e.target.value)} placeholder="Ville ou stade" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Classement"><Inp type="number" value={f.place} onChange={(e) => set("place", e.target.value)} placeholder="3" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Sur combien d'équipes"><Inp type="number" value={f.nbEquipes} onChange={(e) => set("nbEquipes", e.target.value)} placeholder="12" /></Field></div>
      </div>
      <Field label="Commentaire (optionnel)"><Inp value={f.commentaire} onChange={(e) => set("commentaire", e.target.value)} placeholder="Bel état d'esprit, belle finale..." /></Field>
    </Modal>
  );
}

function Tournois({ db, mutate, cat, onClose }) {
  const [edit, setEdit] = useState(null);
  const saisons = useMemo(() => {
    const s = new Set([saisonCourante()]);
    (db.tournois || []).forEach((t) => { if (t.cat === cat) { const sa = saisonDe(t.date); if (sa) s.add(sa); } });
    return [...s].sort().reverse();
  }, [db, cat]);
  const [saison, setSaison] = useState(saisons[0]);

  const liste = (db.tournois || []).filter((t) => t.cat === cat && saisonDe(t.date) === saison).sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  function enregistrer(t) {
    mutate((d) => {
      d.tournois = d.tournois || [];
      if (t.id) { const i = d.tournois.findIndex((x) => x.id === t.id); d.tournois[i] = t; }
      else d.tournois.push({ ...t, id: uid(), cat });
      return d;
    });
    setEdit(null);
  }
  function supprimer(id) { mutate((d) => { d.tournois = (d.tournois || []).filter((x) => x.id !== id); return d; }); setEdit(null); }

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Tournois · {cat}</div>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Field label="Saison">
          <Sel value={saison} onChange={(e) => setSaison(e.target.value)}>
            {saisons.map((s) => <option key={s} value={s}>{s}</option>)}
          </Sel>
        </Field>
        <Btn variant="accent" full style={{ margin: "4px 0 16px" }} onClick={() => setEdit({ date: saison ? `${saison.slice(0, 4) * 1 + 1}-05-15` : "" })}><Plus size={16} /> Ajouter un tournoi</Btn>

        {liste.length === 0 ? (
          <Empty icon={<Trophy size={26} color={C.gris} />} text="Aucun tournoi cette saison" sub="Ajoute les tournois joués et leur classement" />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {liste.map((t) => (
              <Card key={t.id} onClick={() => setEdit(t)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: couleurRang(t.place), color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto", fontWeight: 900, fontSize: 15 }}>
                    {t.place ? ordinalRang(t.place) : <Trophy size={20} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{t.nom}</div>
                    <div style={{ fontSize: 12.5, color: C.gris, marginTop: 2 }}>{t.date ? new Date(t.date + "T00:00:00").toLocaleDateString("fr-FR") : ""}{t.lieu ? ` · ${t.lieu}` : ""}</div>
                  </div>
                  {t.place ? (
                    <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: C.bleu }}>{ordinalRang(t.place)}</div>
                      {t.nbEquipes ? <div style={{ fontSize: 11.5, color: C.gris }}>sur {t.nbEquipes}</div> : null}
                    </div>
                  ) : null}
                </div>
                {t.commentaire ? <div style={{ fontSize: 13, color: C.encre, marginTop: 8, background: C.fond, borderRadius: 9, padding: "8px 10px" }}>{t.commentaire}</div> : null}
              </Card>
            ))}
          </div>
        )}
      </div>

      {edit && <EditTournoi tournoi={edit} onClose={() => setEdit(null)} onSave={enregistrer} onDelete={edit.id ? () => supprimer(edit.id) : null} />}
    </div>
  );
}


const QUALITES = ["Éducateur", "Comité", "Président", "Autre"];
const RAPPELS = ["Aucun", "1 heure avant", "2 heures avant", "La veille", "2 jours avant"];

function EditReunion({ reunion, educateurs, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ objet: "", date: "", heure: "", lieu: "", ordreJour: "", rappel: "La veille", participants: [], ...reunion });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [qualite, setQualite] = useState("Éducateur");
  const ajouter = () => {
    if (!nom.trim()) return;
    set("participants", [...(f.participants || []), { id: uid(), nom: nom.trim(), email: email.trim(), qualite, reponse: "attente", motif: "" }]);
    setNom(""); setEmail("");
  };
  const retirer = (id) => set("participants", (f.participants || []).filter((p) => p.id !== id));
  const educsDispo = (educateurs || []).filter((e) => e.nom && !(f.participants || []).some((p) => p.nom === e.nom));
  const ajouterEduc = (ed) => { const cats = (ed.categories || []); const fn = ed.fonction || "Éducateur"; const q = (fn === "Éducateur" && cats.length) ? `Éducateur (${cats.join(", ")})` : fn; set("participants", [...(f.participants || []), { id: uid(), nom: ed.nom, email: ed.email || "", qualite: q, reponse: "attente", motif: "" }]); };
  const finaliser = () => {
    let parts = f.participants || [];
    if (nom.trim()) parts = [...parts, { id: uid(), nom: nom.trim(), email: email.trim(), qualite, reponse: "attente", motif: "" }];
    onSave({ ...f, participants: parts });
  };

  return (
    <Modal title={reunion.id ? "Modifier la réunion" : "Programmer une réunion"} onClose={onClose}
      footer={<><Btn variant="accent" full disabled={!f.objet.trim() || !f.date} onClick={finaliser}><Save size={16} /> Enregistrer</Btn>{reunion.id && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}</>}>
      <Field label="Objet de la réunion"><Inp value={f.objet} onChange={(e) => set("objet", e.target.value)} placeholder="Réunion de préparation, bilan..." /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Date"><Inp type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Heure"><Inp type="time" value={f.heure} onChange={(e) => set("heure", e.target.value)} /></Field></div>
      </div>
      <Field label="Lieu"><Inp value={f.lieu} onChange={(e) => set("lieu", e.target.value)} placeholder="Club house, salle de réunion..." /></Field>
      <Field label="Ordre du jour (optionnel)"><textarea value={f.ordreJour || ""} onChange={(e) => set("ordreJour", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} placeholder="Points à aborder" /></Field>
      <Field label="Rappel"><Sel value={f.rappel} onChange={(e) => set("rappel", e.target.value)}>{RAPPELS.map((r) => <option key={r}>{r}</option>)}</Sel></Field>

      <div style={{ fontWeight: 800, color: C.bleu, margin: "8px 0" }}>Personnes conviées</div>
      {educsDispo.length > 0 && (
        <Field label="Membres du club">
          <Sel value="" onChange={(e) => { const ed = (educateurs || []).find((x) => x.id === e.target.value); if (ed) ajouterEduc(ed); }}>
            <option value="">Choisir une personne à convier</option>
            {ORDRE_FONCTIONS.map((fn) => {
              const membres = educsDispo.filter((ed) => (ed.fonction || "Éducateur") === fn);
              if (!membres.length) return null;
              return <optgroup key={fn} label={fn}>{membres.map((ed) => <option key={ed.id} value={ed.id}>{ed.nom}{fn === "Éducateur" && ed.categories && ed.categories.length ? ` (${ed.categories.join(", ")})` : ""}</option>)}</optgroup>;
            })}
          </Sel>
        </Field>
      )}
      <div style={{ fontSize: 12.5, color: C.gris, margin: "2px 0 8px" }}>Ou ajoute une autre personne : président, membre du comité...</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}><Inp value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom et prénom" /></div>
        <div style={{ width: 120 }}><Sel value={qualite} onChange={(e) => setQualite(e.target.value)}>{QUALITES.map((q) => <option key={q}>{q}</option>)}</Sel></div>
      </div>
      <div style={{ marginBottom: 8 }}><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse email (indispensable pour recevoir l'alarme)" /></div>
      <Btn variant="ghost" full style={{ marginBottom: 12 }} disabled={!nom.trim()} onClick={ajouter}><Plus size={16} /> Ajouter la personne</Btn>
      {(f.participants || []).length > 0 && (
        <div style={{ display: "grid", gap: 7 }}>
          {(f.participants || []).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.fond, borderRadius: 9, padding: "8px 10px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nom} <span style={{ color: C.gris, fontWeight: 500 }}>· {p.qualite}</span></div>
                {p.email ? <div style={{ fontSize: 11, color: C.gris }}>{p.email}</div> : <div style={{ fontSize: 11, color: C.rouge, fontWeight: 600 }}>sans email : pas d'alarme</div>}
              </div>
              <X size={15} color={C.gris} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => retirer(p.id)} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ModalReponse({ participant, onClose, onSave }) {
  const [reponse, setReponse] = useState(participant.reponse === "attente" ? "present" : participant.reponse);
  const [motif, setMotif] = useState(participant.motif || "");
  return (
    <Modal title={participant.nom} onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => onSave(reponse, (reponse === "absent" || reponse === "excuse") ? motif.trim() : "")}><Check size={16} /> Valider la réponse</Btn>}>
      <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
        {[["present", "Présent"], ["excuse", "Excusé"], ["absent", "Absent"]].map(([v, lab]) => (
          <button key={v} onClick={() => setReponse(v)} style={{
            flex: 1, border: "none", cursor: "pointer", borderRadius: 11, padding: "12px 4px", fontWeight: 800, fontSize: 13,
            background: reponse === v ? (v === "present" ? C.vert : v === "excuse" ? "#B87A2B" : C.rouge) : "#EEF2F8", color: reponse === v ? "#fff" : C.gris,
          }}>{lab}</button>
        ))}
      </div>
      {(reponse === "absent" || reponse === "excuse") && (
        <Field label="Motif (facultatif)"><Inp value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Indisponible, congés... ou laisse vide" /></Field>
      )}
    </Modal>
  );
}

function Reunions({ db, mutate, erreur, onClose }) {
  const [edit, setEdit] = useState(null);
  const [selId, setSelId] = useState(null);
  const [rep, setRep] = useState(null);

  const d0 = new Date();
  const todayStr = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  const toutes = (db.reunions || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.heure || "").localeCompare(b.heure || ""));
  const aVenir = toutes.filter((r) => (r.date || "") >= todayStr);
  const passees = toutes.filter((r) => (r.date || "") < todayStr).reverse();
  const sel = (db.reunions || []).find((r) => r.id === selId);

  function enregistrer(r) {
    mutate((d) => {
      d.reunions = d.reunions || [];
      if (r.id) { const i = d.reunions.findIndex((x) => x.id === r.id); d.reunions[i] = r; }
      else d.reunions.push({ ...r, id: uid() });
      return d;
    });
    setEdit(null);
  }
  function supprimer(id) { mutate((d) => { d.reunions = (d.reunions || []).filter((x) => x.id !== id); return d; }); setEdit(null); setSelId(null); }
  function repondre(reunionId, participantId, reponse, motif) {
    mutate((d) => {
      const r = (d.reunions || []).find((x) => x.id === reunionId);
      if (r) { const p = (r.participants || []).find((x) => x.id === participantId); if (p) { p.reponse = reponse; p.motif = motif; } }
      return d;
    });
    setRep(null);
  }

  const compteReponses = (r) => {
    const ps = r.participants || [];
    return { present: ps.filter((p) => p.reponse === "present").length, excuse: ps.filter((p) => p.reponse === "excuse").length, absent: ps.filter((p) => p.reponse === "absent").length, attente: ps.filter((p) => p.reponse === "attente").length };
  };
  const dateLongue = (r) => (r.date ? new Date(r.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "") + (r.heure ? ` · ${r.heure}` : "");

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => (sel ? setSelId(null) : onClose())} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{sel ? "Détail de la réunion" : "Réunions"}</div>
      </header>

      {!sel ? (
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <Btn variant="accent" full style={{ marginBottom: 16 }} onClick={() => setEdit({})}><Plus size={16} /> Programmer une réunion</Btn>
          {erreur ? <div style={{ background: "#FBE3E3", border: `1px solid ${C.rouge}`, color: C.rouge, borderRadius: 10, padding: 10, fontSize: 12.5, marginBottom: 12 }}>Souci de connexion aux réunions communes : {erreur}</div> : null}
          {toutes.length === 0 ? (
            <Empty icon={<CalendarDays size={26} color={C.gris} />} text="Aucune réunion programmée" sub="Programme une réunion et convie les personnes concernées" />
          ) : (
            <>
              {aVenir.length > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 8px" }}>À venir</div>}
              <div style={{ display: "grid", gap: 10, marginBottom: aVenir.length ? 18 : 0 }}>
                {aVenir.map((r) => {
                  const c = compteReponses(r);
                  return (
                    <Card key={r.id} onClick={() => setSelId(r.id)}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{r.objet}</div>
                      <div style={{ fontSize: 12.5, color: C.gris, textTransform: "capitalize", marginTop: 2 }}>{dateLongue(r)}</div>
                      {r.lieu ? <div style={{ fontSize: 12.5, color: C.gris }}>{r.lieu}</div> : null}
                      <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                        <Pastille bg="#E2F4E9" color={C.vert}>{c.present} présents</Pastille>
                        <Pastille bg="#FBEAD9" color="#B87A2B">{c.excuse} excusés</Pastille>
                        <Pastille bg="#FBE3E3" color={C.rouge}>{c.absent} absents</Pastille>
                        <Pastille bg={C.grisClair} color={C.gris}>{c.attente} en attente</Pastille>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {passees.length > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: C.gris, textTransform: "uppercase", letterSpacing: 0.4, margin: "0 0 8px" }}>Passées</div>}
              <div style={{ display: "grid", gap: 10 }}>
                {passees.map((r) => (
                  <Card key={r.id} onClick={() => setSelId(r.id)} style={{ opacity: 0.75 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.objet}</div>
                    <div style={{ fontSize: 12.5, color: C.gris, textTransform: "capitalize", marginTop: 2 }}>{dateLongue(r)}</div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: C.bleu }}>{sel.objet}</div>
          <div style={{ fontSize: 13.5, color: C.encre, textTransform: "capitalize", marginTop: 4 }}>{dateLongue(sel)}</div>
          {sel.lieu ? <div style={{ fontSize: 13.5, color: C.gris, marginTop: 2 }}>{sel.lieu}</div> : null}
          {sel.rappel && sel.rappel !== "Aucun" ? <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, background: "#FFF3DA", color: "#B87A2B", borderRadius: 9, padding: "5px 10px", fontSize: 12.5, fontWeight: 700 }}><Timer size={14} /> Rappel : {sel.rappel.toLowerCase()}</div> : null}
          {sel.ordreJour ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.gris, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>Ordre du jour</div>
              <div style={{ fontSize: 13.5, color: C.encre, whiteSpace: "pre-wrap", background: "#fff", border: `1px solid ${C.grisClair}`, borderRadius: 11, padding: 12 }}>{sel.ordreJour}</div>
            </div>
          ) : null}

          <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, margin: "16px 0 8px" }}>Personnes conviées</div>
          <div style={{ fontSize: 11.5, color: C.gris, marginBottom: 8 }}>Touche une personne pour indiquer sa réponse.</div>
          <div style={{ display: "grid", gap: 8 }}>
            {(sel.participants || []).map((p) => {
              const col = p.reponse === "present" ? C.vert : p.reponse === "absent" ? C.rouge : p.reponse === "excuse" ? "#B87A2B" : C.gris;
              const bg = p.reponse === "present" ? "#E2F4E9" : p.reponse === "absent" ? "#FBE3E3" : p.reponse === "excuse" ? "#FBEAD9" : C.grisClair;
              const label = p.reponse === "present" ? "Présent" : p.reponse === "absent" ? "Absent" : p.reponse === "excuse" ? "Excusé" : "En attente";
              return (
                <Card key={p.id} onClick={() => setRep(p)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nom}</div>
                      <div style={{ fontSize: 12, color: C.gris }}>{p.qualite}{(p.reponse === "absent" || p.reponse === "excuse") && p.motif ? ` · ${p.motif}` : ""}</div>
                    </div>
                    <Pastille bg={bg} color={col}>{label}</Pastille>
                  </div>
                </Card>
              );
            })}
            {(sel.participants || []).length === 0 && <div style={{ fontSize: 13, color: C.gris }}>Aucune personne conviée pour le moment.</div>}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Btn variant="ghost" full onClick={() => setEdit(sel)}><Edit3 size={16} /> Modifier</Btn>
          </div>
        </div>
      )}

      {edit && <EditReunion reunion={edit} educateurs={db.acces || []} onClose={() => setEdit(null)} onSave={enregistrer} onDelete={edit.id ? () => supprimer(edit.id) : null} />}
      {rep && sel && <ModalReponse participant={rep} onClose={() => setRep(null)} onSave={(reponse, motif) => repondre(sel.id, rep.id, reponse, motif)} />}
    </div>
  );
}


const COULEURS_EV = { match: "#1A3553", entrainement: "#2E7D52", reunion: "#B87A2B", tournoi: "#8E5AA8" };
const LABELS_EV = { match: "Matchs", entrainement: "Entraînements", reunion: "Réunions", tournoi: "Tournois" };
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const fmtISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function Calendrier({ db, mutate, mutateReunions, peutValider, onClose }) {
  const d0 = new Date();
  const todayStr = fmtISO(d0);
  const [vue, setVue] = useState("mois");
  const [ref, setRef] = useState(() => {
    const ds = [];
    (db.matches || []).forEach((m) => m.date && ds.push(m.date));
    (db.trainings || []).forEach((t) => t.date && ds.push(t.date));
    (db.reunions || []).forEach((r) => r.date && ds.push(r.date));
    (db.tournois || []).forEach((t) => t.date && ds.push(t.date));
    const moisAuj = todayStr.slice(0, 7);
    if (ds.some((d) => d.slice(0, 7) === moisAuj)) return new Date(todayStr + "T00:00:00");
    const futurs = ds.filter((d) => d >= todayStr).sort();
    if (futurs.length) return new Date(futurs[0] + "T00:00:00");
    const passes = ds.filter((d) => d < todayStr).sort();
    if (passes.length) return new Date(passes[passes.length - 1] + "T00:00:00");
    return new Date(todayStr + "T00:00:00");
  });
  const [filtres, setFiltres] = useState({ match: true, entrainement: true, reunion: true, tournoi: true });

  const evenements = useMemo(() => {
    const evs = [];
    (db.matches || []).forEach((m) => { if (m.date) evs.push({ date: m.date, type: "match", cat: m.cat, heure: m.heure || "", titre: `${m.cat} · ${m.lieu === "Domicile" ? "reçoit " : "à "}${m.adversaire || "adversaire"}`, ref: m, kind: "match" }); });
    (db.trainings || []).forEach((t) => { if (t.date) evs.push({ date: t.date, type: "entrainement", cat: t.cat, heure: t.heure || "", titre: `Entraînement ${t.cat}${t.theme ? " · " + t.theme : ""}`, ref: t, kind: "entrainement" }); });
    (db.reunions || []).forEach((r) => { if (r.date) evs.push({ date: r.date, type: "reunion", heure: r.heure || "", titre: r.objet || "Réunion", lieu: r.lieu, ref: r, kind: "reunion" }); });
    (db.tournois || []).forEach((to) => { if (to.date) evs.push({ date: to.date, type: "tournoi", cat: to.cat, heure: "", titre: `Tournoi · ${to.nom}`, lieu: to.lieu, ref: to, kind: "tournoi" }); });
    return evs;
  }, [db]);

  const evVisibles = evenements.filter((e) => filtres[e.type]);
  const toggle = (t) => setFiltres((o) => ({ ...o, [t]: !o[t] }));
  const evDe = (dstr) => evVisibles.filter((e) => e.date === dstr).sort((a, b) => (a.heure || "99").localeCompare(b.heure || "99"));
  const [edit, setEdit] = useState(null);
  const mRoute = (coll) => (coll === "reunions" && mutateReunions) ? mutateReunions : mutate;
  const saveEvt = (coll, obj) => { mRoute(coll)((d) => { d[coll] = d[coll] || []; const i = d[coll].findIndex((x) => x.id === obj.id); if (i >= 0) d[coll][i] = obj; else d[coll].push(obj); return d; }); setEdit(null); };
  const delEvt = (coll, id) => { mRoute(coll)((d) => { d[coll] = (d[coll] || []).filter((x) => x.id !== id); return d; }); setEdit(null); };

  const naviguer = (sens) => { const d = new Date(ref); if (vue === "mois") d.setMonth(d.getMonth() + sens); else if (vue === "semaine") d.setDate(d.getDate() + 7 * sens); else d.setDate(d.getDate() + sens); setRef(d); };

  const lundiDe = (d) => { const x = new Date(d); x.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return x; };
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let titrePeriode = "";
  if (vue === "mois") titrePeriode = `${capital(MOIS_FR[ref.getMonth()])} ${ref.getFullYear()}`;
  else if (vue === "semaine") { const lu = lundiDe(ref); const di = new Date(lu); di.setDate(lu.getDate() + 6); titrePeriode = `${lu.getDate()} ${MOIS_FR[lu.getMonth()].slice(0, 4)}. au ${di.getDate()} ${MOIS_FR[di.getMonth()].slice(0, 4)}.`; }
  else titrePeriode = capital(new Date(fmtISO(ref) + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));

  const CarteEv = ({ e }) => (
    <Card onClick={peutValider ? () => setEdit({ kind: e.kind, obj: e.ref }) : undefined}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 5, alignSelf: "stretch", minHeight: 34, borderRadius: 999, background: COULEURS_EV[e.type], flex: "0 0 auto" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{e.titre}</div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 2 }}>{LABELS_EV[e.type].replace(/s$/, "")}{e.heure ? ` · ${e.heure}` : ""}{e.lieu ? ` · ${e.lieu}` : ""}</div>
        </div>
        {peutValider && <Edit3 size={16} color={C.gris} style={{ flex: "0 0 auto" }} />}
      </div>
    </Card>
  );

  // Vue MOIS
  const premier = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nbJours = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const cases = [];
  for (let i = 0; i < decalage; i++) cases.push(null);
  for (let j = 1; j <= nbJours; j++) cases.push(`${ref.getFullYear()}-${pad(ref.getMonth() + 1)}-${pad(j)}`);
  const refStr = fmtISO(ref);

  // Vue SEMAINE
  const lu = lundiDe(ref);
  const joursSem = [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = new Date(lu); d.setDate(lu.getDate() + i); return fmtISO(d); });

  return (
    <div style={{ position: "fixed", inset: 0, background: C.fond, zIndex: 60, display: "flex", flexDirection: "column", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, color: "#fff", padding: "16px 16px 14px", borderBottom: `2px solid ${C.jaune}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={20} /></button>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Calendrier du club</div>
      </header>

      <div style={{ padding: "12px 14px", background: "#fff", borderBottom: `1px solid ${C.grisClair}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <Sel value={vue} onChange={(e) => setVue(e.target.value)}>
          <option value="mois">Vue par mois</option>
          <option value="semaine">Vue par semaine</option>
          <option value="jour">Vue par jour</option>
        </Sel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {Object.keys(LABELS_EV).map((t) => (
            <button key={t} onClick={() => toggle(t)} style={{
              border: "none", cursor: "pointer", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 6,
              background: filtres[t] ? COULEURS_EV[t] : "#EEF2F8", color: filtres[t] ? "#fff" : C.gris,
            }}><span style={{ width: 8, height: 8, borderRadius: 999, background: filtres[t] ? "#fff" : COULEURS_EV[t] }} /> {LABELS_EV[t]}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
          <button onClick={() => naviguer(-1)} style={{ border: `1px solid ${C.grisClair}`, background: "#fff", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={18} color={C.bleu} /></button>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: C.encre, textAlign: "center", flex: 1 }}>{titrePeriode}</div>
          <button onClick={() => naviguer(1)} style={{ border: `1px solid ${C.grisClair}`, background: "#fff", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ChevronLeft size={18} color={C.bleu} style={{ transform: "rotate(180deg)" }} /></button>
        </div>

        {vue === "mois" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
              {["L", "M", "M", "J", "V", "S", "D"].map((j, i) => <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: C.gris, padding: "2px 0" }}>{j}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {cases.map((dstr, i) => {
                if (!dstr) return <div key={i} />;
                const evs = evVisibles.filter((e) => e.date === dstr);
                const types = [...new Set(evs.map((e) => e.type))];
                const estSel = dstr === refStr, estAuj = dstr === todayStr;
                return (
                  <button key={i} onClick={() => setRef(new Date(dstr + "T00:00:00"))} style={{
                    border: estSel ? `2px solid ${C.bleu}` : `1px solid ${C.grisClair}`, background: estAuj ? "#EEF2F8" : "#fff",
                    borderRadius: 10, minHeight: 46, padding: "4px 2px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: estAuj ? 900 : 600, color: estAuj ? C.bleu : C.encre }}>{+dstr.slice(-2)}</span>
                    <span style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                      {types.slice(0, 4).map((t) => <span key={t} style={{ width: 6, height: 6, borderRadius: 999, background: COULEURS_EV[t] }} />)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, textTransform: "capitalize" }}>{new Date(refStr + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
              {evDe(refStr).length === 0 ? <div style={{ fontSize: 13.5, color: C.gris }}>Aucun événement ce jour.</div> : <div style={{ display: "grid", gap: 9 }}>{evDe(refStr).map((e, i) => <CarteEv key={i} e={e} />)}</div>}
            </div>
          </>
        )}

        {vue === "semaine" && (
          <div style={{ display: "grid", gap: 14 }}>
            {joursSem.map((dstr) => {
              const evs = evDe(dstr);
              const estAuj = dstr === todayStr;
              return (
                <div key={dstr}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: estAuj ? C.bleu : C.encre, textTransform: "capitalize", marginBottom: 7 }}>{new Date(dstr + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
                  {evs.length === 0 ? <div style={{ fontSize: 12.5, color: C.grisClair, paddingLeft: 2 }}>Rien de prévu</div> : <div style={{ display: "grid", gap: 8 }}>{evs.map((e, i) => <CarteEv key={i} e={e} />)}</div>}
                </div>
              );
            })}
          </div>
        )}

        {vue === "jour" && (
          <div>
            {evDe(refStr).length === 0 ? <Empty icon={<CalendarDays size={26} color={C.gris} />} text="Aucun événement ce jour" sub="Change de jour avec les flèches" /> : <div style={{ display: "grid", gap: 9 }}>{evDe(refStr).map((e, i) => <CarteEv key={i} e={e} />)}</div>}
          </div>
        )}
      </div>

      {edit && edit.kind === "match" && <EditMatch match={edit.obj} onClose={() => setEdit(null)} onSave={(m) => saveEvt("matches", m)} />}
      {edit && edit.kind === "entrainement" && <EditSeance seance={edit.obj} players={(db.players || []).filter((p) => p.cat === edit.obj.cat)} onClose={() => setEdit(null)} onSave={(s) => saveEvt("trainings", s)} />}
      {edit && edit.kind === "reunion" && <EditReunion reunion={edit.obj} educateurs={db.acces || []} onClose={() => setEdit(null)} onSave={(r) => saveEvt("reunions", r)} onDelete={() => delEvt("reunions", edit.obj.id)} />}
      {edit && edit.kind === "tournoi" && <EditTournoi tournoi={edit.obj} onClose={() => setEdit(null)} onSave={(t) => saveEvt("tournois", t)} onDelete={() => delEvt("tournois", edit.obj.id)} />}
    </div>
  );
}

function Detection({ cat, db, mutate }) {
  const [edit, setEdit] = useState(null);
  const liste = db.scouting.filter((s) => s.cat === cat).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Détection {cat}</h2>
        <Btn variant="accent" size="sm" onClick={() => setEdit({ cat })}><Plus size={16} /> Talent</Btn>
      </div>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 14 }}>Joueurs repérés dans les équipes adverses.</div>

      {liste.length === 0 ? (
        <Empty icon={<Eye size={26} color={C.gris} />} text="Aucun talent repéré" sub="Note un joueur adverse intéressant" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {liste.map((s) => (
            <Card key={s.id} onClick={() => setEdit(s)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ fontSize: 15 }}>{s.nom || "Joueur repéré"}</strong>
                {s.poste && <Pastille bg={C.bleu} color="#fff">{s.poste}</Pastille>}
              </div>
              {s.equipe && <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 6 }}><ArrowRightLeft size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.equipe}</div>}
              {s.qualites && <div style={{ fontSize: 13.5 }}>{s.qualites}</div>}
            </Card>
          ))}
        </div>
      )}

      {edit && <EditDetection fiche={edit} onClose={() => setEdit(null)}
        onSave={(s) => { mutate((d) => { s.id ? (d.scouting[d.scouting.findIndex((x) => x.id === s.id)] = s) : d.scouting.push({ ...s, id: uid(), date: hoyISO() }); return d; }); setEdit(null); }}
        onDelete={edit.id ? () => { mutate((d) => { d.scouting = d.scouting.filter((x) => x.id !== edit.id); return d; }); setEdit(null); } : null} />}
    </div>
  );
}

function EditDetection({ fiche, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ ...fiche });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={fiche.id ? "Talent repéré" : "Nouveau talent repéré"} onClose={onClose}
      footer={<>
        <Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>
        {onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}
      </>}>
      <Field label="Nom du joueur"><Inp value={f.nom || ""} onChange={(e) => set("nom", e.target.value)} /></Field>
      <Field label="Équipe adverse"><Inp value={f.equipe || ""} onChange={(e) => set("equipe", e.target.value)} placeholder="Club rencontré" /></Field>
      <Field label="Poste">
        <Sel value={f.poste || ""} onChange={(e) => set("poste", e.target.value)}>
          <option value="">Choisir un poste</option>
          {POSTES.map((p) => <option key={p}>{p}</option>)}
        </Sel>
      </Field>
      <Field label="Qualités observées">
        <textarea value={f.qualites || ""} onChange={(e) => set("qualites", e.target.value)} rows={4}
          placeholder="Vitesse, qualité technique, vision du jeu, état d'esprit..." style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
    </Modal>
  );
}
