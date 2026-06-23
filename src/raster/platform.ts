// Platform detection for tailoring how exports are delivered.
// iOS Safari can't reliably trigger a file download (the `download` attribute opens Quick Look instead
// of saving to Photos), so on iOS we hand files to the share sheet ("Save Image", "Copy to Minecraft").
// Android handles direct downloads, so we use them there.
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

export const isIOS =
  /iP(hone|od|ad)/.test(ua) ||
  // iPadOS 13+ reports as "Macintosh" but has a touch screen
  (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)

export const isAndroid = /Android/.test(ua)
