const SHAME_PATTERNS = [
  { pattern: /tired|sleepy|exhausted|fatigue/i, bonus: 8, category: 'tired' },
  { pattern: /busy|no time|don't have time|too much/i, bonus: 15, category: 'busy' },
  { pattern: /tomorrow|later|next week|monday|fresh start/i, bonus: 25, category: 'tomorrow' },
  { pattern: /weather|rain|cold|hot|outside/i, bonus: 12, category: 'weather' },
  { pattern: /gym|workout|exercise|run|lift/i, bonus: 14, category: 'gym' },
  { pattern: /study|homework|school|exam|essay/i, bonus: 11, category: 'study' },
  { pattern: /don't feel like|not in the mood|feeling/i, bonus: 20, category: 'mood' },
  { pattern: /stress|anxious|overwhelmed/i, bonus: 7, category: 'stress' },
  { pattern: /netflix|tv|show|game|phone/i, bonus: 30, category: 'distraction' },
  { pattern: /maybe|probably|might|could/i, bonus: 5, category: 'indecision' },
  { pattern: /sore|hurt|pain|ache/i, bonus: 9, category: 'sore' },
];

const ACHIEVEMENTS = [
  {
    id: 'first_excuse',
    name: 'The Beginning of the End',
    description: 'Made your first excuse',
    icon: '🐣',
    condition: (s) => s.excuseCount === 1,
  },
  {
    id: 'five_excuses',
    name: 'Professional Procrastinator',
    description: 'Made 5 excuses',
    icon: '💀',
    condition: (s) => s.excuseCount === 5,
  },
  {
    id: 'ten_excuses',
    name: 'Excuse Machine Gold',
    description: 'Made 10 excuses — truly incredible',
    icon: '🏆',
    condition: (s) => s.excuseCount === 10,
  },
  {
    id: 'shame_50',
    name: 'Half-Century of Shame',
    description: 'Reached 50 shame points',
    icon: '📉',
    condition: (s) => s.shameScore >= 50 && s.shameScore - s.lastExcuseShame < 50,
  },
  {
    id: 'shame_100',
    name: 'Century of Shame',
    description: 'Reached 100 shame points',
    icon: '☠️',
    condition: (s) => s.shameScore >= 100 && s.shameScore - s.lastExcuseShame < 100,
  },
  {
    id: 'shame_250',
    name: 'Absolute Disaster Human',
    description: 'Reached 250 shame points',
    icon: '🌋',
    condition: (s) => s.shameScore >= 250 && s.shameScore - s.lastExcuseShame < 250,
  },
  {
    id: 'max_toxicity',
    name: 'CHAOS MODE UNLOCKED',
    description: 'Reached maximum toxicity level 10',
    icon: '🔥',
    condition: (s) => s.toxicityLevel >= 10 && s.prevToxicityLevel < 10,
  },
  {
    id: 'gym_dropout',
    name: 'Gym Card Collector',
    description: 'Made 3 gym-related excuses',
    icon: '🏋️',
    condition: (s) => (s.excuseCategories['gym'] || 0) === 3,
  },
  {
    id: 'study_fail',
    name: 'Academic Catastrophe',
    description: 'Made 3 study-related excuses',
    icon: '📚',
    condition: (s) => (s.excuseCategories['study'] || 0) === 3,
  },
  {
    id: 'tomorrow_person',
    name: 'Tomorrow Never Comes',
    description: 'Used "tomorrow" logic 3 times',
    icon: '📅',
    condition: (s) => (s.excuseCategories['tomorrow'] || 0) === 3,
  },
  {
    id: 'netflix_addict',
    name: 'Professional Couch Analyst',
    description: 'Chose entertainment over goals 3 times',
    icon: '📺',
    condition: (s) => (s.excuseCategories['distraction'] || 0) === 3,
  },
  {
    id: 'mood_disorder',
    name: 'Vibes-Based Decision Maker',
    description: '"Didn\'t feel like it" 3 times',
    icon: '🎭',
    condition: (s) => (s.excuseCategories['mood'] || 0) === 3,
  },
];

export function calculateExcuseShame(excuse) {
  let shame = 10;
  const categories = {};

  for (const { pattern, bonus, category } of SHAME_PATTERNS) {
    if (pattern.test(excuse)) {
      shame += bonus;
      categories[category] = (categories[category] || 0) + 1;
    }
  }

  return { shame, categories };
}

export function calculateToxicityLevel(shameScore, excuseCount) {
  const scoreComponent = Math.floor(shameScore / 15);
  const countComponent = Math.floor(excuseCount / 2);
  return Math.min(10, Math.max(1, scoreComponent + countComponent));
}

export function checkAchievements(session) {
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!session.unlockedAchievements.has(achievement.id) && achievement.condition(session)) {
      unlocked.push(achievement);
      session.unlockedAchievements.add(achievement.id);
    }
  }
  return unlocked;
}

export function categorizeExcuse(excuse) {
  const excuseLower = excuse.toLowerCase();
  for (const { pattern, category } of SHAME_PATTERNS) {
    if (pattern.test(excuseLower)) return category;
  }
  return 'general';
}

export function getWeaknessRating(excuse) {
  let score = 0;
  for (const { pattern, bonus } of SHAME_PATTERNS) {
    if (pattern.test(excuse)) score += bonus;
  }
  if (score === 0) return { rating: 3, label: 'MILDLY PATHETIC' };
  if (score < 20) return { rating: 4, label: 'CLASSIC COWARD MOVE' };
  if (score < 40) return { rating: 6, label: 'IMPRESSIVELY WEAK' };
  if (score < 60) return { rating: 8, label: 'HALL OF SHAME MATERIAL' };
  return { rating: 10, label: 'HISTORICALLY BAD EXCUSE' };
}

export function createSession() {
  return {
    excuses: [],
    recentExcuses: [],
    excuseCount: 0,
    shameScore: 0,
    lastExcuseShame: 0,
    toxicityLevel: 1,
    prevToxicityLevel: 1,
    excuseCategories: {},
    unlockedAchievements: new Set(),
    allAchievements: [],
    createdAt: Date.now(),
  };
}
