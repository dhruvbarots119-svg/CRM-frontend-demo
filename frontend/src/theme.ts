// SAI Elite Real Estate CRM — Design tokens
// iOS-native minimalism + Dubai gold accents.

export const colors = {
  bg: '#F9F8F6',
  surface: '#FFFFFF',
  surfaceElev: '#F0EFEA',
  surfaceInverse: '#111113',
  onSurfaceInverse: '#F9F8F6',
  text: '#1C1C1E',
  textMuted: '#6B6B70',
  textSubtle: '#9C9CA2',
  gold: '#C5A059',
  goldDark: '#8C6D33',
  goldSoft: '#F4EEDC',
  onGold: '#FFFFFF',
  success: '#2E7D32',
  successSoft: '#E6F4E7',
  warning: '#ED6C02',
  warningSoft: '#FEF1E1',
  error: '#D32F2F',
  errorSoft: '#FDECEC',
  info: '#0288D1',
  infoSoft: '#E1F1FA',
  border: '#E5E3DC',
  borderStrong: '#C5A059',
  divider: '#EFECE6',
  navy: '#0F172A',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const fontSize = { xs: 11, sm: 12, base: 14, md: 15, lg: 16, xl: 20, xxl: 24, hero: 30 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const stageMeta: Record<string, { label: string; color: string; soft: string }> = {
  New: { label: 'New', color: '#0288D1', soft: '#E1F1FA' },
  Contacted: { label: 'Contacted', color: '#7B4EDB', soft: '#EDE7FB' },
  SiteVisit: { label: 'Site Visit', color: '#C5A059', soft: '#F4EEDC' },
  Negotiation: { label: 'Negotiation', color: '#ED6C02', soft: '#FEF1E1' },
  ClosedWon: { label: 'Closed Won', color: '#2E7D32', soft: '#E6F4E7' },
  ClosedLost: { label: 'Closed Lost', color: '#8E8E93', soft: '#EEEEEE' },
};

export const priorityMeta: Record<string, { color: string; soft: string }> = {
  Low: { color: '#6B6B70', soft: '#F0EFEA' },
  Medium: { color: '#0288D1', soft: '#E1F1FA' },
  High: { color: '#ED6C02', soft: '#FEF1E1' },
  Urgent: { color: '#D32F2F', soft: '#FDECEC' },
};
