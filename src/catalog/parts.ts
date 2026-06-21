/** SVG fragments. Recolorable = fill="currentColor"; ink = fill="#2e2018". */
export const PARTS = {
  // --- bodies (head + torso + front paws; ears are a separate layer) ---
  bodyClassic:
    `<path d="M72 118 C60 150 58 188 78 204 C88 213 112 213 122 204 C142 188 140 150 128 118 Z" fill="currentColor"/>` +
    `<circle cx="100" cy="92" r="40" fill="currentColor"/>` +
    `<ellipse cx="84" cy="206" rx="13" ry="11" fill="currentColor"/>` +
    `<ellipse cx="116" cy="206" rx="13" ry="11" fill="currentColor"/>`,
  bodySlim:
    `<path d="M80 118 C72 150 72 190 88 204 C95 211 105 211 112 204 C128 190 128 150 120 118 Z" fill="currentColor"/>` +
    `<circle cx="100" cy="94" r="34" fill="currentColor"/>` +
    `<ellipse cx="90" cy="206" rx="10" ry="9" fill="currentColor"/>` +
    `<ellipse cx="110" cy="206" rx="10" ry="9" fill="currentColor"/>`,

  // --- ears ---
  earsFloppy:
    `<ellipse cx="66" cy="120" rx="17" ry="41" fill="currentColor" transform="rotate(-8 66 120)"/>` +
    `<ellipse cx="134" cy="120" rx="17" ry="41" fill="currentColor" transform="rotate(8 134 120)"/>`,
  earsPointy:
    `<path d="M72 72 L58 28 L88 60 Z" fill="currentColor"/>` +
    `<path d="M128 72 L142 28 L112 60 Z" fill="currentColor"/>`,
  earsRound:
    `<circle cx="64" cy="80" r="16" fill="currentColor"/>` +
    `<circle cx="136" cy="80" r="16" fill="currentColor"/>`,

  // --- fur overlays (ink linework over the coat) ---
  furShort:
    `<path d="M84 60 q6 -9 12 0 q6 9 12 0 q6 -9 12 0" fill="none" stroke="#2e2018" stroke-width="2.4"/>`,
  furFluffy:
    `<path d="M80 58 q5 -10 10 0 q5 10 10 0 q5 -10 10 0 q5 10 10 0" fill="none" stroke="#2e2018" stroke-width="2.2"/>` +
    `<path d="M70 150 q6 6 0 12 M130 150 q-6 6 0 12" fill="none" stroke="#2e2018" stroke-width="2"/>`,

  // --- eyes (ink) ---
  eyesDots:
    `<circle cx="86" cy="90" r="4.6" fill="#2e2018" stroke="none"/>` +
    `<circle cx="114" cy="90" r="4.6" fill="#2e2018" stroke="none"/>`,
  eyesSparkle:
    `<circle cx="86" cy="90" r="6" fill="#2e2018" stroke="none"/>` +
    `<circle cx="114" cy="90" r="6" fill="#2e2018" stroke="none"/>` +
    `<circle cx="88" cy="88" r="1.8" fill="#ffffff" stroke="none"/>` +
    `<circle cx="116" cy="88" r="1.8" fill="#ffffff" stroke="none"/>`,
  eyesHappy:
    `<path d="M82 91 q4 -6 8 0 M110 91 q4 -6 8 0" fill="none" stroke="#2e2018" stroke-width="2.6"/>`,

  // --- noses (ink) ---
  noseOval:
    `<ellipse cx="100" cy="104" rx="6" ry="4.6" fill="#2e2018" stroke="none"/>`,
  noseTri:
    `<path d="M94 101 L106 101 L100 109 Z" fill="#2e2018" stroke="none"/>`,

  // --- mouths ---
  mouthSmile:
    `<path d="M100 108 C96 114 90 114 86 110 M100 108 C104 114 110 114 114 110" fill="none" stroke="#2e2018" stroke-width="2.2"/>`,
  mouthTongue:
    `<path d="M100 108 C96 114 90 114 86 110 M100 108 C104 114 110 114 114 110" fill="none" stroke="#2e2018" stroke-width="2.2"/>` +
    `<path d="M96 111 q4 9 8 0 Z" fill="#d96a7a" stroke="#2e2018" stroke-width="1.4"/>`,
} as const
