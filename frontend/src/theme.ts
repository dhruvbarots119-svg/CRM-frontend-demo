// SAI Elite Real Estate CRM — Design tokens
// Editorial navy + gold palette on cool pearl surfaces.

export const colors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElev: '#F1F5F9',
  surfaceInverse: '#0F172A',
  onSurfaceInverse: '#F8FAFC',
  text: '#152238',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  gold: '#C5A880',
  goldDark: '#8A6A39',
  goldSoft: '#FFFBF5',
  onGold: '#FFFFFF',
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#D97706',
  warningSoft: '#FFF7ED',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
  border: '#E2E8F0',
  borderStrong: '#C5A880',
  divider: '#F1F5F9',
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
  New: { label: 'New', color: '#2563EB', soft: '#EFF6FF' },
  Contacted: { label: 'Contacted', color: '#7B4EDB', soft: '#EDE7FB' },
  SiteVisit: { label: 'Site Visit', color: '#C5A880', soft: '#FFFBF5' },
  Negotiation: { label: 'Negotiation', color: '#D97706', soft: '#FFF7ED' },
  ClosedWon: { label: 'Closed Won', color: '#059669', soft: '#ECFDF5' },
  ClosedLost: { label: 'Closed Lost', color: '#94A3B8', soft: '#F1F5F9' },
};

export const priorityMeta: Record<string, { color: string; soft: string }> = {
  Low: { color: '#64748B', soft: '#F1F5F9' },
  Medium: { color: '#2563EB', soft: '#EFF6FF' },
  High: { color: '#D97706', soft: '#FFF7ED' },
  Urgent: { color: '#DC2626', soft: '#FEF2F2' },
};
