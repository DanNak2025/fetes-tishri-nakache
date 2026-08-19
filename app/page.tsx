"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "yes" | "no" | "maybe";
type Planning = { names: string[]; people: number[]; attendance: Record<string, Status> };

const events = [
  { id: "rh-vendredi", name: "Roch Hachana · Vendredi soir", date: "Vendredi 11 septembre 2026" },
  { id: "rh-samedi-midi", name: "Roch Hachana · Samedi après-midi", date: "Samedi 12 septembre 2026" },
  { id: "rh-samedi-soir", name: "Roch Hachana · Samedi soir", date: "Samedi 12 septembre 2026" },
  { id: "rh-dimanche", name: "Roch Hachana · Dimanche après-midi", date: "Dimanche 13 septembre 2026" },
  { id: "kippour-veille", name: "Kippour · Dimanche soir", date: "Dimanche 20 septembre 2026" },
  { id: "kippour-fin", name: "Kippour · Casser le jeûne", date: "Lundi 21 septembre 2026 · soir" },
  { id: "sukkot-vendredi", name: "Souccot · Vendredi soir", date: "Vendredi 25 septembre 2026" },
  { id: "sukkot-samedi", name: "Souccot · Samedi après-midi", date: "Samedi 26 septembre 2026" },
  { id: "simha-vendredi", name: "Simha Torah", date: "Vendredi 2 octobre 2026" },
  { id: "simha-samedi", name: "Simha Torah", date: "Samedi 3 octobre 2026" },
];
const defaultPlanning: Planning = { names: ["Personne 1", "Personne 2", "Personne 3", "Personne 4", "Personne 5"], people: [1, 1, 1, 1, 1], attendance: {} };
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
  const answeredCount = Object.keys(planning.attendance).length;
  const totalAnswers = events.length * planning.names.length;
  const completion = Math.round((answeredCount / totalAnswers) * 100);
  const setStatus = (eventId: string, personIndex: number, status: Status) => {
    const key = `${eventId}-${personIndex}`;
    const attendance = { ...planning.attendance };
    if (attendance[key] === status) delete attendance[key];
    else attendance[key] = status;
    savePlanning({ ...planning, attendance });
  };
  const updateName = (index: number, name: string) => savePlanning({ ...planning, names: planning.names.map((item, itemIndex) => itemIndex === index ? name : item) });
  const updatePeople = (index: number, count: number) => savePlanning({ ...planning, people: planning.people.map((item, itemIndex) => itemIndex === index ? Math.max(1, Math.min(20, count || 1)) : item) });

  return <main>
    <section className="hero"><div className="hero-spark one">✦</div><div className="hero-spark two">✧</div><div className="eyebrow">Tichri 5787 · 2026</div><h1>Qui vient aux fêtes ?</h1><p>Le planning familial partagé, pour se retrouver tous ensemble.</p><div className="hero-bottom"><div className="hero-note"><span>♥</span> {comingCount} présence{comingCount > 1 ? "s" : ""} · {saving ? "enregistrement…" : loaded ? "synchronisé" : "chargement…"}</div><div className="progress"><span>{completion}% répondu</span><div><i style={{ width: `${completion}%` }} /></div></div></div></section>
    <section className="names" aria-labelledby="names-title"><div><h2>La famille</h2><p>Écrivez les prénoms et le nombre de personnes de chaque famille.</p></div><div className="name-grid">{planning.names.map((name, index) => <div key={index} className="family-card"><label className="name-field"><span>{index + 1}</span><input aria-label={`Prénom de la personne ${index + 1}`} value={name} onChange={(event) => updateName(index, event.target.value)} /></label><label className="people-field"><span>Personnes</span><input aria-label={`Nombre de personnes pour ${name}`} type="number" min="1" max="20" value={planning.people[index] ?? 1} onChange={(event) => updatePeople(index, Number(event.target.value))} /></label></div>)}</div></section>
    <section className="summary" aria-labelledby="summary-title"><div><h2 id="summary-title">Récapitulatif</h2><p>Les réponses manquantes apparaissent ici.</p></div><div className="summary-table"><div className="summary-head"><span>Famille</span><span>Présent</span><span>Pas encore répondu</span></div>{planning.names.map((name, index) => { const count = events.filter((event) => planning.attendance[`${event.id}-${index}`] === "yes").length; const missing = events.filter((event) => !planning.attendance[`${event.id}-${index}`]).length; return <div className="summary-row" key={index}><span>{name.trim() || `Personne ${index + 1}`} <small>· {planning.people[index] ?? 1} personnes</small></span><strong>{count} / {events.length}</strong><em>{missing ? `${missing} en attente` : "Tout répondu"}</em></div>; })}</div></section>
    <section className="planner" aria-labelledby="planner-title"><div className="section-title"><div><h2 id="planner-title">Le planning</h2><p>Chaque personne choisit sa réponse. Les changements sont visibles par tous.</p></div><span className="answer-count">{answeredCount} / {totalAnswers} réponses</span></div><div className="legend"><span><b className="yes">✓</b> Je viens</span><span><b className="maybe">?</b> Pas sûr</span><span><b className="no">–</b> Je ne viens pas</span></div><div className="event-list">{events.map((event) => { const confirmed = planning.names.reduce((total, _, index) => total + (planning.attendance[`${event.id}-${index}`] === "yes" ? planning.people[index] ?? 1 : 0), 0); return <article className="event" key={event.id}><header><div className="calendar"><strong>{event.date.split(" ")[0].slice(0, 3)}</strong><span>{event.date.match(/\d+/)?.[0]}</span></div><div><h3>{event.name}</h3><p>{event.date}</p></div><small>{confirmed} personne{confirmed > 1 ? "s" : ""}</small></header><div className="responses">{planning.names.map((name, personIndex) => { const current = planning.attendance[`${event.id}-${personIndex}`]; return <div className="response" key={personIndex}><span className="person-name">{name.trim() || `Personne ${personIndex + 1}`} · {planning.people[personIndex] ?? 1} pers.</span><div className="choices" aria-label={`Présence de ${name} pour ${event.name}`}>{statuses.map((status) => <button key={status.key} title={status.label} aria-label={status.label} className={`${status.key} ${current === status.key ? "selected" : ""}`} onClick={() => setStatus(event.id, personIndex, status.key)}>{status.icon}</button>)}</div></div>; })}</div></article>; })}</div></section>
    <p className="footnote">Les réponses sont partagées avec toutes les personnes qui ont le lien.</p>
  </main>;
}
