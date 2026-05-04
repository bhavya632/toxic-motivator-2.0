import { useState, useEffect } from 'react';

function Toast({ achievement, onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setLeaving(true), 3500);
    const doneTimer = setTimeout(onDone, 4000);
    return () => { clearTimeout(hideTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className={`achievement-toast ${leaving ? 'leaving' : ''}`}>
      <div className="toast-top">ACHIEVEMENT UNLOCKED</div>
      <span className="toast-icon">{achievement.icon}</span>
      <div className="toast-name">{achievement.name}</div>
      <div className="toast-desc">{achievement.description}</div>
    </div>
  );
}

export default function AchievementToast({ queue, onDismiss }) {
  return (
    <div className="toast-container">
      {queue.map((a, i) => (
        <Toast key={a.id + i} achievement={a} onDone={() => onDismiss(i)} />
      ))}
    </div>
  );
}
