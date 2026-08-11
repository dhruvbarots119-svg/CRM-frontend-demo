export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Viewing' | 'Offer' | 'Negotiation' | 'Closed';

export const metrics = [
  { label: 'Revenue this month', value: 'AED 1.245M', change: '+12.4%', icon: 'cash-multiple', tone: 'gold' },
  { label: 'Active deals', value: '23', change: '+3 this week', icon: 'briefcase-outline', tone: 'blue' },
  { label: 'New leads', value: '47', change: '+8 today', icon: 'account-plus-outline', tone: 'green' },
  { label: 'Tasks due today', value: '9', change: '3 high priority', icon: 'checkbox-marked-circle-outline', tone: 'orange' },
];

export const priorities = [
  { id: 'sarah', name: 'Sarah Khan', state: 'High intent', detail: 'Viewed Marina Gate twice', budget: 'AED 2.4M', time: '3 days ago', why: 'Budget increased from AED 2.1M and she asked about mortgage eligibility. No viewing booked yet.', action: 'Follow up with 2BR Marina alternatives', icon: 'arrow-top-right' },
  { id: 'ahmed', name: 'Ahmed Rahman', state: 'Warm', detail: 'New payment-plan match found', budget: 'AED 1.8M', time: 'Yesterday', why: 'His 5-year investment horizon matches a new Sobha Hartland II payment structure.', action: 'Send project comparison', icon: 'chart-line' },
  { id: 'james', name: 'James Wilson', state: 'Deal in progress', detail: 'Seller response pending', budget: 'AED 3.1M', time: '45 min ago', why: 'Offer is open and seller has not responded for 18 hours. A follow-up before 4 PM reduces deal stall risk.', action: 'Follow up with seller', icon: 'clock-alert-outline' },
];

export const properties = [
  { name: 'Marina Vista', area: 'Dubai Marina', price: 'AED 2.32M', specs: '2 BR · 1,180 sq ft', match: 94, reasons: ['Budget', 'Preferred location', 'Balcony', 'New development'] },
  { name: 'LIV Marina', area: 'Dubai Marina', price: 'AED 2.39M', specs: '2 BR · 1,126 sq ft', match: 91, reasons: ['Budget', 'Balcony', 'Waterfront'] },
  { name: 'Marina Shores', area: 'Dubai Marina', price: 'AED 2.45M', specs: '2 BR · 1,205 sq ft', match: 83, reasons: ['Location', 'Newer building', 'Over budget by AED 50K'] },
];

export const projects = [
  { name: 'Sobha Hartland II', area: 'Dubai Hills', price: 'From AED 1.68M', match: 92, completion: 'Q4 2026', plan: '20 / 40 / 40', reason: 'Lower entry price, strong developer track record and fits the 5-year holding horizon.' },
  { name: 'The Valley Phase 2', area: 'Dubai Hills', price: 'From AED 1.75M', match: 87, completion: 'Q2 2027', plan: '10 / 50 / 40', reason: 'More construction-heavy payments, but attractive family rental demand.' },
  { name: 'Address Residences', area: 'Downtown', price: 'From AED 1.92M', match: 78, completion: 'Q1 2027', plan: '20 / 30 / 50', reason: 'Premium location, but larger completion payment exceeds comfort zone.' },
];

export const navItems = [
  ['leads', 'Leads & Pipeline', 'view-kanban'], ['clients', 'Clients & Relationships', 'account-group-outline'], ['properties', 'Properties', 'home-city-outline'], ['offplan', 'Off-Plan Intelligence', 'city-variant-outline'], ['inbox', 'Unified Inbox', 'message-text-outline'], ['deals', 'Deals & Transactions', 'briefcase-outline'], ['finance', 'Financial Tools', 'calculator-variant-outline'], ['marketing', 'Marketing Studio', 'bullhorn-outline'], ['compliance', 'Compliance Hub', 'shield-check-outline'], ['team', 'Team & Performance', 'account-tie-outline'], ['reports', 'Reports & Analytics', 'chart-box-outline'], ['integrations', 'Integrations', 'connection'], ['settings', 'Settings', 'cog-outline'],
] as const;