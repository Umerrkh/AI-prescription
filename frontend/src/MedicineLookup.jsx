import { useState } from "react";
import { postJson } from "./api.js";

const SUGGESTIONS = ["Paracetamol", "Amoxicillin", "Ibuprofen", "Metformin", "Cetirizine"];
const HISTORY_KEY = "ai-prescription-history";
const MAX_HISTORY = 8;

// History is a per-browser convenience; storage can be unavailable, so never let it break the page.
function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

function Section({ title, index, children }) {
  return (
    <section className="section" style={{ "--i": index }}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function List({ items }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i} style={{ "--j": i }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div className="card skeleton" aria-label="Loading">
      <div className="sk sk-title" />
      <div className="sk sk-tags" />
      {[0, 1, 2].map((n) => (
        <div key={n} className="sk-block">
          <div className="sk sk-heading" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
        </div>
      ))}
    </div>
  );
}

export default function MedicineLookup() {
  const [medicine, setMedicine] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);

  function remember(data) {
    setHistory((prev) => {
      const name = data.medicine_name.toLowerCase();
      const next = [data, ...prev.filter((h) => h.medicine_name.toLowerCase() !== name)].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }

  async function lookup(name) {
    name = name.trim();
    if (!name || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await postJson("/api/prescription", { medicine: name });
      setResult(data);
      remember(data);
    } catch (err) {
      setError(err.message);
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  function showFromHistory(item) {
    setMedicine(item.medicine_name);
    setError("");
    setResult(item);
  }

  function removeFromHistory(name) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.medicine_name !== name);
      saveHistory(next);
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  const sections = [];
  if (result) {
    if (result.uses?.length) sections.push(["Uses", <List items={result.uses} />]);
    if (result.dosage)
      sections.push([
        "Dosage",
        <div className="dosage">
          <div className="dose-box">
            <span className="dose-label">Adults</span>
            <p>{result.dosage.adults}</p>
          </div>
          <div className="dose-box">
            <span className="dose-label">Children</span>
            <p>{result.dosage.children}</p>
          </div>
        </div>,
      ]);
    if (result.how_to_take) sections.push(["How to take", <p>{result.how_to_take}</p>]);
    if (result.side_effects?.length) sections.push(["Side effects", <List items={result.side_effects} />]);
    if (result.warnings?.length) sections.push(["Warnings", <List items={result.warnings} />]);
    if (result.interactions?.length) sections.push(["Interactions", <List items={result.interactions} />]);
  }

  return (
    <div className="panel">
      <form onSubmit={(e) => { e.preventDefault(); lookup(medicine); }} className="search">
        <input
          type="text"
          placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen"
          value={medicine}
          onChange={(e) => setMedicine(e.target.value)}
          maxLength={100}
          autoFocus
        />
        <button type="submit" className="primary-btn" disabled={loading || !medicine.trim()}>
          {loading ? <span className="spinner" aria-label="Loading" /> : "Get Prescription"}
        </button>
      </form>

      <div className="chips">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            className="chip"
            style={{ "--i": i }}
            onClick={() => { setMedicine(s); lookup(s); }}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div className="history">
          <div className="history-head">
            <span>Recent searches</span>
            <button type="button" className="link-btn" onClick={clearHistory}>
              Clear all
            </button>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <span key={item.medicine_name} className="history-item">
                <button type="button" onClick={() => showFromHistory(item)} disabled={loading}>
                  {item.medicine_name}
                </button>
                <button
                  type="button"
                  className="history-remove"
                  onClick={() => removeFromHistory(item.medicine_name)}
                  aria-label={`Remove ${item.medicine_name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div key={errorKey} className="error" role="alert">
          {error}
        </div>
      )}

      {loading && <Skeleton />}

      {result && (
        <article key={result.medicine_name} className="card result">
          <div className="card-head">
            <h2>{result.medicine_name}</h2>
            <div className="tags">
              {result.generic_name && <span className="tag">{result.generic_name}</span>}
              {result.drug_class && <span className="tag muted">{result.drug_class}</span>}
            </div>
          </div>

          {sections.map(([title, body], i) => (
            <Section key={title} title={title} index={i}>
              {body}
            </Section>
          ))}
        </article>
      )}
    </div>
  );
}
