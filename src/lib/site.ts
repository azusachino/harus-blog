// Site-wide constants shared by the layout, header and feed.
export const SITE = {
  title: 'Idealistic Daydreamer',
  author: 'haru',
  url: 'https://azusachino.com',
  description: 'A palette gives you the capability; you are the source of possibility.',
};

// Main navigation, in display order.
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Tech', href: '/tech/' },
  { label: 'Series', href: '/tech/series/' },
  { label: 'Journal', href: '/journal/' },
  { label: 'Life', href: '/life/' },
  { label: 'Currently', href: '/currently/' },
  { label: 'About', href: '/about/' },
];

// Palette "tracks": the same layout, repainted. Values live in global.css
// under [data-palette]; every one is contrast-checked in both modes.
// Named after the movements of Mozart's Piano Sonata No. 13 in B-flat
// major, K. 333, in playing order; the finale's cadenza is the fourth track.
export const PIECE = 'Mozart · K. 333';
export const PALETTES = [
  { id: 'teal', name: 'I. Allegro' },
  { id: 'snow', name: 'II. Andante cantabile' },
  { id: 'sakura', name: 'III. Allegretto grazioso' },
  { id: 'sunset', name: 'Cadenza' },
];
