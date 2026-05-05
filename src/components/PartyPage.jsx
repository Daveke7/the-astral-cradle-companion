import { HeartPulse, Image, Link2, ScrollText, Shield, Sword, UserRound } from "lucide-react";
import { Tag } from "./ui.jsx";

export function PartyPage({ members, onPatchMember }) {
  return (
    <main className="workspace party-page">
      <header className="topbar">
        <div>
          <p className="label">Mijn Party</p>
          <h1>Party dossiers, gear en persoonlijke hooks</h1>
          <span>Alles wat je als DM snel wilt zien zonder character builder te worden.</span>
        </div>
      </header>

      <section className="party-grid">
        {members.map((member, index) => (
          <article className="party-card" key={member.name}>
            <div className="party-card__media">
              {member.imageUrl ? (
                <img src={member.imageUrl} alt={member.name} loading="lazy" />
              ) : (
                <div className="party-card__placeholder">
                  <UserRound size={32} />
                  <span>Portrait URL</span>
                </div>
              )}
            </div>

            <div className="party-card__body">
              <div className="party-card__head">
                <div>
                  <h2>{member.name}</h2>
                  <span>{member.classSummary}</span>
                </div>
                <Tag tone={member.status?.toLowerCase().includes("tharizdun") ? "danger" : "warning"}>
                  {member.status}
                </Tag>
              </div>

              <label className="field-line">
                <span><Image size={15} /> Image URL</span>
                <input
                  value={member.imageUrl || ""}
                  onChange={(event) => onPatchMember(index, { imageUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>

              <label className="field-line">
                <span><Link2 size={15} /> D&D Beyond URL</span>
                <input
                  value={member.beyondUrl || ""}
                  onChange={(event) => onPatchMember(index, { beyondUrl: event.target.value })}
                  placeholder="https://www.dndbeyond.com/characters/..."
                />
              </label>

              <div className="party-stat-grid">
                {[
                  ["level", "Level"],
                  ["ac", "AC"],
                  ["maxHp", "Max HP"],
                  ["passivePerception", "PP"],
                  ["spellSaveDc", "Spell DC"],
                ].map(([key, label]) => (
                  <label className="field-line" key={key}>
                    <span><HeartPulse size={14} /> {label}</span>
                    <input
                      value={member[key] || ""}
                      onChange={(event) => onPatchMember(index, { [key]: event.target.value })}
                      placeholder="?"
                    />
                  </label>
                ))}
              </div>

              <label className="field-line">
                <span><Sword size={15} /> Huidige gear</span>
                <textarea
                  value={member.gear || ""}
                  onChange={(event) => onPatchMember(index, { gear: event.target.value })}
                  placeholder="Magic items, wapens, attunement, belangrijke consumables."
                />
              </label>

              <label className="field-line">
                <span><Shield size={15} /> Status / conditions</span>
                <input
                  value={member.conditions || ""}
                  onChange={(event) => onPatchMember(index, { conditions: event.target.value })}
                  placeholder="Blessed, cursed, injured, debt, exhaustion..."
                />
              </label>

              <label className="field-line">
                <span><ScrollText size={15} /> DM notes</span>
                <textarea
                  value={member.notes || ""}
                  onChange={(event) => onPatchMember(index, { notes: event.target.value })}
                  placeholder="Belangrijke keuzes, geheimen, beloftes, persoonlijke payoff."
                />
              </label>

              <div className="party-spotlight">
                <span className="label">Spotlight hook</span>
                <textarea
                  value={member.spotlight || ""}
                  onChange={(event) => onPatchMember(index, { spotlight: event.target.value })}
                  placeholder="Hoe krijgt deze PC deze sessie een persoonlijk moment?"
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
