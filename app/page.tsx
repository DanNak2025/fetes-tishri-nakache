"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "yes" | "no" | "maybe";
type Planning = { names: string[]; attendance: Record<string, Status> };

const events = [
  { id: "rh1", name: "Roch Hachana · 1er jour", date: "Samedi 12 septembre 2026" },
  { id: "rh2", name: "Roch Hachana · 2e jour", date: "Dimanche 13 septembre 2026" },
  { id: "kippour", name: "Kippour", date: "Lundi 21 septembre 2026" },
  { id: "sukkot", name: "Sukkot", date: "Samedi 26 septembre 2026" },
  { id: "simhat", name: "2e fête · Sim'hat Torah", date: "Dimanche 4 octobre 2026" },
];
const defaultPlanning: Planning = { names: ["Personne 1", "Personne 2", "Personne 3", "Personne 4", "Personne 5"], attendance: {} };
const statuses: { key: Status; label: string; icon: string }[] = [
  { key: "yes", label: "Je viens", icon: "✓" },
  { key: "maybe", label: "Pas sûr", icon: "?" },
  { key: "no", label: "Je ne viens pas", icon: "–" },
];

export default function Home() {
  const [planning, setPlanning] = useState<Planning>(defaultPlanning);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPlanning = useCallback(async () => {
    const response = await fetch("/api/planning", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger le planning");
    const data = await response.json() as Planning;
    setPlanning(data);
  }, []);

  useEffect(() => {
    loadPlanning().catch(() => undefined).finally(() => setLoaded(true));
    const timer = window.setInterval(() => loadPlanning().catch(() => undefined), 8000);
    return () => window.clearInterval(timer);
  }, [loadPlanning]);

  const savePlanning = async (next: Planning) => {
    setPlanning(next);
    setSaving(true);
    try {
      await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
    } finally { setSaving(false); }
  };

  const comingCount = useMemo(() => events.reduce((total, event) => total + planning.names.filter((_, index) => planning.attendance[`${event.id}-${index}`] === "yes").length, 0), [planning]);
  const setStatus = (eventId: string, personIndex: number, status: Status) => savePlanning({ ...planning, attendance: { ...planning.attendance, [`${eventId}-${personIndex}`]: status } });
  const updateName = (index: number, name: string) => savePlanning({ ...planning, names: planning.names.map((item, itemIndex) => itemIndex === index ? name : item) });

  return <main>
    <section className="hero"><div className="eyebrow">Tichri 5787 · 2026</div><h1>Qui vient aux fêtes ?</h1><p>Le planning est partagé : tout le monde voit les réponses en direct.</p><div className="hero-note"><span>♥</span> {comingCount} présence{comingCount > 1 ? "s" : ""} · {saving ? "enregistrement…" : loaded ? "synchronisé" : "chargement…"}</div></section>
    <section className="names" aria-labelledby="names-title"><div><h2>La famille</h2><p>Écrivez les prénoms des 5 frères et sœurs.</p></div><div className="name-grid">{planning.names.map((name, index) => <label key={index} className="name-field"><span>{index + 1}</span><input aria-label={`Prénom de la personne ${index + 1}`} value={name} onChange={(event) => updateName(index, event.target.value)} /></label>)}</div></section>
    <section className="summary" aria-labelledby="summary-title"><div><h2 id="summary-title">Récapitulatif</h2><p>Nombre de jours confirmés pour chaque personne.</p></div><div className="summary-table"><div className="summary-head"><span>Personne</span><span>Jours présents</span></div>{planning.names.map((name, index) => { const count = events.filter((event) => planning.attendance[`${event.id}-${index}`] === "yes").length; return <div className="summary-row" key={index}><span>{name.trim() || `Personne ${index + 1}`}</span><strong>{count} / {events.length}</strong></div>; })}</div></section>
    <section className="planner" aria-labelledby="planner-title"><div className="section-title"><div><h2 id="planner-title">Le planning</h2><p>Chaque personne choisit sa réponse. Les changements sont visibles par tous.</p></div></div><div className="legend"><span><b className="yes">✓</b> Je viens</span><span><b className="maybe">?</b> Pas sûr</span><span><b className="no">–</b> Je ne viens pas</span></div><div className="event-list">{events.map((event) => <article className="event" key={event.id}><header><div className="calendar"><strong>{event.date.split(" ")[0].slice(0, 3)}</strong><span>{event.date.match(/\d+/)?.[0]}</span></div><div><h3>{event.name}</h3><p>{event.date}</p></div></header><div className="responses">{planning.names.map((name, personIndex) => { const current = planning.attendance[`${event.id}-${personIndex}`]; return <div className="response" key={personIndex}><span className="person-name">{name.trim() || `Personne ${personIndex + 1}`}</span><div className="choices" aria-label={`Présence de ${name} pour ${event.name}`}>{statuses.map((status) => <button key={status.key} title={status.label} aria-label={status.label} className={`${status.key} ${current === status.key ? "selected" : ""}`} onClick={() => setStatus(event.id, personIndex, status.key)}>{status.icon}</button>)}</div></div>; })}</div></article>)}</div></section>
    <p className="footnote">Les réponses sont partagées avec toutes les personnes qui ont le lien.</p>
  </main>;
}
