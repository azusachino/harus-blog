// Site-wide constants shared by the layout, header and feed.
export const SITE = {
  title: 'Idealistic Daydreamer',
  author: 'haru',
  url: 'https://azusachino.com',
  description: "palette gives you the capability, but you're the source of possibility.",
};

// Main navigation, in display order.
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Tech', href: '/tech/' },
  { label: 'Journal', href: '/journal/' },
  { label: 'Life', href: '/life/' },
  { label: 'Currently', href: '/currently/' },
  { label: 'Use', href: '/use/' },
  { label: 'About', href: '/about/' },
];

// Palette "tracks": the same layout, repainted. Values live in global.css
// under [data-palette]; every one is contrast-checked in both modes.
export const PALETTES = [
  { id: 'teal', name: '39 Teal' },
  { id: 'sakura', name: 'Sakura' },
  { id: 'snow', name: 'Snow' },
  { id: 'sunset', name: 'Mirai Sunset' },
];
