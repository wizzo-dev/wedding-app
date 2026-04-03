// useFonts.js — Font registry + dynamic loader for Invitation Builder

export const HEBREW_FONTS = [
  { name: 'Heebo',              label: 'היבו' },
  { name: 'Assistant',          label: 'אסיסטנט' },
  { name: 'Rubik',              label: 'רוביק' },
  { name: 'Varela Round',       label: 'וורלה' },
  { name: 'Frank Ruhl Libre',   label: 'פרנק רול' },
  { name: 'Noto Serif Hebrew',  label: 'נוטו סריף' },
  { name: 'Noto Sans Hebrew',   label: 'נוטו סנס' },
  { name: 'Noto Rashi Hebrew',  label: 'נוטו ראשי' },
  { name: 'David Libre',        label: 'דוד' },
  { name: 'Miriam Libre',       label: 'מרים' },
  { name: 'Suez One',           label: 'סואץ' },
  { name: 'Secular One',        label: 'סקולר' },
  { name: 'Alef',               label: 'אלף' },
  { name: 'Amatic SC',          label: 'אמטיק' },
  { name: 'Bellefair',          label: 'בלפר' },
  { name: 'Tinos',              label: 'טינוס' },
  { name: 'Arimo',              label: 'אארימו' },
  { name: 'Cousine',            label: 'קאוזין' },
]

export const ENGLISH_FONTS = [
  { name: 'Playfair Display',   label: 'Playfair' },
  { name: 'Cormorant Garamond', label: 'Cormorant' },
  { name: 'Great Vibes',        label: 'Great Vibes' },
  { name: 'Dancing Script',     label: 'Dancing Script' },
  { name: 'Lora',               label: 'Lora' },
  { name: 'Cinzel',             label: 'Cinzel' },
  { name: 'EB Garamond',        label: 'Garamond' },
  { name: 'Libre Baskerville',  label: 'Baskerville' },
  { name: 'Bodoni Moda',        label: 'Bodoni' },
  { name: 'Raleway',            label: 'Raleway' },
]

export const ALL_FONTS = [...HEBREW_FONTS, ...ENGLISH_FONTS]

let fontsLoaded = false

/**
 * Dynamically inject a Google Fonts stylesheet for all builder fonts.
 * Safe to call multiple times — only injects once.
 */
export function loadAllFonts() {
  if (fontsLoaded) return
  fontsLoaded = true

  const families = ALL_FONTS
    .map(f => `family=${encodeURIComponent(f.name)}:wght@400;700`)
    .join('&')

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}
