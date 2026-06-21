export const FILTER_ID = 'dm-rough'

export const FILTER_DEFS =
  `<filter id="${FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%">` +
  `<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n"/>` +
  `<feDisplacementMap in="SourceGraphic" in2="n" scale="3"/>` +
  `</filter>`
