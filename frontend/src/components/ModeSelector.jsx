const MODES = [
  { id: 'gym-bro', emoji: '🏋️', name: 'CHAD', color: '#ff4444' },
  { id: 'drill-sergeant', emoji: '🪖', name: 'SGT. PAIN', color: '#ff8800' },
  { id: 'disappointed-parent', emoji: '😤', name: 'MOM/DAD', color: '#aa44ff' },
  { id: 'hustle-bro', emoji: '💼', name: 'GRINDSET', color: '#00dd44' },
  { id: 'evil-ai', emoji: '🤖', name: 'NEMESIS-7', color: '#00ccff' },
];

export default function ModeSelector({ selectedMode, onSelect, disabled }) {
  return (
    <div className="mode-selector">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          className={`mode-btn ${selectedMode === mode.id ? 'active' : ''}`}
          style={{ '--mode-color': mode.color }}
          onClick={() => !disabled && onSelect(mode.id)}
          disabled={disabled}
          title={mode.name}
        >
          <span>{mode.emoji}</span>
          <span className="mode-name">{mode.name}</span>
        </button>
      ))}
    </div>
  );
}

export { MODES };
