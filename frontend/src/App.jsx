import { useState } from "react";
import MedicineLookup from "./MedicineLookup.jsx";
import InteractionChecker from "./InteractionChecker.jsx";

const TABS = [
  { id: "lookup", label: "Medicine Info" },
  { id: "interactions", label: "Interaction Checker" },
];

export default function App() {
  const [tab, setTab] = useState("lookup");

  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className="page">
        <header className="hero">
          <div className="logo" aria-hidden="true">
            <span className="pill" />
          </div>
          <h1>AI Prescription</h1>
          <p className="subtitle">
            {tab === "lookup"
              ? "Enter a medicine name to see its standard prescription information."
              : "Enter two or more medicines to check if they are safe to take together."}
          </p>
        </header>

        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <span className="tab-indicator" style={{ "--tab": TABS.findIndex((t) => t.id === tab) }} />
        </nav>

        {/* Keep both mounted so each tab remembers its input and result when switching. */}
        <div hidden={tab !== "lookup"}>
          <MedicineLookup />
        </div>
        <div hidden={tab !== "interactions"}>
          <InteractionChecker />
        </div>

        <footer className="disclaimer">
          This information is AI-generated for educational purposes only and is not a substitute for advice from a
          doctor or pharmacist. Always consult a healthcare professional before taking any medicine.
        </footer>
      </div>
    </>
  );
}
