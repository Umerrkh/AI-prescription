import { useState } from "react";
import { postJson } from "./api.js";

const MAX_MEDICINES = 5;

const SEVERITY_LABELS = {
  none: "No known interaction",
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};

export default function InteractionChecker() {
  const [medicines, setMedicines] = useState(["", ""]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const filled = medicines.map((m) => m.trim()).filter(Boolean);

  function update(index, value) {
    setMedicines((list) => list.map((m, i) => (i === index ? value : m)));
  }

  function addField() {
    if (medicines.length < MAX_MEDICINES) setMedicines((list) => [...list, ""]);
  }

  function removeField(index) {
    setMedicines((list) => list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (filled.length < 2 || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await postJson("/api/interactions", { medicines: filled }));
    } catch (err) {
      setError(err.message);
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <form onSubmit={handleSubmit} className="interaction-form">
        <div className="med-fields">
          {medicines.map((value, i) => (
            <div key={i} className="med-field" style={{ "--i": i }}>
              <span className="med-num">{i + 1}</span>
              <input
                type="text"
                placeholder={i === 0 ? "e.g. Warfarin" : i === 1 ? "e.g. Aspirin" : "Another medicine"}
                value={value}
                onChange={(e) => update(i, e.target.value)}
                maxLength={100}
              />
              {medicines.length > 2 && (
                <button type="button" className="icon-btn" onClick={() => removeField(i)} aria-label="Remove medicine">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={addField}
            disabled={medicines.length >= MAX_MEDICINES}
          >
            + Add medicine
          </button>
          <button type="submit" className="primary-btn" disabled={loading || filled.length < 2}>
            {loading ? <span className="spinner" aria-label="Loading" /> : "Check Interactions"}
          </button>
        </div>
      </form>

      {error && (
        <div key={errorKey} className="error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="card skeleton" aria-label="Loading">
          <div className="sk sk-title" />
          <div className="sk sk-line" />
          <div className="sk sk-line short" />
        </div>
      )}

      {result && (
        <article key={result.medicines.join("|")} className={`card result severity-${result.overall_severity}`}>
          <div className="verdict">
            <span className={`badge badge-${result.overall_severity}`}>
              {SEVERITY_LABELS[result.overall_severity] || result.overall_severity}
            </span>
            <div className="verdict-meds">{result.medicines.join(" + ")}</div>
          </div>
          <p className="verdict-summary">{result.summary}</p>

          {result.interactions?.map((item, i) => (
            <div key={i} className="interaction" style={{ "--i": i }}>
              <div className="interaction-head">
                <strong>{item.medicines.join(" + ")}</strong>
                <span className={`badge badge-${item.severity}`}>{SEVERITY_LABELS[item.severity] || item.severity}</span>
              </div>
              <p>
                <span className="label">Effect:</span> {item.effect}
              </p>
              <p>
                <span className="label">Advice:</span> {item.advice}
              </p>
            </div>
          ))}
        </article>
      )}
    </div>
  );
}
