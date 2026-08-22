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
function Sauvegarde({ db, mutate, cat, demo, onClose }) {
  const [aImporter, setAImporter] = useState(null);
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

  return (
    <Modal title="Sauvegarde des données" onClose={onClose}>
      {demo && (
        <div style={{ fontSize: 12.5, color: C.encre, background: "#FFF7E6", border: "1px solid #F0DBA8", borderRadius: 10, padding: 11, marginBottom: 14, lineHeight: 1.5 }}>
          Mode essai : tes données sont enregistrées uniquement sur cet appareil. Exporte régulièrement pour ne rien perdre, ou branche la base en ligne (Supabase) pour une sauvegarde partagée et automatique.
        </div>
      )}

      <div style={{ fontWeight: 800, marginBottom: 6 }}>Exporter</div>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 8 }}>Télécharge un fichier de sauvegarde {demo ? "de toutes les catégories" : `de la catégorie ${cat}`}.</div>
      <Btn variant="accent" full onClick={exporter}><FileDown size={16} /> Télécharger la sauvegarde</Btn>

      <div style={{ fontWeight: 800, margin: "18px 0 6px" }}>Restaurer</div>
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
  const [note, setNote] = useState("");
  const toggle = (b) => setMinibus((a) => a.includes(b) ? a.filter((x) => x !== b) : [...a, b]);
  return (
    <Modal title="Nouvelle demande de transport" onClose={onClose}
      footer={<Btn variant="accent" full disabled={!date} onClick={() => onSubmit({ date, destination, mode, minibus, loueur, note })}><Send size={16} /> Envoyer la demande</Btn>}>
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
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Loueur</div>
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
      <Field label="Précision (optionnel)"><Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="Horaire de départ, nombre de places..." /></Field>
    </Modal>
  );
}

function resumeTransport(x) {
  if (x.mode === "Minibus club") return `Minibus ${(x.minibus || []).join(", ") || "à préciser"}`;
  if (x.mode === "Bus en location") return `Bus en location ${x.loueur || ""}`.trim();
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
  const aVenir = db.matches.filter((m) => m.cat === cat && (!m.date || m.date >= todayStr))
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
  else if (cat === "N3") { niveau = "National 3 (Ligue Bourgogne-Franche-Comté)"; siteSource = "le site de la Ligue (bfc.fff.fr)"; }
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

  function ligneDemande(dem, recue) {
    return (
      <Card key={dem.id} style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: C.gris, fontWeight: 700 }}>
            {recue ? `Demandé par ${dem.demandeurCat}` : `Vers ${dem.joueurCat}`}{dem.date ? ` · ${fmtDate(dem.date)}` : ""}
          </span>
          <StatutPastille statut={dem.statut} />
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
const CLUB_LONG = "FC SOCHAUX-MONTBÉLIARD";

/* ============================================================
   Données de référence
   ============================================================ */
const GROUPES = ["École de foot", "Pré-formation", "Formation", "PRO", "Loisirs", "Féminines"];
const CATEGORIES = [
  { id: "U7", type: 4, groupe: "École de foot" }, { id: "U8", type: 5, groupe: "École de foot" }, { id: "U9", type: 8, groupe: "École de foot" },
  { id: "U10", type: 8, groupe: "École de foot" }, { id: "U11", type: 8, groupe: "École de foot" }, { id: "U12", type: 8, groupe: "École de foot" },
  { id: "U13", type: 8, groupe: "École de foot" },
  { id: "U14", type: 11, groupe: "Pré-formation" }, { id: "U15", type: 11, groupe: "Pré-formation" },
  { id: "6e/5e", type: 8, college: "Collège Hautes Vignes", groupe: "École de foot" },
  { id: "4e/3e", type: 8, college: "Collège Hautes Vignes", groupe: "Pré-formation" },
  { id: "U17 NAT", type: 11, groupe: "Formation" }, { id: "U19 NAT", type: 11, groupe: "Formation" },
  { id: "N3", type: 11, groupe: "Formation" }, { id: "Ligue 2", type: 11, groupe: "PRO" },
  { id: "Foot loisirs", type: 11, groupe: "Loisirs" },
  { id: "U7F", type: 4, groupe: "Féminines" }, { id: "U8F", type: 5, groupe: "Féminines" }, { id: "U9F", type: 8, groupe: "Féminines" }, { id: "U10F", type: 8, groupe: "Féminines" },
  { id: "U11F", type: 8, groupe: "Féminines" }, { id: "U13F", type: 8, groupe: "Féminines" }, { id: "U15F", type: 11, groupe: "Féminines" },
  { id: "U18F", type: 11, groupe: "Féminines" }, { id: "U19F NAT", type: 11, groupe: "Féminines" }, { id: "SENIORS F", type: 11, groupe: "Féminines" },
];

// Catégories qu'une catégorie peut demander (joueur surclassé de deux ans en dessous)
const VOISINS_SPECIAUX = {
  "U17 NAT": ["U15"],
  "U19 NAT": ["U17 NAT"],
  "N3": ["U19 NAT"],
  "Ligue 2": ["N3"],
  "U18F": ["U15F"],
  "U19F NAT": ["U18F"],
  "SENIORS F": ["U19F NAT"],
  "4e/3e": ["6e/5e"],
};
function voisinsDemandables(cat) {
  if (VOISINS_SPECIAUX[cat]) return VOISINS_SPECIAUX[cat];
  const m = /^U(\d+)(F?)$/.exec(cat || "");
  if (m) {
    const cible = `U${+m[1] - 2}${m[2]}`;
    if (CATEGORIES.some((x) => x.id === cible)) return [cible];
  }
  return [];
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
const MODES_TRANSPORT = ["Minibus club", "Bus en location", "Voitures des parents"];
const LOUEURS = ["ADJ", "Hertz"];
const ROLES_ENCADREMENT = ["Éducateur", "Dirigeant", "Délégué", "Arbitre"];

const TERRAINS = ["Synthétique centre", "Synthétique dôme", "Herbe centre (nouveau synthétique)", "Herbe villa"];
const VESTIAIRES = ["1", "2", "3", "4", "5", "Villa 1", "Villa 2"];

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

const DEMO_KEY = "fcsm-demo-db";
async function loadLocal() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(DEMO_KEY, true);
      if (r && r.value) return { ...EMPTY_DB, ...JSON.parse(r.value) };
    }
  } catch (e) { /* premier lancement */ }
  return { ...EMPTY_DB };
}
async function saveLocal(db) {
  try { if (typeof window !== "undefined" && window.storage) await window.storage.set(DEMO_KEY, JSON.stringify(db), true); }
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
  doc.text("ÉCOLE DE FOOT   ·   FICHE JOUEUR", M, 55);
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

  section("Jonglages (max 50)");
  const jo = p.jonglages || {};
  paires([
    ["Pied fort", jo.fort],
    ["Pied faible", jo.faible],
    ["Tête", jo.tete],
  ]);

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

  const assi = assiduiteJoueur(p, db, saison);
  section("Assiduité");
  paires([
    ["Matchs joués", assi.matchs],
    ["Présences", assi.presences],
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
  const [reunionsDb, setReunionsDb] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [showDemandes, setShowDemandes] = useState(false);
  const [showClassement, setShowClassement] = useState(false);
  const [showTransport, setShowTransport] = useState(false);
  const [showOrganisation, setShowOrganisation] = useState(false);
  const [showSauvegarde, setShowSauvegarde] = useState(false);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showAcces, setShowAcces] = useState(false);
  const [showProgramme, setShowProgramme] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showBilan, setShowBilan] = useState(false);
  const [showTournois, setShowTournois] = useState(false);
  const [showReunions, setShowReunions] = useState(false);
  const [showCalendrier, setShowCalendrier] = useState(false);
  const [groupeSel, setGroupeSel] = useState(null);
  const [demo, setDemo] = useState(false);
  const cacheRef = useRef({});

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
        const cats = role === "direction" ? CATEGORIES.map((c) => c.id) : (aff || []).map((a) => a.categorie);
        setProfil({ role, nom: prof && prof.nom, cats });
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
    if (!demo) return;
    let annule = false;
    loadLocal().then((d) => { if (!annule) { setDb(d); setCat((p) => p || "U7"); } });
    return () => { annule = true; };
  }, [demo]);

  useEffect(() => {
    if (demo || !session) return;
    let annule = false;
    (async () => {
      try { const rd = await loadCat("__REUNIONS__"); if (!annule) setReunionsDb({ reunions: rd.reunions || [] }); }
      catch (e) { if (!annule) setReunionsDb({ reunions: [] }); }
    })();
    return () => { annule = true; };
  }, [session, demo]);

  function mutate(fn) {
    setDb((prev) => {
      const next = fn(structuredClone(prev));
      if (demo) { saveLocal(next); }
      else { cacheRef.current[cat] = next; if (session && cat) saveCat(cat, next, session.user.id).catch((e) => console.error("Sauvegarde:", e)); }
      return next;
    });
  }

  function mutateReunions(fn) {
    setReunionsDb((prev) => {
      const next = fn(structuredClone(prev || { reunions: [] }));
      if (session) saveCat("__REUNIONS__", next, session.user.id).catch((e) => console.error("Sauvegarde réunions:", e));
      return next;
    });
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
  const reunionsSource = demo ? ((db && db.reunions) || []) : ((reunionsDb && reunionsDb.reunions) || []);
  const mutateReu = demo ? mutate : mutateReunions;
  const cats = demo ? CATEGORIES.map((c) => c.id) : profil.cats;
  const sousTitre = demo ? "" : (profil && profil.role === "direction" ? " · DIRECTION" : "");
  const peutValider = demo || (profil && (profil.role === "responsable" || profil.role === "direction"));
  const estAdmin = demo || (profil && profil.role === "direction");
  const groupesDispo = GROUPES.filter((g) => CATEGORIES.some((c) => c.groupe === g && cats.includes(c.id)));
  const groupeActif = (groupeSel && groupesDispo.includes(groupeSel)) ? groupeSel
    : (catInfo && groupesDispo.includes(catInfo.groupe) ? catInfo.groupe : groupesDispo[0]);

  const TABS = [
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
              <div style={{ fontSize: 10.5, color: C.jaune, fontWeight: 700, letterSpacing: 2.2, marginTop: 3 }}>
                ÉCOLE DE FOOT{sousTitre}
              </div>
            </div>
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
        {tab === "accueil" && <Accueil db={{ ...db, reunions: reunionsSource }} cat={cat} setTab={setTab} onScores={() => setShowScores(true)} onDemandes={() => setShowDemandes(true)} onClassement={() => { const u = ((db.config && db.config.classement) || {})[cat]; const dir = ((db.config && db.config.classementDirect) || {})[cat]; if (u && dir) window.open(u, "_blank", "noopener"); setShowClassement(true); }} onTransport={() => setShowTransport(true)} onOrganisation={() => setShowOrganisation(true)} onSauvegarde={() => setShowSauvegarde(true)} onPlanning={() => setShowPlanning(true)} onAcces={estAdmin ? () => setShowAcces(true) : null} onProgramme={() => setShowProgramme(true)} onDocuments={() => setShowDocs(true)} onBilan={() => setShowBilan(true)} onReunions={() => setShowReunions(true)} onCalendrier={() => setShowCalendrier(true)} monNom={demo ? "Karim Boukrourou" : ((profil && profil.nom) || "")} />}
        {tab === "effectif" && <Effectif players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} />}
        {tab === "compo" && <Compo players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} />}
        {tab === "matchs" && <Matchs players={players} cat={cat} catInfo={catInfo} db={db} mutate={mutate} peutValider={peutValider} />}
        {tab === "entrainements" && <Entrainements players={players} cat={cat} db={db} mutate={mutate} />}
        {tab === "detection" && <Detection cat={cat} db={db} mutate={mutate} />}
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

      {showScores && <ScoresWeekend onClose={() => setShowScores(false)} localDb={demo ? db : null} />}
      {showDemandes && <Demandes demo={demo} db={db} mutate={mutate} cat={cat} session={session} onClose={() => setShowDemandes(false)} />}
      {showClassement && <Classement cat={cat} db={db} mutate={mutate} onClose={() => setShowClassement(false)} />}
      {showTransport && <Transports db={db} mutate={mutate} cat={cat} onClose={() => setShowTransport(false)} />}
      {showOrganisation && <OrganisationMatchs db={db} mutate={mutate} cat={cat} peutValider={peutValider} onClose={() => setShowOrganisation(false)} />}
      {showSauvegarde && <Sauvegarde db={db} mutate={mutate} cat={cat} demo={demo} onClose={() => setShowSauvegarde(false)} />}
      {showPlanning && <Planning db={db} mutate={mutate} cats={cats} profil={profil} peutValider={peutValider} onClose={() => setShowPlanning(false)} />}
      {showAcces && <AccesSecteurs db={db} mutate={mutate} estAdmin={estAdmin} onClose={() => setShowAcces(false)} />}
      {showProgramme && <ProgrammeSemaine db={db} onClose={() => setShowProgramme(false)} />}
      {showDocs && <DocumentsAdmin players={players} cat={cat} onClose={() => setShowDocs(false)} />}
      {showBilan && <BilanEquipe db={db} players={players} cat={cat} onClose={() => setShowBilan(false)} onTournois={() => setShowTournois(true)} />}
      {showTournois && <Tournois db={db} mutate={mutate} cat={cat} onClose={() => setShowTournois(false)} />}
      {showReunions && <Reunions db={{ reunions: reunionsSource, acces: (db && db.acces) || [] }} mutate={mutateReu} onClose={() => setShowReunions(false)} />}
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
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!email.trim() || !mdp) { setMsg("Renseigne ton email et ton mot de passe."); return; }
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
          <div style={{ fontSize: 11, color: C.jaune, fontWeight: 700, letterSpacing: 2.4, marginTop: 4 }}>ÉCOLE DE FOOT</div>
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
              <Field label="Adresse email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@club.fr" /></Field>
              <Field label="Mot de passe"><Inp type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="6 caractères minimum" /></Field>
              <Btn variant="primary" full onClick={go} style={{ marginTop: 6 }}>{busy ? "Patiente..." : (mode === "connexion" ? "Se connecter" : "Créer le compte")}</Btn>
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
function Accueil({ db, cat, setTab, onScores, onDemandes, onClassement, onTransport, onOrganisation, onSauvegarde, onPlanning, onAcces, onProgramme, onDocuments, onBilan, onReunions, onCalendrier, monNom }) {
  const players = db.players.filter((p) => p.cat === cat);
  const d0 = new Date();
  const todayStr = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  const prochainMatch = db.matches.filter((m) => m.cat === cat && m.date && m.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))[0];
  const blesses = db.injuries.filter((i) => !i.fini && players.some((p) => p.id === i.joueurId)).length;
  const nbOrga = db.matches.filter((m) => {
    if (m.cat !== cat || !m.date || m.date < todayStr) return false;
    const t = m.transport || {}, e = m.encadrement || {}, r = m.reservation || {};
    const manque = (m.lieu === "Extérieur" && !t.statut) || !e.arbitre || (m.lieu === "Domicile" && r.statut !== "validee");
    return manque;
  }).length;

  const alerteDocs = players.filter((p) => p.licenceStatut !== "Valide" || statutMedical(p).urgence > 0).length;
  const alerteReunions = (db.reunions || []).filter((r) => (r.date || "") >= todayStr && (r.participants || []).some((p) => p.nom === monNom)).length;

  const cartes = [
    { titre: "Scores du week-end", sous: "Résultats de toutes les catégories", icon: Trophy, action: onScores, accent: true },
    { titre: "Demandes de joueurs", sous: "Demander un joueur d'une autre catégorie", icon: ArrowRightLeft, action: onDemandes },
    { titre: "Classement du championnat", sous: "District, Ligue, National et Ligue 2 en direct", icon: ListOrdered, action: onClassement },
    { titre: "Demande de transport", sous: "Minibus, bus en location ou voitures, à l'avance", icon: Bus, action: onTransport },
    { titre: "Organisation des matchs", sous: "Terrain, vestiaires, transport et encadrement", icon: MapPin, action: onOrganisation, badge: nbOrga },
    { titre: "Programme de la semaine", sous: "Récapitulatif des matchs à imprimer", icon: ClipboardList, action: onProgramme },
    { titre: "Documents administratifs", sous: "Licences et contrôle médical à surveiller", icon: ShieldAlert, action: onDocuments, badge: alerteDocs },
    { titre: "Bilan de saison de l'équipe", sous: "Résultats, buteurs et passeurs de la saison", icon: Trophy, action: onBilan },
    { titre: "Réunions", sous: "Programmer les réunions et recueillir les présences", icon: Users, action: onReunions, badge: alerteReunions },
    { titre: "Calendrier du club", sous: "Tous les événements, toutes catégories réunies", icon: CalendarDays, action: onCalendrier },
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

      {(alerteReunions > 0 || alerteDocs > 0) && (
        <div style={{ background: "#FFF3DA", border: "1px solid #EBD3AE", borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "#B87A2B", fontSize: 13.5, marginBottom: 6 }}><Bell size={16} /> À ne pas oublier</div>
          {alerteReunions > 0 && (
            <div onClick={onReunions} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontSize: 13.5, color: C.encre }}>
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
        </div>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 800, color: C.gris, letterSpacing: 1, marginBottom: 10 }}>TABLEAU DE BORD {cat}</div>
      <div style={{ display: "grid", gap: 11 }}>
        {cartes.filter((c) => c.action).map((c) => {
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

/* Assiduite d'un joueur sur une saison : matchs joues, presences, absences, retards */
function assiduiteJoueur(p, db, saison) {
  let matchs = 0, presences = 0, absences = 0, retards = 0, jaunes = 0, rouges = 0;
  (db.matches || []).forEach((m) => {
    if (m.cat !== p.cat) return;
    if (saison && saisonDe(m.date) !== saison) return;
    if (m.tempsJeu && m.tempsJeu[p.id]) matchs++;
    if (m.jaunes && m.jaunes[p.id]) jaunes += (+m.jaunes[p.id] || 0);
    if (m.rouges && m.rouges[p.id]) rouges += 1;
  });
  (db.trainings || []).forEach((t) => {
    if (t.cat !== p.cat) return;
    if (saison && saisonDe(t.date) !== saison) return;
    const st = t.presence && t.presence[p.id];
    if (st === "present" || st === "retard") presences++;
    if (st === "absent") absences++;
    if (st === "retard") retards++;
  });
  return { matchs, presences, absences, retards, jaunes, rouges };
}

function Effectif({ players, cat, catInfo, db, mutate }) {
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
        <Btn variant="accent" onClick={() => setEdit({ cat })}><Plus size={18} /></Btn>
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
            return (
              <Card key={p.id} onClick={() => setFiche(p.id)} style={{ display: "flex", alignItems: "center", gap: 13, padding: 12 }}>
                <div style={{ position: "relative", flex: "0 0 auto" }}>
                  <Avatar p={p} size={50} />
                  {p.numero != null && p.numero !== "" && (
                    <span style={{ position: "absolute", bottom: -3, right: -3, background: C.jaune, color: C.bleuNuit, fontSize: 11, fontWeight: 900, minWidth: 19, height: 19, borderRadius: 10, display: "grid", placeItems: "center", border: "2px solid #fff" }}>{p.numero}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.prenom} {p.nom} {bless && <HeartPulse size={14} color={C.rouge} style={{ verticalAlign: "middle" }} />}</div>
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

      {players.length > 0 && (
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

      {ficheJoueur && <FicheJoueur p={ficheJoueur} db={db} mutate={mutate} onClose={() => setFiche(null)} onEdit={() => { setEdit(ficheJoueur); setFiche(null); }} onDelete={() => {
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

function FicheJoueur({ p, db, mutate, onClose, onEdit, onDelete }) {
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
      footer={
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
        {[["Matchs", assi.matchs], ["Minutes", stats.minutes], ["Buts", stats.buts], ["Passes", stats.passes], ["Note", stats.moy != null ? stats.moy.toFixed(1) : "-"]].map(([l, v]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 4px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.bleu }}>{v}</div>
            <div style={{ fontSize: 9.5, color: C.gris, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, margin: "0 0 6px" }}>Assiduité</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[["Présences", assi.presences, C.vert], ["Absences", assi.absences, C.rouge], ["Retards", assi.retards, C.jauneFonce]].map(([l, v, col]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div>
            <div style={{ fontSize: 10.5, color: C.gris, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      {(cartonsActifs || assi.jaunes > 0 || assi.rouges > 0) && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, margin: "0 0 6px" }}>Discipline</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
            {[["Cartons jaunes", assi.jaunes, "#E3B505"], ["Cartons rouges", assi.rouges, C.rouge]].map(([l, v, col]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "12px 6px", textAlign: "center", border: `1px solid ${C.grisClair}` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: col }}>{v}</div>
                <div style={{ fontSize: 10.5, color: C.gris, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
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
    parentNom: "", parentTel: "", parentEmail: "", ...joueur,
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
        <Field label="Numéro"><Inp type="number" inputMode="numeric" value={f.numero} onChange={(e) => set("numero", e.target.value)} /></Field>
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
        <Field label="Contrôle médical de la saison">
          <Sel value={f.medicalSaison === saisonCourante() ? (f.medicalStatut || "") : ""} onChange={(e) => { const v = e.target.value; set("medicalStatut", v); set("medicalSaison", v ? saisonCourante() : ""); }}>
            <option value="">À faire</option>
            <option value="questionnaire">Questionnaire de santé fait (dispensé de certificat)</option>
            <option value="certificat">Certificat médical fourni</option>
          </Sel>
        </Field>
        <Field label="Club"><Inp value={f.club} onChange={(e) => set("club", e.target.value)} /></Field>
      </div>

      <div style={{ fontWeight: 800, color: C.bleu, fontSize: 13, margin: "8px 0" }}>Jonglages (max 50)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Field label="Pied fort"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).fort} onChange={(e) => setJo("fort", e.target.value)} /></Field>
        <Field label="Pied faible"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).faible} onChange={(e) => setJo("faible", e.target.value)} /></Field>
        <Field label="Tête"><Inp type="number" inputMode="numeric" value={(f.jonglages || {}).tete} onChange={(e) => setJo("tete", e.target.value)} /></Field>
      </div>

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
const FORMATS_MULTI = { U13: [8, 11], "Foot loisirs": [11, 8] };
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
  const maxConvoques = typeFoot === 8 ? 12 : typeFoot === 11 ? 16 : formation.length + 8;
  const maxRempl = maxConvoques - formation.length;

  function changerFormat(fmt) {
    mutate((d) => {
      const lu = d.lineups[key] || { slots: {}, remplacants: [] };
      lu.format = fmt;
      lu.formation = Object.keys(FORMATIONS[fmt])[0];
      lu.slots = {};
      d.lineups[key] = lu;
      return d;
    });
  }
  function setFormation(name) {
    mutate((d) => {
      const ex = d.lineups[key] || {};
      d.lineups[key] = { formation: name, slots: ex.slots || {}, remplacants: ex.remplacants || [], capitaine: ex.capitaine || null, format: ex.format };
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
              </div>
              <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.55)", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p ? (p.prenom && p.nom ? `${p.prenom[0]}. ${p.nom}` : (p.nom || p.prenom)) : slot.l}
              </span>
            </button>
          );
        })}
      </div>

      {/* Remplaçants */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 7 }}><ArrowRightLeft size={17} color={C.bleu} /> Remplaçants ({remplacants.length}/{maxRempl})</div>
        {remplacants.length < maxRempl && <Btn variant="accent" size="sm" onClick={() => setPickRempl(true)}><Plus size={15} /> Ajouter</Btn>}
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
              <Btn variant="danger" full style={{ marginBottom: 12 }} onClick={() => assign(pick, null)}>
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
                return (
                  <button key={p.id} onClick={() => assign(pick, p.id)} style={{
                    display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 12,
                    border: `1px solid ${C.grisClair}`, background: "#fff", cursor: "pointer", textAlign: "left",
                  }}>
                    <Avatar p={p} size={38} radius={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div>
                      <div style={{ fontSize: 12, color: C.gris }}>{p.poste || "Poste libre"}</div>
                    </div>
                    {placeAilleurs && <Pastille bg={C.grisClair} color={C.gris}>déjà placé</Pastille>}
                    {estRempl && <Pastille bg="#FFF3DA" color={C.jauneFonce}>banc</Pastille>}
                  </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {pickRempl && (
        <Modal title placeholder onClose={() => setPickRempl(false)}>
          <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 10 }}>Banc jusqu'à {maxRempl} joueurs (convoqués {convoques}/{maxConvoques}).</div>
          {benchDispo.length === 0 ? (
            <Empty icon={<Users size={24} color={C.gris} />} text="Aucun joueur disponible" sub="Tous les joueurs sont déjà titulaires ou sur le banc" />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {benchDispo.map((p) => (
                <button key={p.id} onClick={() => ajouterRemplacant(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 12,
                  border: `1px solid ${C.grisClair}`, background: "#fff", cursor: "pointer", textAlign: "left",
                }}>
                  <Avatar p={p} size={38} radius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: 12, color: C.gris }}>{p.poste || "Poste libre"}</div>
                  </div>
                </button>
              ))}
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
function Matchs({ players, cat, catInfo, db, mutate, peutValider }) {
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

      {open && <RapportMatch match={open} players={players} db={db} mutate={mutate} peutValider={peutValider}
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
  const champs = [
    { role: "Éducateur", key: "educateur" },
    { role: "Dirigeant", key: "dirigeant" },
    { role: "Délégué", key: "delegue" },
    { role: "Arbitre", key: "arbitre" },
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
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 6 }}>Loueur</div>
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
      {champs.map(({ role, key }) => {
        const gens = parRole(role);
        return (
          <Field key={key} label={role}>
            <Sel value={e[key] || ""} onChange={(ev) => majEncadrement({ [key]: ev.target.value })}>
              <option value="">Non désigné</option>
              {gens.map((g) => <option key={g.id}>{g.nom}</option>)}
              {e[key] && !gens.some((g) => g.nom === e[key]) ? <option value={e[key]}>{e[key]}</option> : null}
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


function RapportMatch({ match, players, db, mutate, onClose, onEdit, onDelete, peutValider }) {
  const [noteFor, setNoteFor] = useState(null);
  const [orga, setOrga] = useState(false);
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
      if (m.rouges[joueurId]) delete m.rouges[joueurId]; else m.rouges[joueurId] = 1;
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

  const ligne = (p) => {
    const b = cur.buteurs?.[p.id] || 0, a = cur.passeurs?.[p.id] || 0;
    const t = cur.tempsJeu?.[p.id] ?? "";
    const note = cur.notes?.[p.id]?.note;
    const cj = cur.jaunes?.[p.id] || 0;
    const cr = !!cur.rouges?.[p.id];
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
      <textarea value={cur.rapport || ""} onChange={(e) => setRapport(e.target.value)} rows={5}
        placeholder="Analyse de la rencontre, points forts, axes de progrès..."
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />

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
  const existing = db.matches.find((x) => x.id === match.id).notes?.[player.id] || {};
  const [n, setN] = useState({ note: existing.note || "", commentaire: existing.commentaire || "", ...AXES.reduce((o, a) => ({ ...o, [a.k]: existing[a.k] || "" }), {}) });

  function save() {
    mutate((d) => {
      const m = d.matches.find((x) => x.id === match.id);
      m.notes = m.notes || {};
      m.notes[player.id] = { ...n };
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

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
            <Btn variant="primary" size="sm" onClick={() => setRecap(true)}><ClipboardList size={16} /> Récap présences</Btn>
            <Btn variant="ghost" size="sm" onClick={() => setEdit({ cat, presence: {} })}><Plus size={16} /> Séance ponctuelle</Btn>
          </div>

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
                const nbPres = pres.filter((x) => x === "present").length;
                const nbAbs = pres.filter((x) => x === "absent").length;
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
            <Btn variant="accent" size="sm" onClick={() => setBlessure({ cat })}><Plus size={16} /> Blessure</Btn>
          </div>
          {blessures.length === 0 ? (
            <Empty icon={<HeartPulse size={26} color={C.gris} />} text="Aucune blessure" sub="Tant mieux pour le groupe" />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {blessures.map((b) => {
                const p = db.players.find((x) => x.id === b.joueurId);
                return (
                  <Card key={b.id} onClick={() => setBlessure(b)} style={{ borderColor: b.fini ? C.grisClair : "#F3C9C9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{p ? `${p.prenom} ${p.nom}` : "Joueur supprimé"}</strong>
                      <Pastille bg={b.fini ? "#E2F4E9" : "#FBE3E3"} color={b.fini ? C.vert : C.rouge}>{b.fini ? "Rétabli" : "En cours"}</Pastille>
                    </div>
                    <div style={{ fontSize: 13, color: C.gris, marginTop: 5 }}>
                      {b.zone || "Blessure"} · début {b.debut ? new Date(b.debut + "T00:00:00").toLocaleDateString("fr-FR") : "?"} · arrêt estimé {b.duree || "?"}
                    </div>
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
      if (st === "present") pr++; else if (st === "retard") { pr++; re++; } else if (st === "absent") ab++; else if (st === "blesse") bl++;
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
          <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11.5, fontWeight: 700, color: C.gris }}>
            <span style={{ color: C.vert }}>● Présents</span>
            <span style={{ color: C.rouge }}>● Absents</span>
            <span style={{ color: C.jauneFonce }}>● Blessés</span>
            <span style={{ color: "#C67C3C" }}>● Retards</span>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(({ p, pr, ab, bl, re, taux }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}` }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.prenom} {p.nom}</div>
                <Pastille bg="#E2F4E9" color={C.vert}>{pr}</Pastille>
                <Pastille bg="#FBE3E3" color={C.rouge}>{ab}</Pastille>
                <Pastille bg="#FFF3DA" color={C.jauneFonce}>{bl}</Pastille>
                <Pastille bg="#FBEAD9" color="#C67C3C">{re}</Pastille>
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
  const opts = [["present", "Présent", C.vert], ["absent", "Absent", C.rouge], ["blesse", "Blessé", C.jauneFonce], ["retard", "Retard", "#C67C3C"]];
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
      <div style={{ fontWeight: 800, margin: "8px 0", color: C.bleu }}>Présences</div>
      {players.length === 0 ? <Empty icon={<Users size={22} color={C.gris} />} text="Aucun joueur" /> :
        <div style={{ display: "grid", gap: 8 }}>
          {players.map((p) => (
            <div key={p.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.grisClair}` }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{p.prenom} {p.nom}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {opts.map(([val, lab, col]) => {
                  const on = f.presence[p.id] === val;
                  return (
                    <button key={val} onClick={() => setP(p.id, on ? null : val)} style={{
                      flex: 1, border: "none", cursor: "pointer", borderRadius: 9, padding: "7px 4px", fontSize: 12, fontWeight: 800,
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
  const groupes = { present: [], absent: [], blesse: [] };
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
      {bloc("Blessés", groupes.blesse, C.jauneFonce)}
    </Modal>
  );
}

function EditBlessure({ blessure, players, onClose, onSave, onDelete }) {
  const [f, setF] = useState({ fini: false, ...blessure });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={blessure.id ? "Suivi de blessure" : "Nouvelle blessure"} onClose={onClose}
      footer={<>
        <Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>
        {onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}
      </>}>
      <Field label="Joueur">
        <Sel value={f.joueurId || ""} onChange={(e) => set("joueurId", e.target.value)}>
          <option value="">Choisir un joueur</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
        </Sel>
      </Field>
      <Field label="Zone / nature"><Inp value={f.zone || ""} onChange={(e) => set("zone", e.target.value)} placeholder="Cheville, ischio, genou..." /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Date de début"><Inp type="date" value={f.debut || ""} onChange={(e) => set("debut", e.target.value)} /></Field>
        <Field label="Durée d'arrêt estimée"><Inp value={f.duree || ""} onChange={(e) => set("duree", e.target.value)} placeholder="3 semaines..." /></Field>
      </div>
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
  const [equipe, setEquipe] = useState(actuel ? actuel.equipe : "");
  const [activite, setActivite] = useState((actuel && actuel.activite) || "match");
  return (
    <Modal title={`${typeLabel} ${colonne}`} onClose={onClose}
      footer={
        <>
          <Btn variant="accent" full disabled={!equipe.trim()} onClick={() => onSave(equipe.trim(), activite)}><Save size={16} /> {peutValider ? "Attribuer" : "Demander"}</Btn>
          {actuel && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}
        </>
      }>
      <div style={{ fontSize: 12.5, color: C.gris, marginBottom: 12 }}>Créneau de {creneau}. {peutValider ? "En tant que responsable, ton attribution est directement validée." : "Ta demande sera à valider par la direction."}</div>

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
      <Field label="Équipe"><Inp value={equipe} onChange={(e) => setEquipe(e.target.value)} placeholder="FCSM U13 ou équipe adverse" /></Field>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 8 }}>Raccourcis équipes du club</div>
      {GROUPES.map((g) => {
        const catsG = cats.filter((cat) => { const ci = CATEGORIES.find((x) => x.id === cat); return ci && ci.groupe === g; });
        if (catsG.length === 0) return null;
        return (
          <div key={g} style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.bleu, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{g}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {catsG.map((cat) => (
                <button key={cat} onClick={() => setEquipe(`FCSM ${cat}`)} style={{
                  border: `1px solid ${C.grisClair}`, cursor: "pointer", borderRadius: 999, padding: "6px 12px",
                  fontSize: 12.5, fontWeight: 700, background: "#fff", color: C.bleu,
                }}>{cat}</button>
              ))}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

function Planning({ db, mutate, cats, profil, peutValider, onClose }) {
  const [type, setType] = useState("vestiaires");
  const d0 = new Date();
  const [date, setDate] = useState(`${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`);
  const [edit, setEdit] = useState(null);
  const [gererCreneaux, setGererCreneaux] = useState(false);
  const [nvCreneau, setNvCreneau] = useState("");
  const [editCreneau, setEditCreneau] = useState(null);
  const [nvHeure, setNvHeure] = useState("");

  const colonnes = type === "vestiaires" ? VESTIAIRES : TERRAINS;
  const typeLabel = type === "vestiaires" ? "Vestiaire" : "Terrain";
  const creneaux = (db.planning && db.planning.creneaux) || CRENEAUX_DEFAUT;
  const data = (db.planning && db.planning[type] && db.planning[type][date]) || {};
  const cle = (cr, col) => `${cr}__${col}`;
  const moi = (profil && profil.nom) || "Éducateur";

  function ecrire(cr, col, valeur) {
    mutate((d) => {
      d.planning = d.planning || { creneaux: CRENEAUX_DEFAUT, vestiaires: {}, terrains: {} };
      d.planning[type] = d.planning[type] || {};
      d.planning[type][date] = d.planning[type][date] || {};
      if (valeur === null) delete d.planning[type][date][cle(cr, col)];
      else d.planning[type][date][cle(cr, col)] = valeur;
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
          <div style={{ flex: 1 }}><Inp type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <Btn variant="ghost" onClick={() => setGererCreneaux(true)}><Timer size={16} /> Créneaux</Btn>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11.5, fontWeight: 700, color: C.gris }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#E2F4E9", border: "1px solid #BFE3CD", display: "inline-block" }} /> Validé</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#FBEAD9", border: "1px solid #EBD3AE", display: "inline-block" }} /> En attente</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#fff", border: `1px solid ${C.grisClair}`, display: "inline-block" }} /> Libre</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        <div style={{ overflowX: "auto", border: `1px solid ${C.grisClair}`, borderRadius: 12, background: "#fff" }}>
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
                      <td key={col} onClick={() => setEdit({ cr, col })} style={{
                        padding: 5, borderTop: `1px solid ${C.grisClair}`, borderLeft: `1px solid ${C.grisClair}`, cursor: "pointer", verticalAlign: "middle",
                      }}>
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
        </div>
        <div style={{ fontSize: 11.5, color: C.gris, marginTop: 10, lineHeight: 1.5 }}>Touche une case pour réserver un {typeLabel.toLowerCase()}. Fais défiler le tableau sur le côté pour voir toutes les colonnes.</div>
      </div>

      {edit && (() => {
        const actuel = data[cle(edit.cr, edit.col)];
        return (
          <EditCasePlanning
            typeLabel={typeLabel} colonne={edit.col} creneau={edit.cr} actuel={actuel} cats={cats} peutValider={peutValider} avecActivite={type === "terrains"}
            onClose={() => setEdit(null)}
            onSave={(equipe, activite) => { ecrire(edit.cr, edit.col, { equipe, activite: type === "terrains" ? activite : undefined, statut: peutValider ? "valide" : "attente", demandeur: moi }); setEdit(null); }}
            onValider={() => { ecrire(edit.cr, edit.col, { ...actuel, statut: "valide" }); setEdit(null); }}
            onDelete={() => { ecrire(edit.cr, edit.col, null); setEdit(null); }}
          />
        );
      })()}

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

  const ordreSecteur = { "PRO": 0, "Formation": 1, "Pré-formation": 2, "École de foot": 3, "Loisirs": 4, "Féminines": 5 };
  const secteurDe = (cat) => { const ci = CATEGORIES.find((x) => x.id === cat); return ci ? ci.groupe : ""; };
  const rangSecteur = (cat) => { const r = ordreSecteur[secteurDe(cat)]; return r == null ? 9 : r; };
  const ageDe = (cat) => { const m = /U(\d+)/.exec(cat || ""); if (m) return +m[1]; if (["PRO", "N3", "Ligue 2"].includes(cat) || (cat || "").includes("SENIORS")) return 99; return 50; };
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


function DocumentsAdmin({ players, cat, onClose }) {
  const lignes = players.map((p) => {
    const sc = statutMedical(p);
    const licProb = p.licenceStatut !== "Valide";
    const urgence = Math.max(sc.urgence, licProb ? 1 : 0);
    return { p, sc, licProb, urgence };
  }).sort((a, b) => b.urgence - a.urgence || (a.p.nom || "").localeCompare(b.p.nom || ""));
  const aSurveiller = lignes.filter((l) => l.urgence > 0).length;

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
  const [qualite, setQualite] = useState("Éducateur");
  const ajouter = () => {
    if (!nom.trim()) return;
    set("participants", [...(f.participants || []), { id: uid(), nom: nom.trim(), qualite, reponse: "attente", motif: "" }]);
    setNom("");
  };
  const retirer = (id) => set("participants", (f.participants || []).filter((p) => p.id !== id));
  const educsDispo = (educateurs || []).filter((e) => e.nom && !(f.participants || []).some((p) => p.nom === e.nom));
  const ajouterEduc = (ed) => { const cats = (ed.categories || []); const fn = ed.fonction || "Éducateur"; const q = (fn === "Éducateur" && cats.length) ? `Éducateur (${cats.join(", ")})` : fn; set("participants", [...(f.participants || []), { id: uid(), nom: ed.nom, qualite: q, reponse: "attente", motif: "" }]); };

  return (
    <Modal title={reunion.id ? "Modifier la réunion" : "Programmer une réunion"} onClose={onClose}
      footer={<><Btn variant="accent" full disabled={!f.objet.trim() || !f.date} onClick={() => onSave(f)}><Save size={16} /> Enregistrer</Btn>{reunion.id && onDelete && <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>}</>}>
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
      <Btn variant="ghost" full style={{ marginBottom: 12 }} disabled={!nom.trim()} onClick={ajouter}><Plus size={16} /> Ajouter la personne</Btn>
      {(f.participants || []).length > 0 && (
        <div style={{ display: "grid", gap: 7 }}>
          {(f.participants || []).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, background: C.fond, borderRadius: 9, padding: "8px 10px" }}>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{p.nom} <span style={{ color: C.gris, fontWeight: 500 }}>· {p.qualite}</span></span>
              <X size={15} color={C.gris} style={{ cursor: "pointer" }} onClick={() => retirer(p.id)} />
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

function Reunions({ db, mutate, onClose }) {
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
