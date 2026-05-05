import { AlertTriangle, BookOpenCheck, Eye, Flag, Layers3, Radio, Sparkles, Target } from "lucide-react";
import { campaign, npcs, quests } from "../data/campaignData.js";
import { DmOnly, EmptyState, Meter, Panel, Tag } from "./ui.jsx";

const panicPrompts = [
  {
    id: "soft-clue",
    title: "Zachte clue",
    type: "Clue",
    text: "Laat een detail terugkomen: een groen litteken, Thayaans rood lint, ontbrekende sterren in een reflectie.",
  },
  {
    id: "npc-pressure",
    title: "NPC druk",
    type: "NPC",
    text: "Een NPC vraagt nu om een belofte, gunst of keuze. Klein, persoonlijk, direct speelbaar.",
  },
  {
    id: "cost",
    title: "Succes kost iets",
    type: "Pacing",
    text: "Geef succes een prijs: tijd, hit dice, rations, Azaka's vertrouwen, of een spoor dat kouder wordt.",
  },
  {
    id: "red-wizard-shadow",
    title: "Thay beweegt",
    type: "Threat",
    text: "Toon bewijs dat Zorath voorloopt zonder hem te tonen: as, conjuration-residu, een perfecte cirkel in modder.",
  },
];

const aiPrepContract = [
  "## Scene: Titel",
  "Doel, Conflict, Read-aloud, Clues, Player-safe, DM-only",
  "## NPC: Naam met role, wants, fear, secret, player-safe",
  "## Encounter: Naam met objective, terrain, timer, monsters",
  "## Handout: Titel met Visibility",
  "## Loot: Titel met eigenaar, status, player-safe",
  "## Canon risks: namen of geheimen die niet mogen lekken",
];

const sceneStatuses = ["unseen", "scouted", "active", "cleared", "skipped"];

function deriveContinuityWarnings({ scenes, workspace }) {
  const warnings = [...campaign.warnings.map((warning) => ({ ...warning, source: "Canon" }))];
  const activeQuestLinks = quests.map((quest) => `${quest.title} ${quest.linked} ${quest.dmTruth}`.toLowerCase());
  const knownSceneText = scenes.map((scene) => `${scene.title} ${scene.clues?.join(" ")} ${scene.dmOnly}`).join(" ").toLowerCase();

  if (knownSceneText.includes("astral cradle")) {
    warnings.push({
      title: "Astral Cradle lekt in prep",
      detail: "De naam staat in sessiemateriaal. Check of dit DM-only blijft.",
      source: "Parser",
    });
  }

  if (activeQuestLinks.some((text) => text.includes("sparkwing")) && !workspace.campaignOs.continuityAcknowledged.includes("sparkwing")) {
    warnings.push({
      title: "Sparkwing referentie checken",
      detail: "Sparkwing is dood. Als hij in questtekst voorkomt, moet het historisch of symbolisch zijn.",
      source: "Continuity",
    });
  }

  if (!workspace.playerView.publishedSceneIds.length) {
    warnings.push({
      title: "Player View is leeg",
      detail: "Publiceer minimaal huidige locatie of eerste veilige scene voordat je aan tafel start.",
      source: "Runtime",
    });
  }

  return warnings;
}

function clueKey(sceneId, clue) {
  return `${sceneId}::${clue}`;
}

export function CampaignOs({
  workspace,
  scenes,
  parsedPrep,
  prepQuality,
  onNavigate,
  onSetActiveScene,
  onPublishScene,
  onSetClueStatus,
  onAddPanicPrompt,
  onPatchCampaignOs,
  onUpdateFactionClock,
  onUpdateFirefinger,
  onUpdateFirefingerLevel,
  onAddConsequence,
  partyMembers,
}) {
  const activeScene =
    scenes.find((scene) => scene.id === workspace.runtime.activeSceneId) ||
    scenes.find((scene) => !workspace.runtime.completedSceneIds.includes(scene.id)) ||
    scenes[0];
  const warnings = deriveContinuityWarnings({ scenes, workspace });
  const foundClues = Object.values(workspace.campaignOs.clueLedger).filter((item) => item.status === "found").length;
  const revealedClues = Object.values(workspace.campaignOs.clueLedger).filter((item) => item.status === "revealed").length;
  const activeQuests = quests.filter((quest) => quest.status === "Active");
  const debriefDraft = [
    `Sessie: ${activeScene.title}`,
    `Afgeronde scenes: ${workspace.runtime.completedSceneIds.length}/${scenes.length}`,
    `Gevonden clues: ${foundClues}`,
    `Gerevealede clues: ${revealedClues}`,
    `Player-safe updates: ${workspace.playerView.publishedCards.length}`,
    "",
    "Open hooks:",
    ...activeQuests.map((quest) => `- ${quest.title}: ${quest.next}`),
    "",
    "DM-notities:",
    workspace.campaignOs.debriefNotes || "- Nog invullen na de sessie.",
  ].join("\n");

  return (
    <main className="workspace os-layout">
      <header className="topbar">
        <div>
          <p className="label">Campaign OS</p>
          <h1>Command center voor {campaign.activeCampaign}</h1>
          <span>Prep, runtime, clues en Player View in een strak DM-overzicht.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={() => onNavigate("prep")}>
            <Sparkles size={18} /> AI Prep
          </button>
          <button className="button button--primary" type="button" onClick={() => onNavigate("runtime")}>
            <Radio size={18} /> Live Runtime
          </button>
        </div>
      </header>

      <section className="os-command">
        <Panel title="Session Command Deck" className="os-live-panel">
          <div className="os-scene-focus">
            <div>
              <Tag tone="danger">{workspace.campaignOs.threatLevel}</Tag>
              <h2>{activeScene.title}</h2>
              <p>{activeScene.goal}</p>
            </div>
            <div className="os-actions">
              <button className="button button--ghost" type="button" onClick={() => onSetActiveScene(activeScene.id)}>
                <Target size={18} /> Actief
              </button>
              <button className="button button--primary" type="button" onClick={() => onPublishScene(activeScene.id)}>
                <Eye size={18} /> Publiceer veilig
              </button>
            </div>
          </div>
          <div className="os-metrics">
            <div><strong>{workspace.runtime.completedSceneIds.length}/{scenes.length}</strong><span>scenes klaar</span></div>
            <div><strong>{foundClues}</strong><span>clues gevonden</span></div>
            <div><strong>{revealedClues}</strong><span>clues gerevealed</span></div>
            <div><strong>{workspace.playerView.publishedCards.length}</strong><span>publicaties</span></div>
          </div>
          <div className="command-deck">
            <article>
              <span className="label">Read-aloud</span>
              <p>{activeScene.readAloud || "Geen read-aloud gevonden. Gebruik de AI Prep Contract regels voor betere import."}</p>
            </article>
            <article>
              <span className="label">Wat als spelers chaos kiezen?</span>
              <p>Laat de omgeving reageren, niet blokkeren: lawaai verhoogt Firefinger alert, tijdverlies beweegt Zorath, succes kost supplies of vertrouwen.</p>
            </article>
            <article>
              <span className="label">Player-safe voorstel</span>
              <p>{activeScene.playerSafe}</p>
            </article>
          </div>
        </Panel>

        <Panel title="Continuity Guard">
          <div className="warning-stack">
            {warnings.map((warning) => (
              <DmOnly key={`${warning.source}-${warning.title}`}>
                <strong>{warning.title}</strong> - {warning.detail}
              </DmOnly>
            ))}
          </div>
        </Panel>
      </section>

      <section className="os-grid">
        <Panel title="PC Spotlight Engine">
          <div className="spotlight-list">
            {partyMembers.map((member) => (
              <article key={member.name}>
                <div className="avatar-slot">{member.name.slice(0, 2)}</div>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.spotlight || member.hook}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Clue ledger">
          <div className="clue-ledger">
            {scenes.slice(0, 6).map((scene) =>
              (scene.clues || []).map((clue) => {
                const state = workspace.runtime.clueStatuses[clueKey(scene.id, clue)]?.status || "hidden";
                return (
                  <article key={clueKey(scene.id, clue)} className="ledger-row">
                    <div>
                      <strong>{clue}</strong>
                      <span>{scene.title}</span>
                    </div>
                    <div className="mini-actions">
                      {["hidden", "found", "revealed"].map((status) => (
                        <button
                          className={state === status ? "mini-toggle mini-toggle--active" : "mini-toggle"}
                          key={status}
                          type="button"
                          onClick={() => onSetClueStatus(scene.id, clue, status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Panel>

        <Panel title="Firefinger Vertical Dungeon">
          <div className="split-tags">
            <Tag tone="warning">Alert {workspace.campaignOs.firefinger.alert}%</Tag>
            <Tag tone="danger">Noise {workspace.campaignOs.firefinger.partyNoise}%</Tag>
          </div>
          <div className="firefinger-controls">
            <label>
              Alert
              <input
                type="range"
                min="0"
                max="100"
                value={workspace.campaignOs.firefinger.alert}
                onChange={(event) => onUpdateFirefinger({ alert: Number(event.target.value) })}
              />
            </label>
            <label>
              Party noise
              <input
                type="range"
                min="0"
                max="100"
                value={workspace.campaignOs.firefinger.partyNoise}
                onChange={(event) => onUpdateFirefinger({ partyNoise: Number(event.target.value) })}
              />
            </label>
          </div>
          <div className="level-stack">
            {workspace.campaignOs.firefinger.levels.map((level) => (
              <article key={level.id}>
                <div>
                  <strong>{level.name}</strong>
                  <span>{level.notes}</span>
                </div>
                <select value={level.status} onChange={(event) => onUpdateFirefingerLevel(level.id, { status: event.target.value })}>
                  {sceneStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="AI Prep gezondheid">
          <div className="quality-card">
            <div>
              <strong>{prepQuality.score}%</strong>
              <span>Format {prepQuality.label}</span>
            </div>
            <Meter value={prepQuality.score} tone={prepQuality.score < 65 ? "danger" : "accent"} />
          </div>
          <div className="split-tags">
            <Tag>{prepQuality.counts.scenes} scenes</Tag>
            <Tag>{prepQuality.counts.encounters} encounters</Tag>
            <Tag>{prepQuality.counts.handouts} handouts</Tag>
            <Tag>{parsedPrep.cards.length} cards</Tag>
          </div>
          {prepQuality.warnings.length ? (
            <ul className="rule-list">
              {prepQuality.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : (
            <EmptyState>Import is strak genoeg voor runtime.</EmptyState>
          )}
        </Panel>

        <Panel title="AI Prep Contract">
          <ul className="rule-list">
            {aiPrepContract.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </Panel>

        <Panel title="NPC Board">
          <div className="npc-mini-list">
            {npcs.slice(0, 6).map((npc) => (
              <div className="npc-mini" key={npc.name}>
                <div className="avatar-slot">{npc.name.slice(0, 2)}</div>
                <div>
                  <strong>{npc.name}</strong>
                  <span>{npc.relationship}</span>
                </div>
                <Tag tone={npc.status === "Hostile" ? "danger" : npc.status === "Ally" ? "safe" : "warning"}>{npc.status}</Tag>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Faction & Villain Moves">
          <div className="faction-clock-list">
            {workspace.campaignOs.factionClocks.map((clock) => (
              <article key={clock.id}>
                <div>
                  <strong>{clock.name}</strong>
                  <span>{clock.nextMove}</span>
                </div>
                <Meter value={clock.progress} tone={clock.progress > 60 ? "danger" : "accent"} />
                <div className="hp-actions">
                  <button type="button" onClick={() => onUpdateFactionClock(clock.id, { progress: Math.max(0, clock.progress - 10) })}>-</button>
                  <button type="button" onClick={() => onUpdateFactionClock(clock.id, { progress: Math.min(100, clock.progress + 10) })}>+</button>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Consequence Tracker">
          <form
            className="consequence-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onAddConsequence({
                choice: form.get("choice"),
                visible: form.get("visible"),
                hidden: form.get("hidden"),
                payoff: form.get("payoff"),
              });
              event.currentTarget.reset();
            }}
          >
            <input name="choice" placeholder="Keuze of actie" required />
            <input name="visible" placeholder="Zichtbare uitkomst" />
            <input name="hidden" placeholder="Verborgen gevolg" />
            <input name="payoff" placeholder="Wanneer payoff?" />
            <button className="button button--ghost" type="submit">
              <Flag size={16} /> Vastleggen
            </button>
          </form>
          <div className="list-stack">
            {workspace.campaignOs.consequences.slice(0, 5).map((item) => (
              <article className="quest-mini" key={item.id}>
                <Tag tone="warning">Consequence</Tag>
                <strong>{item.choice}</strong>
                <span>{item.visible || "Nog geen zichtbare uitkomst"} / {item.hidden || "Geen verborgen gevolg ingevuld"}</span>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Panic prompts">
          <div className="panic-grid">
            {panicPrompts.map((prompt) => (
              <button key={prompt.id} type="button" onClick={() => onAddPanicPrompt(prompt)}>
                <AlertTriangle size={16} />
                <strong>{prompt.title}</strong>
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Active quests">
          <div className="list-stack">
            {activeQuests.map((quest) => (
              <article className="quest-mini" key={quest.title}>
                <Tag tone="safe">{quest.type}</Tag>
                <strong>{quest.title}</strong>
                <span>{quest.next}</span>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Session Debrief Generator">
          <div className="debrief-tools">
            <textarea
              value={workspace.campaignOs.debriefNotes}
              onChange={(event) => onPatchCampaignOs({ debriefNotes: event.target.value })}
              placeholder="Ruwe DM-notities na afloop: keuzes, nieuwe hooks, NPC status, loot, afspraken."
            />
            <button className="button button--ghost" type="button" onClick={() => onPatchCampaignOs({ debriefDraft })}>
              <BookOpenCheck size={16} /> Maak debrief
            </button>
            <textarea readOnly value={workspace.campaignOs.debriefDraft || debriefDraft} />
          </div>
        </Panel>

        <Panel title="Player-Safe Publisher">
          <div className="publisher-box">
            <Layers3 size={20} />
            <p>{activeScene.playerSafe}</p>
            <button className="button button--primary" type="button" onClick={() => onPublishScene(activeScene.id)}>
              <Eye size={16} /> Publiceer naar Player View
            </button>
          </div>
        </Panel>
      </section>
    </main>
  );
}
