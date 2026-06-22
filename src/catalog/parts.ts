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

  // --- accessories (already coloured; they inherit only the ink outline + rough
  //     filter from the dog wrapper, never the coat colour). Mirror this art in
  //     scripts/export-accessories.mjs when exporting the standalone PNG stickers. ---

  // head: knit beanie with a pom-pom
  accBeanie:
    `<path d="M62 60 Q64 26 100 26 Q136 26 138 60 Z" fill="#d6534e"/>` +
    `<path d="M84 30 V58 M100 27 V58 M116 30 V58" fill="none" stroke="#b8433e" stroke-width="2.4"/>` +
    `<rect x="58" y="54" width="84" height="14" rx="7" fill="#f2e4c9"/>` +
    `<circle cx="100" cy="21" r="8" fill="#f2e4c9"/>`,

  // head: party cone hat
  accParty:
    `<path d="M100 13 L80 60 L120 60 Z" fill="#2fa8a0"/>` +
    `<path d="M86 47 L114 47 M90 34 L110 34" fill="none" stroke="#f2c14e" stroke-width="3"/>` +
    `<circle cx="100" cy="12" r="6" fill="#f2c14e"/>`,

  // head: little gold crown
  accCrown:
    `<path d="M64 58 L68 32 L84 48 L100 28 L116 48 L132 32 L136 58 Z" fill="#f2c14e"/>` +
    `<rect x="62" y="56" width="76" height="9" rx="3" fill="#e0a93e"/>` +
    `<circle cx="100" cy="44" r="3.6" fill="#d6534e" stroke="none"/>` +
    `<circle cx="80" cy="50" r="2.6" fill="#4f86c6" stroke="none"/>` +
    `<circle cx="120" cy="50" r="2.6" fill="#4f86c6" stroke="none"/>`,

  // head: ribbon bow on the crown
  accBow:
    `<path d="M100 50 L74 40 Q66 52 76 62 L100 52 Z" fill="#e58aa8"/>` +
    `<path d="M100 50 L126 40 Q134 52 124 62 L100 52 Z" fill="#e58aa8"/>` +
    `<path d="M84 46 Q80 51 84 56 M116 46 Q120 51 116 56" fill="none" stroke="#d96a92" stroke-width="2.4"/>` +
    `<circle cx="100" cy="51" r="5.5" fill="#d96a92"/>`,

  // face: sunglasses over the eyes
  accGlasses:
    `<path d="M64 88 q4 -3 8 0 M128 88 q-4 -3 -8 0" fill="none" stroke="#2e2018" stroke-width="3"/>` +
    `<rect x="70" y="83" width="24" height="15" rx="7" fill="#2e2018"/>` +
    `<rect x="106" y="83" width="24" height="15" rx="7" fill="#2e2018"/>` +
    `<path d="M94 88 q6 -4 12 0" fill="none" stroke="#2e2018" stroke-width="3"/>` +
    `<path d="M75 86 l6 0 M111 86 l6 0" fill="none" stroke="#8aa6bf" stroke-width="2.4"/>`,

  // neck: striped scarf with a hanging tail
  accScarf:
    `<path d="M70 120 Q100 136 130 120 L130 134 Q100 150 70 134 Z" fill="#d6534e"/>` +
    `<path d="M104 142 q-2 22 4 34 q7 3 12 -2 q-3 -18 -5 -30 Z" fill="#d6534e"/>` +
    `<path d="M78 127 h44 M110 152 h9 M112 166 h9" fill="none" stroke="#f2e4c9" stroke-width="2.6"/>`,

  // neck: polka-dot bandana
  accBandana:
    `<path d="M72 122 Q100 132 128 122 L100 170 Z" fill="#d6534e"/>` +
    `<path d="M70 118 l8 8 -8 4 -2 -10 Z" fill="#b8433e"/>` +
    `<path d="M130 118 l-8 8 8 4 2 -10 Z" fill="#b8433e"/>` +
    `<circle cx="90" cy="134" r="2.2" fill="#f2e4c9" stroke="none"/>` +
    `<circle cx="110" cy="134" r="2.2" fill="#f2e4c9" stroke="none"/>` +
    `<circle cx="100" cy="146" r="2.2" fill="#f2e4c9" stroke="none"/>` +
    `<circle cx="100" cy="132" r="2.2" fill="#f2e4c9" stroke="none"/>`,

  // neck: collar with a gold paw medallion (брелок)
  accCollar:
    `<path d="M72 122 Q100 134 128 122 L128 131 Q100 143 72 131 Z" fill="#4f86c6"/>` +
    `<circle cx="86" cy="128" r="2" fill="#f2c14e" stroke="none"/>` +
    `<circle cx="100" cy="131" r="2" fill="#f2c14e" stroke="none"/>` +
    `<circle cx="114" cy="128" r="2" fill="#f2c14e" stroke="none"/>` +
    `<path d="M100 134 V139" fill="none" stroke="#caa05a" stroke-width="2"/>` +
    `<circle cx="100" cy="145" r="6.5" fill="#f2c14e"/>` +
    `<circle cx="100" cy="147" r="2.3" fill="#caa05a" stroke="none"/>` +
    `<circle cx="96.6" cy="143.6" r="1.1" fill="#caa05a" stroke="none"/>` +
    `<circle cx="100" cy="142.4" r="1.1" fill="#caa05a" stroke="none"/>` +
    `<circle cx="103.4" cy="143.6" r="1.1" fill="#caa05a" stroke="none"/>`,

  // neck: striped necktie down the chest
  accTie:
    `<path d="M92 122 L108 122 L104 132 L96 132 Z" fill="#34507a"/>` +
    `<path d="M96 132 L104 132 L108 176 L100 188 L92 176 Z" fill="#34507a"/>` +
    `<path d="M95 146 l13 7 M94 158 l14 7 M94 170 l13 7" fill="none" stroke="#d6534e" stroke-width="3"/>`,

  // back: feathered angel wings (drawn behind the dog)
  accWings:
    `<path d="M70 128 C48 110 24 112 14 128 Q22 138 30 134 Q26 150 34 148 Q30 162 40 158 Q36 170 48 166 Q58 160 70 148 Z" fill="#f6f1e7"/>` +
    `<path d="M130 128 C152 110 176 112 186 128 Q178 138 170 134 Q174 150 166 148 Q170 162 160 158 Q164 170 152 166 Q142 160 130 148 Z" fill="#f6f1e7"/>` +
    `<path d="M66 132 C46 124 30 128 22 134 M66 140 C48 138 36 144 30 150" fill="none" stroke="#ddd0bb" stroke-width="1.8"/>` +
    `<path d="M134 132 C154 124 170 128 178 134 M134 140 C152 138 164 144 170 150" fill="none" stroke="#ddd0bb" stroke-width="1.8"/>`,
} as const
