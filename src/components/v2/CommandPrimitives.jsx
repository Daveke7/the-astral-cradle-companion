export function CommandModeSwitch({ value, options, onChange, label = "Mode" }) {
  return (
    <div className="command-mode-switch" aria-label={label}>
      {options.map((option) => (
        <button
          className={value === option.value ? "command-mode-switch__item command-mode-switch__item--active" : "command-mode-switch__item"}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CommandStat({ label, value, detail, tone = "neutral" }) {
  return (
    <article className={`command-stat command-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function CommandTabs({ tabs, value, onChange, label = "Detailweergave" }) {
  return (
    <div className="command-tab-strip" aria-label={label}>
      {tabs.map((tab) => (
        <button
          className={value === tab.value ? "command-tab-strip__item command-tab-strip__item--active" : "command-tab-strip__item"}
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
