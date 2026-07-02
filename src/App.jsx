import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Users, ClipboardList, CalendarDays, Dumbbell, Search,
  Plus, X, Trash2, ChevronLeft, Trophy, Activity, Target,
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
          {url && <Btn variant="ghost" size="sm" onClick={() => setEditer(false)}>Annuler</Btn>}
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
  const [refus, setRefus] = useState(null); // demande en cours de refus
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

  const annuaire = demo
    ? db.players.filter((p) => p.cat !== cat).map((p) => ({ joueurId: p.id, prenom: p.prenom, nom: p.nom, poste: p.poste, cat: p.cat }))
    : annuaireRemote.filter((a) => a.categorie !== cat).map((a) => ({ joueurId: a.joueur_id, prenom: a.prenom, nom: a.nom, poste: a.poste, cat: a.categorie }));

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
  bleu: "#1A3553",      // bleu marine sobre
  bleuNuit: "#0E1E33",  // marine profond
  jaune: "#C6A24C",     // or champagne discret
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
const GROUPES = ["École de foot", "Pré-formation", "Formation", "PRO", "Féminines"];
const CATEGORIES = [
  { id: "U7", type: 4, groupe: "École de foot" }, { id: "U8", type: 5, groupe: "École de foot" }, { id: "U9", type: 8, groupe: "École de foot" },
  { id: "U10", type: 8, groupe: "École de foot" }, { id: "U11", type: 8, groupe: "École de foot" }, { id: "U12", type: 8, groupe: "École de foot" },
  { id: "U13", type: 8, groupe: "École de foot" },
  { id: "U14", type: 11, groupe: "Pré-formation" }, { id: "U15", type: 11, groupe: "Pré-formation" },
  { id: "6e/5e", type: 8, college: "Collège Hautes Vignes", groupe: "École de foot" },
  { id: "4e/3e", type: 8, college: "Collège Hautes Vignes", groupe: "Pré-formation" },
  { id: "U17 NAT", type: 11, groupe: "Formation" }, { id: "U19 NAT", type: 11, groupe: "Formation" },
  { id: "N3", type: 11, groupe: "Formation" }, { id: "Ligue 2", type: 11, groupe: "PRO" },
  { id: "U7F", type: 4, groupe: "Féminines" }, { id: "U8F", type: 5, groupe: "Féminines" }, { id: "U9F", type: 8, groupe: "Féminines" }, { id: "U10F", type: 8, groupe: "Féminines" },
  { id: "U11F", type: 8, groupe: "Féminines" }, { id: "U13F", type: 8, groupe: "Féminines" }, { id: "U15F", type: 11, groupe: "Féminines" },
  { id: "U18F", type: 11, groupe: "Féminines" }, { id: "U19F NAT", type: 11, groupe: "Féminines" }, { id: "SENIORS F", type: 11, groupe: "Féminines" },
];

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant",
];

// slots : x et y en pourcentage, gardien en bas
const FORMATIONS = { 4: { "2-1": [{ l: "G", x: 50, y: 88 }, { l: "DG", x: 30, y: 62 }, { l: "DD", x: 70, y: 62 }, { l: "AT", x: 50, y: 26 }], "1-2": [{ l: "G", x: 50, y: 88 }, { l: "DC", x: 50, y: 64 }, { l: "AG", x: 30, y: 28 }, { l: "AD", x: 70, y: 28 }] }, 5: { "2-1-1": [{ l: "G", x: 50, y: 89 }, { l: "DG", x: 30, y: 66 }, { l: "DD", x: 70, y: 66 }, { l: "MC", x: 50, y: 44 }, { l: "AT", x: 50, y: 20 }], "2-2": [{ l: "G", x: 50, y: 89 }, { l: "DG", x: 30, y: 64 }, { l: "DD", x: 70, y: 64 }, { l: "AG", x: 30, y: 26 }, { l: "AD", x: 70, y: 26 }], "1-2-1": [{ l: "G", x: 50, y: 89 }, { l: "DC", x: 50, y: 68 }, { l: "MG", x: 28, y: 45 }, { l: "MD", x: 72, y: 45 }, { l: "AT", x: 50, y: 20 }] },
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
      { l: "MG", x: 28, y: 51 }, { l: "MC", x: 50, y: 49 }, { l: "MD", x: 72, y: 51 },
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

const TERRAINS = ["Synthétique centre", "Synthétique dôme"];
const VESTIAIRES = ["1", "2", "3", "4", "5", "Villa 1", "Villa 2"];

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS_COURT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// Catalogue de thèmes de séance, regroupés par domaine
const THEMES = [
  { groupe: "Technique", items: ["Conduite de balle", "Passes et contrôles", "Jonglages", "Finition", "Jeu de tête", "Dribble"] },
  { groupe: "Tactique", items: ["Conservation", "Transitions", "Pressing", "Animation offensive", "Animation défensive", "Jeu en supériorité"] },
  { groupe: "Athlétique", items: ["Vitesse", "Coordination et motricité", "Endurance", "Renforcement", "Agilité"] },
  { groupe: "Gardien", items: ["Prises de balle", "Plongeons", "Jeu au pied", "Relance"] },
  { groupe: "Match", items: ["Jeu réduit", "Opposition", "Match à thème", "Préparation de match"] },
];

// Vacances scolaires Zone A (académie de Besançon). debut = premier jour sans cours, reprise = jour de reprise.
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
const dateStr = (y, mi, d) => `${y}-${pad(mi + 1)}-${pad(d)}`;
const daysInMonth = (y, mi) => new Date(y, mi + 1, 0).getDate();
const dowOf = (y, mi, d) => new Date(y, mi, d).getDay();
const minStr = (a, b) => (a < b ? a : b);
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// Renvoie la vacance qui contient la date, en indiquant si l'arrêt est actif selon le choix 1 ou 2 semaines.
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
   Renseigne ces deux valeurs : Supabase > Project Settings > API
   ============================================================ */
const SUPABASE_URL = "https://hehdquwbwtzublrscmnd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlaGRxdXdid3R6dWJscnNjbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1Nzk1MzcsImV4cCI6MjA5ODE1NTUzN30.NWpByCcwWQUMxxzG2n-EaC9-8HnjBIUjSIkkDxf1Zk0";

const EMPTY_DB = { players: [], matches: [], trainings: [], injuries: [], scouting: [], lineups: {}, demandes: [], encadrement: [], transports: [], config: { trainingDays: {}, breaks: {}, classement: {} } };

const estConfigure = () => SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("VOTRE-PROJET");

let _sbPromise = null;
function getSupabase() {
  if (!_sbPromise) {
    _sbPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }));
  }
  return _sbPromise;
}

// Charge les données d'une catégorie (le RLS limite l'accès à l'éducateur)
async function loadCat(cat) {
  const sb = await getSupabase();
  const { data, error } = await sb.from("categorie_data").select("data").eq("categorie", cat).maybeSingle();
  if (error) throw error;
  return (data && data.data) ? { ...EMPTY_DB, ...data.data } : { ...EMPTY_DB };
}
// Enregistre les données d'une catégorie
async function saveCat(cat, blob, userId) {
  const sb = await getSupabase();
  const { error } = await sb.from("categorie_data").upsert({ categorie: cat, data: blob, maj_le: new Date().toISOString(), maj_par: userId });
  if (error) throw error;
}

// Stockage local pour le mode essai (sans Supabase). Conserve toutes les catégories.
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
  const d = new Date(dob); if (isNaN(d)) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s); if (isNaN(d)) return s;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

function Avatar({ p, size, radius }) {
  const r = radius != null ? radius : Math.round(size * 0.28);
  // objectPosition vers le haut pour ne pas couper la tête sur une photo portrait
  if (p.photo) return <img src={p.photo} alt="" style={{ width: size, height: size, borderRadius: r, objectFit: "cover", objectPosition: "center 20%", display: "block" }} />;
  return <div style={{ width: size, height: size, borderRadius: r, background: C.bleu, color: C.jaune, display: "grid", placeItems: "center", fontWeight: 900, fontSize: Math.round(size * 0.36) }}>{initials(p)}</div>;
}

// Emplacement portrait (proportions photo d'identité) : affiche le visage en entier, centré, sans rognage
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

// Réduit et compresse une image avant stockage
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

// Construit et télécharge la fiche joueur complète en PDF
function exporterFichePDF(jsPDF, p, db, tests, stats) {
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
  const W = 595, H = 842, M = 42;
  const NAVY = [14, 30, 51], BLEU = [26, 53, 83], OR = [198, 162, 76];
  const ENCRE = [22, 32, 46], GRIS = [122, 130, 142], TRAIT = [228, 232, 238], FOND = [247, 248, 250];
  const sc = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const sd = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const sf = (c) => doc.setFillColor(c[0], c[1], c[2]);

  // Filet marine discret en tête + identité du club
  sf(NAVY); doc.rect(0, 0, W, 5, "F");
  sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text(CLUB_LONG, M, 42);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.text("ÉCOLE DE FOOT   ·   FICHE JOUEUR", M, 55);
  sd(OR); doc.setLineWidth(1); doc.line(M, 64, W - M, 64); doc.setLineWidth(0.5);

  // Bloc joueur : photo portrait à droite, identité à gauche
  const by = 80, bw = 86, bh = 110, bx = W - M - bw;
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
  sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(21);
  doc.text(`${p.prenom || ""} ${p.nom || ""}`.trim() || "Joueur", M, 102);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
  doc.text(`${p.poste || "Poste non défini"}   ·   ${p.cat}${p.numero ? `   ·   N° ${p.numero}` : ""}`, M, 120);

  let y = p.photo ? 204 : 150;
  const colW = (W - 2 * M - 26) / 2;
  const cols = [M, M + colW + 26];

  const section = (titre) => {
    y += 6;
    sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(titre.toUpperCase(), M, y);
    const tw = doc.getTextWidth(titre.toUpperCase());
    sd(OR); doc.setLineWidth(1.4); doc.line(M, y + 4.5, M + tw, y + 4.5); doc.setLineWidth(0.5);
    y += 16;
  };
  const cellule = (x, label, val) => {
    if (val == null || val === "") val = "n.c.";
    sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(String(label), x, y);
    sc(ENCRE); doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
    doc.text(String(val), x + colW, y, { align: "right" });
  };
  const paires = (arr) => {
    for (let i = 0; i < arr.length; i += 2) {
      cellule(cols[0], arr[i][0], arr[i][1]);
      if (arr[i + 1]) cellule(cols[1], arr[i + 1][0], arr[i + 1][1]);
      sd(TRAIT); doc.line(M, y + 5, W - M, y + 5);
      y += 17;
    }
  };

  section("Identité");
  paires([
    ["Date de naissance", p.dob ? `${new Date(p.dob).toLocaleDateString("fr-FR")}${ageOf(p.dob) != null ? ` (${ageOf(p.dob)} ans)` : ""}` : null],
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

  section("Statistiques de saison");
  const tiles = [
    ["Minutes", String(stats.minutes ?? 0)],
    ["Buts", String(stats.buts ?? 0)],
    ["Passes déc.", String(stats.passes ?? 0)],
    ["Note moy.", stats.moy != null ? `${stats.moy.toFixed(1)}/7` : "n.c."],
  ];
  const gap = 10, tw2 = (W - 2 * M - 3 * gap) / 4, th = 44;
  tiles.forEach((t, i) => {
    const x = M + i * (tw2 + gap);
    sf(FOND); doc.roundedRect(x, y, tw2, th, 5, 5, "F");
    sc(BLEU); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(t[1], x + tw2 / 2, y + 22, { align: "center" });
    sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.text(t[0], x + tw2 / 2, y + 35, { align: "center" });
  });
  y += th + 6;

  const blessures = db.injuries.filter((i) => i.joueurId === p.id);
  if (blessures.length) {
    section("Suivi blessures");
    paires(blessures.map((b) => [b.zone || "Blessure", `${b.fini ? "Rétabli" : "En cours"}${b.debut ? " · " + new Date(b.debut).toLocaleDateString("fr-FR") : ""}`]));
  }

  // Pied de page
  sd(OR); doc.setLineWidth(0.8); doc.line(M, H - 36, W - M, H - 36); doc.setLineWidth(0.5);
  sc(GRIS); doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  doc.text(`Fiche éditée le ${new Date().toLocaleDateString("fr-FR")}`, M, H - 24);
  doc.text(CLUB_LONG, W - M, H - 24, { align: "right" });

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
  const [session, setSession] = useState(undefined); // undefined = chargement, null = déconnecté
  const [profil, setProfil] = useState(null);        // { role, nom, cats: [] }
  const [cat, setCat] = useState(null);
  const [tab, setTab] = useState("accueil");
  const [db, setDb] = useState(null);
  const [showScores, setShowScores] = useState(false);
  const [showDemandes, setShowDemandes] = useState(false);
  const [showClassement, setShowClassement] = useState(false);
  const [showTransport, setShowTransport] = useState(false);
  const [showOrganisation, setShowOrganisation] = useState(false);
  const [showSauvegarde, setShowSauvegarde] = useState(false);
  const [groupeSel, setGroupeSel] = useState(null);
  const [demo, setDemo] = useState(false);
  const cacheRef = useRef({});

  // Suivi de la session
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

  // Profil et catégories autorisées
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

  // Chargement des données de la catégorie sélectionnée
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

  // Mode essai : base locale unique (toutes catégories)
  useEffect(() => {
    if (!demo) return;
    let annule = false;
    loadLocal().then((d) => { if (!annule) { setDb(d); setCat((p) => p || "U7"); } });
    return () => { annule = true; };
  }, [demo]);

  function mutate(fn) {
    setDb((prev) => {
      const next = fn(structuredClone(prev));
      if (demo) { saveLocal(next); }
      else { cacheRef.current[cat] = next; if (session && cat) saveCat(cat, next, session.user.id).catch((e) => console.error("Sauvegarde:", e)); }
      return next;
    });
  }

  async function deconnexion() {
    if (demo) { setDemo(false); setDb(null); setCat(null); return; }
    try { const sb = await getSupabase(); await sb.auth.signOut(); } catch (e) {}
    cacheRef.current = {};
  }

  // Écrans d'état
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
  const cats = demo ? CATEGORIES.map((c) => c.id) : profil.cats;
  const sousTitre = demo ? "" : (profil && profil.role === "direction" ? " · DIRECTION" : "");
  const peutValider = demo || (profil && (profil.role === "responsable" || profil.role === "direction"));
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
        {tab === "accueil" && <Accueil db={db} cat={cat} setTab={setTab} onScores={() => setShowScores(true)} onDemandes={() => setShowDemandes(true)} onClassement={() => setShowClassement(true)} onTransport={() => setShowTransport(true)} onOrganisation={() => setShowOrganisation(true)} onSauvegarde={() => setShowSauvegarde(true)} />}
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
    // Mode essai : calcul local depuis la base unique
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
   Accueil / tableau de bord
   ============================================================ */
function Accueil({ db, cat, setTab, onScores, onDemandes, onClassement, onTransport, onOrganisation, onSauvegarde }) {
  const players = db.players.filter((p) => p.cat === cat);
  const matches = db.matches.filter((m) => m.cat === cat);
  const trainings = db.trainings.filter((t) => t.cat === cat);
  const blesses = db.injuries.filter((i) => i.cat === cat && !i.fini);
  const nbAttente = (db.demandes || []).filter((d) => d.joueurCat === cat && d.statut === "en_attente").length;
  const nbTransport = (db.transports || []).filter((x) => x.cat === cat && x.statut === "en_attente").length;
  const dOrg = new Date();
  const todayStr = `${dOrg.getFullYear()}-${pad(dOrg.getMonth() + 1)}-${pad(dOrg.getDate())}`;
  const nbOrga = (db.matches || []).filter((m) => m.cat === cat && (!m.date || m.date >= todayStr)).filter((m) => {
    const r = m.reservation || {}, t = m.transport || {};
    if (m.lieu === "Domicile") return r.statut !== "validee";
    if (m.lieu === "Extérieur") return t.statut !== "acceptee";
    return false;
  }).length;

  let v = 0, n = 0, d = 0, bp = 0, bc = 0;
  matches.forEach((m) => {
    if (m.scorePour == null || m.scoreContre == null) return;
    bp += +m.scorePour; bc += +m.scoreContre;
    if (+m.scorePour > +m.scoreContre) v++;
    else if (+m.scorePour === +m.scoreContre) n++;
    else d++;
  });

  const stat = (label, val, icon) => (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.gris, fontSize: 12, fontWeight: 700 }}>{icon}{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4, color: C.bleu }}>{val}</div>
    </Card>
  );

  const liens = [
    { id: "effectif", label: "Gérer l'effectif", icon: <Users size={18} />, sub: "Fiches joueurs, tests physiques" },
    { id: "compo", label: "Composition d'équipe", icon: <ClipboardList size={18} />, sub: "Placer les joueurs sur le terrain" },
    { id: "matchs", label: "Calendrier et rapports", icon: <CalendarDays size={18} />, sub: "Scores, buteurs, notes" },
    { id: "entrainements", label: "Séances et présences", icon: <Dumbbell size={18} />, sub: "Absences et blessures" },
    { id: "detection", label: "Détection adverse", icon: <Search size={18} />, sub: "Talents repérés" },
  ];

  return (
    <div>
      <h2 style={{ margin: "4px 0 14px", fontSize: 20, fontWeight: 900 }}>Tableau de bord {cat}</h2>

      <Card onClick={onScores} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13, background: `linear-gradient(160deg, ${C.bleuNuit}, ${C.bleu})`, borderColor: C.bleu }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.jaune, color: C.bleuNuit, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Trophy size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: "#fff" }}>Scores du week-end</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>Résultats de toutes les catégories</div>
        </div>
        <ChevronLeft size={18} color={C.jaune} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <Card onClick={onDemandes} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.bleu, color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto" }}><ArrowRightLeft size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Demandes de joueurs</div>
          <div style={{ fontSize: 12.5, color: C.gris }}>Demander un joueur d'une autre catégorie</div>
        </div>
        {nbAttente > 0 && <span style={{ background: C.rouge, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 800, padding: "2px 9px" }}>{nbAttente}</span>}
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <Card onClick={onClassement} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.jaune, color: C.bleuNuit, display: "grid", placeItems: "center", flex: "0 0 auto" }}><ListOrdered size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Classement du championnat</div>
          <div style={{ fontSize: 12.5, color: C.gris }}>District, Ligue, National et Ligue 2 en direct</div>
        </div>
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <Card onClick={onTransport} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.bleu, color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Bus size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Demande de transport</div>
          <div style={{ fontSize: 12.5, color: C.gris }}>Minibus, bus en location ou voitures, à l'avance</div>
        </div>
        {nbTransport > 0 && <span style={{ background: C.rouge, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 800, padding: "2px 9px" }}>{nbTransport}</span>}
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <Card onClick={onOrganisation} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.jaune, color: C.bleuNuit, display: "grid", placeItems: "center", flex: "0 0 auto" }}><MapPin size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Organisation des matchs</div>
          <div style={{ fontSize: 12.5, color: C.gris }}>Terrain, vestiaires, transport, encadrement à préparer</div>
        </div>
        {nbOrga > 0 && <span style={{ background: C.jauneFonce, color: "#fff", borderRadius: 999, fontSize: 12, fontWeight: 800, padding: "2px 9px" }}>{nbOrga}</span>}
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <Card onClick={onSauvegarde} style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.bleu, color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto" }}><FileDown size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800 }}>Sauvegarde des données</div>
          <div style={{ fontSize: 12.5, color: C.gris }}>Exporter ou restaurer les données</div>
        </div>
        <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 12 }}>
        {stat("Joueurs", players.length, <Users size={15} />)}
        {stat("Matchs joués", v + n + d, <Trophy size={15} />)}
      </div>

      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Bilan des rencontres</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Pastille bg="#E2F4E9" color={C.vert}>{v} V</Pastille>
          <Pastille bg={C.grisClair} color={C.gris}>{n} N</Pastille>
          <Pastille bg="#FBE3E3" color={C.rouge}>{d} D</Pastille>
        </div>
        <div style={{ fontSize: 13, color: C.gris }}>Buts marqués {bp} · Buts encaissés {bc} · Différence {bp - bc >= 0 ? "+" : ""}{bp - bc}</div>
      </Card>

      {blesses.length > 0 && (
        <Card style={{ marginBottom: 12, borderColor: "#F3C9C9", background: "#FFF6F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: C.rouge }}>
            <HeartPulse size={18} /> {blesses.length} joueur{blesses.length > 1 ? "s" : ""} à l'infirmerie
          </div>
          <div style={{ fontSize: 13, color: C.gris, marginTop: 6 }}>
            {blesses.map((b) => {
              const p = db.players.find((x) => x.id === b.joueurId);
              return p ? `${p.prenom} ${p.nom}` : null;
            }).filter(Boolean).join(", ")}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {liens.map((l) => (
          <Card key={l.id} onClick={() => setTab(l.id)} style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.bleu, color: "#fff", display: "grid", placeItems: "center" }}>{l.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{l.label}</div>
              <div style={{ fontSize: 12.5, color: C.gris }}>{l.sub}</div>
            </div>
            <ChevronLeft size={18} color={C.gris} style={{ transform: "rotate(180deg)" }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Effectif et fiches joueurs
   ============================================================ */
function jumpActif(catId) {
  const ci = CATEGORIES.find((c) => c.id === catId);
  if (!ci || ci.groupe === "École de foot") return false;
  return !["U7F", "U8F", "U9F", "U10F", "U11F", "U13F"].includes(catId);
}

function statsJoueur(db, joueurId) {
  let minutes = 0, buts = 0, passes = 0, jaunes = 0, rouges = 0, notes = [];
  db.matches.forEach((m) => {
    const t = m.tempsJeu?.[joueurId]; if (t) minutes += +t;
    const b = m.buteurs?.[joueurId]; if (b) buts += +b;
    const a = m.passeurs?.[joueurId]; if (a) passes += +a;
    const j = m.jaunes?.[joueurId]; if (j) jaunes += +j;
    if (m.rouges?.[joueurId]) rouges += 1;
    const r = m.notes?.[joueurId]?.note; if (r) notes.push(+r);
  });
  const moy = notes.length ? (notes.reduce((s, x) => s + x, 0) / notes.length) : null;
  return { minutes, buts, passes, jaunes, rouges, moy, nbNotes: notes.length };
}

function Effectif({ players, cat, catInfo, db, mutate }) {
  const [edit, setEdit] = useState(null);   // joueur en edition
  const [open, setOpen] = useState(null);    // fiche affichee

  const sorted = [...players].sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Effectif {cat}</h2>
        <Btn variant="accent" size="sm" onClick={() => setEdit({ cat })}><Plus size={16} /> Joueur</Btn>
      </div>

      {sorted.length === 0 ? (
        <Empty icon={<Users size={26} color={C.gris} />} text="Aucun joueur" sub="Ajoute le premier joueur de la catégorie" />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((p) => {
            const s = statsJoueur(db, p.id);
            const blesse = db.injuries.some((i) => i.joueurId === p.id && !i.fini);
            return (
              <Card key={p.id} onClick={() => setOpen(p)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar p={p} size={44} radius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                    {p.prenom} {p.nom}
                    {blesse && <HeartPulse size={15} color={C.rouge} />}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.gris }}>
                    {p.poste || "Poste non défini"}{ageOf(p.dob) != null ? ` · ${ageOf(p.dob)} ans` : ""}{p.pied ? ` · ${p.pied}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {s.moy != null && <div style={{ fontWeight: 900, color: C.bleu }}>{s.moy.toFixed(1)}<span style={{ fontSize: 11, color: C.gris }}>/7</span></div>}
                  <div style={{ fontSize: 11, color: C.gris }}>{s.buts}b · {s.passes}p</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && <FicheJoueur p={open} db={db} mutate={mutate} onClose={() => setOpen(null)} onEdit={() => { setEdit(open); setOpen(null); }}
        onDelete={() => { mutate((d) => { d.players = d.players.filter((x) => x.id !== open.id); return d; }); setOpen(null); }} />}

      {edit && <EditJoueur joueur={edit} onClose={() => setEdit(null)} onSave={(j) => {
        mutate((d) => {
          if (j.id) { const i = d.players.findIndex((x) => x.id === j.id); d.players[i] = j; }
          else { d.players.push({ ...j, id: uid() }); }
          return d;
        });
        setEdit(null);
      }} />}
    </div>
  );
}

function FicheJoueur({ p: pp, db, mutate, onClose, onEdit, onDelete }) {
  const p = db.players.find((x) => x.id === pp.id) || pp;
  const s = statsJoueur(db, p.id);
  const jong = p.jonglages || {};
  const blessures = db.injuries.filter((i) => i.joueurId === p.id);
  const [metric, setMetric] = useState("vma");
  const [addTest, setAddTest] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [pdfMsg, setPdfMsg] = useState("");
  const jump = jumpActif(p.cat);

  async function exportPDF() {
    try {
      setPdfMsg("Génération du PDF...");
      const jsPDF = await chargerJsPDF();
      exporterFichePDF(jsPDF, p, db, tests, s);
      setPdfMsg("");
    } catch (e) {
      setPdfMsg("Téléchargement bloqué dans l'aperçu. Ouvre l'app dans Safari ou Chrome (ou la version déployée) pour récupérer le PDF.");
    }
  }

  // Historique des tests, avec reprise des anciennes valeurs uniques s'il y en a
  const tests = useMemo(() => {
    let list = Array.isArray(p.tests) ? [...p.tests] : [];
    if (list.length === 0 && (p.vma || p.v10 || p.v20 || p.v40)) {
      list = [{ id: "legacy", date: "", vma: p.vma || "", v10: p.v10 || "", v20: p.v20 || "", v40: p.v40 || "" }];
    }
    return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [p]);
  const dernier = tests[tests.length - 1] || {};

  function ajouterTest(t) {
    mutate((d) => {
      const j = d.players.find((x) => x.id === p.id);
      let list = Array.isArray(j.tests) ? [...j.tests] : [];
      if (list.length === 0 && (j.vma || j.v10 || j.v20 || j.v40)) {
        list.push({ id: uid(), date: "", vma: j.vma || "", v10: j.v10 || "", v20: j.v20 || "", v40: j.v40 || "" });
      }
      list.push({ ...t, id: uid() });
      j.tests = list;
      return d;
    });
    setAddTest(false);
  }
  function modifierTest(t) {
    mutate((d) => {
      const j = d.players.find((x) => x.id === p.id);
      let list = Array.isArray(j.tests) ? [...j.tests] : [];
      if (list.length === 0 && (j.vma || j.v10 || j.v20 || j.v40)) {
        list.push({ id: "legacy", date: "", vma: j.vma || "", v10: j.v10 || "", v20: j.v20 || "", v40: j.v40 || "" });
      }
      const idx = list.findIndex((x) => x.id === t.id);
      if (idx >= 0) list[idx] = { ...t };
      else list.push({ ...t, id: t.id && t.id !== "legacy" ? t.id : uid() });
      j.tests = list;
      return d;
    });
    setEditTest(null);
  }
  function supprimerTest(id) {
    mutate((d) => {
      const j = d.players.find((x) => x.id === p.id);
      j.tests = (j.tests || []).filter((t) => t.id !== id);
      return d;
    });
  }

  const info = (icon, label, val) => (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: `1px solid ${C.grisClair}` }}>
      <div style={{ color: C.bleu, width: 22, flex: "0 0 auto", display: "flex", justifyContent: "center" }}>{icon}</div>
      <span style={{ fontSize: 13.5, color: C.gris, width: 150, flex: "0 0 auto", textAlign: "center" }}>{label}</span>
      <strong style={{ fontSize: 14.5, flex: 1, textAlign: "right" }}>{val || "n.c."}</strong>
    </div>
  );
  const jline = (label, n) => (
    <div style={{ flex: 1, textAlign: "center", padding: 10, background: C.fond, borderRadius: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.bleu }}>{n ?? 0}</div>
      <div style={{ fontSize: 11, color: C.gris, fontWeight: 700 }}>{label}</div>
    </div>
  );

  return (
    <Modal title="Fiche joueur" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onEdit} full><Edit3 size={16} /> Modifier</Btn>
        <Btn variant="danger" onClick={onDelete}><Trash2 size={16} /></Btn>
      </>}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <PhotoFiche p={p} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 19 }}>{p.prenom} {p.nom}</div>
          <div style={{ color: C.gris, fontSize: 13 }}>{p.poste || "Poste non défini"} · {p.cat}{p.numero ? ` · N° ${p.numero}` : ""}</div>
        </div>
      </div>

      <Btn variant="primary" full size="sm" onClick={exportPDF} style={{ marginBottom: 4 }}><FileDown size={16} /> Exporter la fiche en PDF</Btn>
      {pdfMsg && <div style={{ fontSize: 12, color: pdfMsg.includes("indisponible") ? C.rouge : C.gris, margin: "6px 0 0", textAlign: "center" }}>{pdfMsg}</div>}
      <div style={{ height: 12 }} />

      <Card style={{ marginBottom: 12 }}>
        {info(<CalendarDays size={17} />, "Date de naissance", p.dob ? `${new Date(p.dob).toLocaleDateString("fr-FR")}${ageOf(p.dob) != null ? ` (${ageOf(p.dob)} ans)` : ""}` : null)}
        {info(<Ruler size={17} />, "Taille", p.taille ? `${p.taille} cm` : null)}
        {info(<Weight size={17} />, "Poids", p.poids ? `${p.poids} kg` : null)}
        {info(<Footprints size={17} />, "Pied fort", p.pied)}
        {info(<MapPin size={17} />, "Poste", p.poste)}
        {info(<Trophy size={17} />, "Numéro de maillot", p.numero)}
        {info(<ClipboardList size={17} />, "Numéro de licence", p.licence)}
        {info(<ShieldAlert size={17} />, "Club", p.club)}
      </Card>

      <div style={{ fontWeight: 800, margin: "4px 0 8px", display: "flex", alignItems: "center", gap: 7 }}><Phone size={17} color={C.bleu} /> Parents / responsable</div>
      <Card style={{ marginBottom: 12 }}>
        {info(<Users size={17} />, "Responsable", p.parentNom)}
        {info(<Phone size={17} />, "Téléphone", p.parentTel)}
        {info(<MapPin size={17} />, "Contact", p.parentEmail)}
      </Card>

      <div style={{ fontWeight: 800, margin: "4px 0 8px", display: "flex", alignItems: "center", gap: 7 }}><Target size={17} color={C.bleu} /> Jonglages (max 50)</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {jline("Pied fort", jong.fort)}
        {jline("Pied faible", jong.faible)}
        {jline("Tête", jong.tete)}
      </div>

      <div style={{ fontWeight: 800, margin: "4px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Gauge size={17} color={C.bleu} /> Tests physiques</span>
        <Btn variant="accent" size="sm" onClick={() => setAddTest(true)}><Plus size={15} /> Nouveau test</Btn>
      </div>

      {tests.length === 0 ? (
        <Card style={{ marginBottom: 12 }}>
          <Empty icon={<Gauge size={22} color={C.gris} />} text="Aucun test enregistré" sub="Ajoute un test pour suivre l'évolution" />
        </Card>
      ) : (
        <>
          <Card style={{ marginBottom: 10 }}>
            {dernier.date && <div style={{ fontSize: 12, color: C.gris, fontWeight: 700, marginBottom: 4 }}>Dernier test du {new Date(dernier.date + "T00:00:00").toLocaleDateString("fr-FR")}</div>}
            <div style={{ fontSize: 11, fontWeight: 800, color: C.gris, letterSpacing: 0.4, margin: "2px 0 2px" }}>VITESSE</div>
            {info(<Activity size={17} />, "VMA", dernier.vma ? `${dernier.vma} km/h` : null)}
            {info(<Timer size={17} />, "Vitesse 10 m", dernier.v10 ? `${dernier.v10} s` : null)}
            {info(<Timer size={17} />, "Vitesse 20 m", dernier.v20 ? `${dernier.v20} s` : null)}
            {info(<Timer size={17} />, "Vitesse 40 m", dernier.v40 ? `${dernier.v40} s` : null)}
            {jump && <div style={{ fontSize: 11, fontWeight: 800, color: C.gris, letterSpacing: 0.4, margin: "8px 0 2px" }}>DÉTENTE (SAUTS)</div>}
            {jump && info(<Activity size={17} />, "SJ (Squat Jump)", dernier.sj ? `${dernier.sj} cm` : null)}
            {jump && info(<Activity size={17} />, "CMJ", dernier.cmj ? `${dernier.cmj} cm` : null)}
            {jump && info(<Activity size={17} />, "CMJB (bras)", dernier.cmjb ? `${dernier.cmjb} cm` : null)}
            {jump && info(<Activity size={17} />, "DJ (Drop Jump)", dernier.dj ? `${dernier.dj} cm` : null)}
          </Card>

          <Card style={{ marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
              {[["vma", "VMA"], ["v10", "10 m"], ["v20", "20 m"], ["v40", "40 m"], ...(jump ? [["sj", "SJ"], ["cmj", "CMJ"], ["cmjb", "CMJB"], ["dj", "DJ"]] : [])].map(([k, lab]) => {
                const on = metric === k;
                return (
                  <button key={k} onClick={() => setMetric(k)} style={{
                    border: "none", cursor: "pointer", borderRadius: 9, padding: "8px 0", fontSize: 13, fontWeight: 800,
                    background: on ? C.bleu : C.grisClair, color: on ? "#fff" : C.gris,
                  }}>{lab}</button>
                );
              })}
            </div>
            <GraphTests tests={tests} metric={metric} />
          </Card>

          <div style={{ display: "grid", gap: 7, marginBottom: 12 }}>
            {[...tests].reverse().map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, width: 66, color: C.gris }}>{t.date ? new Date(t.date + "T00:00:00").toLocaleDateString("fr-FR") : "Initial"}</div>
                <div style={{ flex: 1, fontSize: 12.5, color: C.encre, minWidth: 0 }}>
                  {[t.vma ? `VMA ${t.vma}` : null, t.v10 ? `10m ${t.v10}` : null, t.v20 ? `20m ${t.v20}` : null, t.v40 ? `40m ${t.v40}` : null, t.sj ? `SJ ${t.sj}` : null, t.cmj ? `CMJ ${t.cmj}` : null, t.cmjb ? `CMJB ${t.cmjb}` : null, t.dj ? `DJ ${t.dj}` : null].filter(Boolean).join(" · ")}
                </div>
                <Edit3 size={16} color={C.bleu} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => setEditTest(t)} />
                <X size={16} color={C.gris} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => supprimerTest(t.id)} />
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ fontWeight: 800, margin: "4px 0 8px", display: "flex", alignItems: "center", gap: 7 }}><Trophy size={17} color={C.bleu} /> Statistiques de saison</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
        {[["Minutes", s.minutes], ["Buts", s.buts], ["Passes", s.passes], ["Note", s.moy != null ? s.moy.toFixed(1) : "n.c."]].map(([l, v]) => (
          <div key={l} style={{ textAlign: "center", padding: 10, background: C.fond, borderRadius: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.bleu }}>{v}</div>
            <div style={{ fontSize: 10.5, color: C.gris, fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>
      {(s.jaunes > 0 || s.rouges > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.gris }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 16, borderRadius: 2, background: "#F2C200", display: "inline-block" }} /> {s.jaunes} carton{s.jaunes > 1 ? "s" : ""} jaune{s.jaunes > 1 ? "s" : ""}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 16, borderRadius: 2, background: "#D33A2C", display: "inline-block" }} /> {s.rouges} rouge{s.rouges > 1 ? "s" : ""}</span>
        </div>
      )}

      {blessures.length > 0 && (
        <>
          <div style={{ fontWeight: 800, margin: "4px 0 8px", display: "flex", alignItems: "center", gap: 7 }}><HeartPulse size={17} color={C.rouge} /> Suivi blessures</div>
          <div style={{ display: "grid", gap: 8 }}>
            {blessures.map((b) => (
              <Card key={b.id} style={{ padding: 12, borderColor: b.fini ? C.grisClair : "#F3C9C9" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: 14 }}>{b.zone || "Blessure"}</strong>
                  <Pastille bg={b.fini ? "#E2F4E9" : "#FBE3E3"} color={b.fini ? C.vert : C.rouge}>{b.fini ? "Rétabli" : "En cours"}</Pastille>
                </div>
                <div style={{ fontSize: 12.5, color: C.gris, marginTop: 4 }}>
                  Début {b.debut ? new Date(b.debut).toLocaleDateString("fr-FR") : "?"} · Arrêt estimé {b.duree || "?"}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {addTest && <EditTest jump={jump} onClose={() => setAddTest(false)} onSave={ajouterTest} />}
      {editTest && <EditTest jump={jump} test={editTest} onClose={() => setEditTest(null)} onSave={modifierTest} />}
    </Modal>
  );
}

function GraphTests({ tests, metric }) {
  const meta = {
    vma: { label: "VMA", unit: "km/h", sensBas: false },
    v10: { label: "10 m", unit: "s", sensBas: true },
    v20: { label: "20 m", unit: "s", sensBas: true },
    v40: { label: "40 m", unit: "s", sensBas: true },
    sj: { label: "SJ", unit: "cm", sensBas: false },
    cmj: { label: "CMJ", unit: "cm", sensBas: false },
    cmjb: { label: "CMJB", unit: "cm", sensBas: false },
    dj: { label: "DJ", unit: "cm", sensBas: false },
  }[metric] || { label: metric, unit: "", sensBas: false };
  const data = tests
    .map((t) => ({ label: t.date ? jjmm(t.date) : "Init", v: (t[metric] === "" || t[metric] == null) ? null : +t[metric] }))
    .filter((d) => d.v != null && !isNaN(d.v));

  if (data.length === 0)
    return <div style={{ fontSize: 13, color: C.gris, textAlign: "center", padding: 16 }}>Aucune valeur pour ce test.</div>;
  if (data.length === 1)
    return (
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 27, fontWeight: 900, color: C.bleu }}>{data[0].v} <span style={{ fontSize: 13, color: C.gris }}>{meta.unit}</span></div>
        <div style={{ fontSize: 12, color: C.gris, marginTop: 4 }}>Ajoute un second test pour voir l'évolution.</div>
      </div>
    );

  const W = 320, H = 152, pL = 38, pR = 12, pT = 14, pB = 26;
  const vals = data.map((d) => d.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const marge = (max - min) * 0.18; min -= marge; max += marge;
  const X = (i) => pL + (i * (W - pL - pR)) / (data.length - 1);
  const Y = (v) => pT + (H - pT - pB) * (1 - (v - min) / (max - min));
  const poly = data.map((d, i) => `${X(i)},${Y(d.v)}`).join(" ");

  const diff = data[data.length - 1].v - data[0].v;
  const progresse = meta.sensBas ? diff < 0 : diff > 0;
  const couleur = diff === 0 ? C.gris : (progresse ? C.vert : C.rouge);
  const fleche = diff === 0 ? "=" : (diff > 0 ? "▲" : "▼");
  const dec = meta.sensBas ? 2 : 1;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        <line x1={pL} y1={pT} x2={pL} y2={H - pB} stroke={C.grisClair} strokeWidth="1" />
        <line x1={pL} y1={H - pB} x2={W - pR} y2={H - pB} stroke={C.grisClair} strokeWidth="1" />
        <text x={pL - 6} y={Y(max) + 4} textAnchor="end" fontSize="10" fill={C.gris}>{max.toFixed(dec)}</text>
        <text x={pL - 6} y={Y(min) + 4} textAnchor="end" fontSize="10" fill={C.gris}>{min.toFixed(dec)}</text>
        <polyline points={poly} fill="none" stroke={C.bleu} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={X(i)} cy={Y(d.v)} r="4" fill={C.jaune} stroke={C.bleu} strokeWidth="2" />
            <text x={X(i)} y={Y(d.v) - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.encre}>{d.v}</text>
            <text x={X(i)} y={H - pB + 14} textAnchor="middle" fontSize="9.5" fill={C.gris}>{d.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 4, fontSize: 12.5, fontWeight: 800, color: couleur }}>
        <span>{fleche}</span>
        <span>{diff === 0 ? "Stable" : `${diff > 0 ? "+" : ""}${diff.toFixed(dec)} ${meta.unit} ${progresse ? "(progrès)" : "(à retravailler)"}`}</span>
      </div>
    </div>
  );
}

function EditTest({ onClose, onSave, jump, test }) {
  const [f, setF] = useState(test
    ? { date: "", vma: "", v10: "", v20: "", v40: "", sj: "", cmj: "", cmjb: "", dj: "", ...test }
    : { date: new Date().toISOString().slice(0, 10), vma: "", v10: "", v20: "", v40: "", sj: "", cmj: "", cmjb: "", dj: "" });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Modal title={test ? "Modifier le test" : "Nouveau test physique"} onClose={onClose}
      footer={<Btn variant="accent" full onClick={() => onSave(f)}><Save size={16} /> {test ? "Enregistrer les corrections" : "Enregistrer le test"}</Btn>}>
      <Field label="Date du test"><Inp type="date" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Test VMA (km/h)"><Inp type="number" step="0.1" value={f.vma} onChange={(e) => set("vma", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="10 m (s)"><Inp type="number" step="0.01" value={f.v10} onChange={(e) => set("v10", e.target.value)} /></Field>
        <Field label="20 m (s)"><Inp type="number" step="0.01" value={f.v20} onChange={(e) => set("v20", e.target.value)} /></Field>
        <Field label="40 m (s)"><Inp type="number" step="0.01" value={f.v40} onChange={(e) => set("v40", e.target.value)} /></Field>
      </div>
      {jump && (
        <>
          <div style={{ fontWeight: 800, margin: "8px 0 4px", color: C.bleu }}>Détente (cm)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="SJ (Squat Jump)"><Inp type="number" step="0.1" value={f.sj} onChange={(e) => set("sj", e.target.value)} /></Field>
            <Field label="CMJ"><Inp type="number" step="0.1" value={f.cmj} onChange={(e) => set("cmj", e.target.value)} /></Field>
            <Field label="CMJB (avec bras)"><Inp type="number" step="0.1" value={f.cmjb} onChange={(e) => set("cmjb", e.target.value)} /></Field>
            <Field label="DJ (Drop Jump)"><Inp type="number" step="0.1" value={f.dj} onChange={(e) => set("dj", e.target.value)} /></Field>
          </div>
        </>
      )}
    </Modal>
  );
}

function EditJoueur({ joueur, onClose, onSave }) {
  const [f, setF] = useState({
    jonglages: {}, ...joueur,
    jong_fort: joueur.jonglages?.fort ?? "", jong_faible: joueur.jonglages?.faible ?? "", jong_tete: joueur.jonglages?.tete ?? "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const cap50 = (v) => v === "" ? "" : Math.max(0, Math.min(50, +v));

  function save() {
    const out = {
      id: f.id, cat: f.cat, prenom: f.prenom?.trim() || "", nom: f.nom?.trim() || "",
      dob: f.dob || "", taille: f.taille || "", poids: f.poids || "", poste: f.poste || "",
      pied: f.pied || "", numero: f.numero || "", photo: f.photo || "",
      licence: f.licence || "", club: f.club || "",
      parentNom: f.parentNom || "", parentTel: f.parentTel || "", parentEmail: f.parentEmail || "",
      vma: f.vma || "", v10: f.v10 || "", v20: f.v20 || "", v40: f.v40 || "",
      tests: f.tests || [],
      jonglages: { fort: f.jong_fort, faible: f.jong_faible, tete: f.jong_tete },
    };
    onSave(out);
  }

  return (
    <Modal title={joueur.id ? "Modifier le joueur" : "Nouveau joueur"} onClose={onClose}
      footer={<Btn variant="accent" full onClick={save}><Save size={16} /> Enregistrer</Btn>}>
      <Field label="Photo du joueur">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PhotoFiche p={f} w={64} h={82} />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.grisClair, color: C.encre, fontWeight: 700, fontSize: 13.5, padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}>
            <Camera size={15} /> {f.photo ? "Changer la photo" : "Ajouter une photo"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const file = e.target.files && e.target.files[0]; if (file) compresserImage(file, 360, (d) => set("photo", d)); }} />
          </label>
          {f.photo && <Btn variant="danger" size="sm" onClick={() => set("photo", "")}><Trash2 size={15} /></Btn>}
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Prénom"><Inp value={f.prenom || ""} onChange={(e) => set("prenom", e.target.value)} /></Field>
        <Field label="Nom"><Inp value={f.nom || ""} onChange={(e) => set("nom", e.target.value)} /></Field>
      </div>
      <Field label="Date de naissance"><Inp type="date" value={f.dob || ""} onChange={(e) => set("dob", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Taille (cm)"><Inp type="number" value={f.taille || ""} onChange={(e) => set("taille", e.target.value)} /></Field>
        <Field label="Poids (kg)"><Inp type="number" value={f.poids || ""} onChange={(e) => set("poids", e.target.value)} /></Field>
      </div>
      <Field label="Poste">
        <Sel value={f.poste || ""} onChange={(e) => set("poste", e.target.value)}>
          <option value="">Choisir un poste</option>
          {POSTES.map((p) => <option key={p}>{p}</option>)}
        </Sel>
      </Field>
      <Field label="Pied fort">
        <Sel value={f.pied || ""} onChange={(e) => set("pied", e.target.value)}>
          <option value="">Choisir</option>
          <option>Droitier</option><option>Gaucher</option><option>Ambidextre</option>
        </Sel>
      </Field>
      <Field label="Numéro de maillot"><Inp type="number" min="1" value={f.numero || ""} onChange={(e) => set("numero", e.target.value)} placeholder="Optionnel" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Numéro de licence"><Inp value={f.licence || ""} onChange={(e) => set("licence", e.target.value)} placeholder="Optionnel" /></Field>
        <Field label="Club"><Inp value={f.club || ""} onChange={(e) => set("club", e.target.value)} placeholder="FC Sochaux-Montbéliard" /></Field>
      </div>

      <div style={{ fontWeight: 800, margin: "8px 0", color: C.bleu }}>Parents / responsable</div>
      <Field label="Responsable (nom)"><Inp value={f.parentNom || ""} onChange={(e) => set("parentNom", e.target.value)} placeholder="Nom du parent ou tuteur" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Téléphone"><Inp type="tel" value={f.parentTel || ""} onChange={(e) => set("parentTel", e.target.value)} placeholder="06 12 34 56 78" /></Field>
        <Field label="Email / contact"><Inp value={f.parentEmail || ""} onChange={(e) => set("parentEmail", e.target.value)} /></Field>
      </div>

      <div style={{ fontWeight: 800, margin: "8px 0", color: C.bleu }}>Jonglages (max 50)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Pied fort"><Inp type="number" min="0" max="50" value={f.jong_fort} onChange={(e) => set("jong_fort", cap50(e.target.value))} /></Field>
        <Field label="Pied faible"><Inp type="number" min="0" max="50" value={f.jong_faible} onChange={(e) => set("jong_faible", cap50(e.target.value))} /></Field>
        <Field label="Tête"><Inp type="number" min="0" max="50" value={f.jong_tete} onChange={(e) => set("jong_tete", cap50(e.target.value))} /></Field>
      </div>

      <div style={{ fontSize: 12.5, color: C.gris, marginTop: 10, background: C.fond, padding: 11, borderRadius: 11 }}>
        Les tests VMA et vitesse se saisissent depuis la fiche du joueur, bouton « Nouveau test », pour conserver l'historique et le graphique d'évolution.
      </div>
    </Modal>
  );
}

/* ============================================================
   Composition d'equipe
   ============================================================ */
function Compo({ players, cat, catInfo, db, mutate }) {
  const formationsDispo = Object.keys(FORMATIONS[catInfo.type]);
  const matchsCat = (db.matches || []).filter((m) => m.cat === cat).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const matchProchain = matchsCat.find((m) => (m.date || "") >= aujourdhui);
  const matchDefaut = matchProchain ? matchProchain.id : (matchsCat.length ? matchsCat[matchsCat.length - 1].id : "");
  const [matchSel, setMatchSel] = useState(matchDefaut);
  const key = matchSel || cat;
  const lineup = db.lineups[key] || { formation: formationsDispo[0], slots: {}, remplacants: [] };
  const formation = FORMATIONS[catInfo.type][lineup.formation] || FORMATIONS[catInfo.type][formationsDispo[0]];
  const remplacants = lineup.remplacants || [];
  const capitaine = lineup.capitaine || null;
  const GK_COL = "#2FA36B"; // couleur distincte du gardien
  const [pick, setPick] = useState(null);       // index de slot a remplir
  const [pickRempl, setPickRempl] = useState(false);

  // Convoqués : 12 maxi en foot à 8, 16 maxi (14 à 16) en foot à 11
  const maxConvoques = catInfo.type === 8 ? 12 : catInfo.type === 11 ? 16 : formation.length + 4;
  const maxRempl = maxConvoques - formation.length; // 4 en foot à 8, 5 en foot à 11

  function setFormation(name) {
    mutate((d) => {
      const ex = d.lineups[key] || {};
      d.lineups[key] = { formation: name, slots: ex.slots || {}, remplacants: ex.remplacants || [], capitaine: ex.capitaine || null };
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
        Système au choix de l'éducateur · Foot à {catInfo.type}. Touche un poste pour placer un joueur, puis désigner le capitaine.
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
        <Modal title="Ajouter un remplaçant" onClose={() => setPickRempl(false)}>
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
  const tous = db.matches.filter((m) => m.cat === cat).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const matches = filtre === "Tous" ? tous : tous.filter((m) => (m.type || "Championnat") === filtre);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Matchs {cat}</h2>
        <Btn variant="accent" size="sm" onClick={() => setEdit({ cat, lieu: "Domicile", type: "Championnat" })}><Plus size={16} /> Match</Btn>
      </div>

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
          {exterieur && (<><div style={{ fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><MapPin size=u} /> Terrain et vestiaires</div>
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

      {exterieur && (<><div style={{ fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><MapPin size=u} /> Transport</div>
      <div style={{ fontSize: 12, color: C.gris, marginBottom: 10 }}>{exterieur ? "Match à l'extérieur : choisis le transport." : "Surtout utile pour les matchs à l'extérieur."}</div>
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

      </>)}<div style={{ fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}><ShieldAlert size={17} coC.bleu} /> Encadrement</div>
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
  const [noteFor, setNoteFor] = useState(null); // joueur en cours de notation
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
  const [sous, setSous] = useState("planning"); // planning | infirmerie
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
                      {b.zone || "Blessure"} · début {b.debut ? new Date(b.debut).toLocaleDateString("fr-FR") : "?"} · arrêt estimé {b.duree || "?"}
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
    let pr = 0, ab = 0, bl = 0;
    pointees.forEach((s) => {
      const st = s.presence[p.id];
      if (st === "present") pr++; else if (st === "absent") ab++; else if (st === "blesse") bl++;
    });
    const taux = total ? Math.round((pr / total) * 100) : 0;
    return { p, pr, ab, bl, taux };
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
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {rows.map(({ p, pr, ab, bl, taux }) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", background: "#fff", borderRadius: 11, border: `1px solid ${C.grisClair}` }}>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 14, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.prenom} {p.nom}</div>
                <Pastille bg="#E2F4E9" color={C.vert}>{pr}</Pastille>
                <Pastille bg="#FBE3E3" color={C.rouge}>{ab}</Pastille>
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
  const opts = [["present", "Présent", C.vert], ["absent", "Absent", C.rouge], ["blesse", "Blessé", C.jauneFonce]];
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
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{p.prenom} {p.nom}</div>
              {opts.map(([val, lab, col]) => {
                const on = f.presence[p.id] === val;
                return (
                  <button key={val} onClick={() => setP(p.id, on ? null : val)} style={{
                    border: "none", cursor: "pointer", borderRadius: 9, padding: "6px 9px", fontSize: 12, fontWeight: 800,
                    background: on ? col : C.grisClair, color: on ? "#fff" : C.gris,
                  }}>{lab}</button>
                );
              })}
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
        onSave={(s) => { mutate((d) => { s.id ? (d.scouting[d.scouting.findIndex((x) => x.id === s.id)] = s) : d.scouting.push({ ...s, id: uid(), date: new Date().toISOString().slice(0, 10) }); return d; }); setEdit(null); }}
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
