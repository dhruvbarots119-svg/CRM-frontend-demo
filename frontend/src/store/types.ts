// Domain types for the SERRA CRM.

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'SiteVisit'
  | 'Negotiation'
  | 'ClosedWon'
  | 'ClosedLost';

export type LeadSource =
  | 'MagicBricks'
  | '99acres'
  | 'Housing.com'
  | 'Website'
  | 'Instagram'
  | 'WhatsApp'
  | 'Facebook'
  | 'Referral'
  | 'Walk-in'
  | 'Manual';

export type Intent = 'Buy' | 'Rent' | 'Invest';

export type CallOutcome = 'Interested' | 'Not Interested' | 'Callback' | 'Voicemail' | 'No Answer';

export interface CallLog {
  id: string;
  at: string;
  outcome: CallOutcome;
  notes: string;
  agentId: string;
  durationMinutes: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  stage: LeadStage;
  score: number;
  scoreReasons: string[];
  budget: number;
  bedrooms: string;
  area: string;
  intent: Intent;
  timeline: string;
  lastContactAt: string;
  createdAt: string;
  assignedAgentId: string;
  notes: string;
  dealValue: number;
  matchedPropertyIds: string[];
  callLogs: CallLog[];
  checklist: Record<string, boolean>;
  memory: { concerns: string[]; preferences: string[] };
  closedAt?: string;
  followUpDueAt?: string;
  anniversaryAt?: string;
  concernFlag?: string;
  // Derived, but persisted so admin dashboards read it cheaply.
  talkTimeMinutes?: number;
}

export type PropertyStatus = 'Available' | 'Under Offer' | 'Sold' | 'Rented';
export type PropertyType = 'Apartment' | 'Villa' | 'Penthouse' | 'Bungalow' | 'Plot' | 'New Launch';

export interface Property {
  id: string;
  title: string;
  area: string;
  address: string;
  price: number;
  status: PropertyStatus;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  developer: string;
  amenities: string[];
  photoUrl: string;
  ownerName: string;
  ownerPhone: string;
  serviceCharges: number;
  notes: string;
  createdAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'Completed';
export type TaskType = 'Follow-up' | 'Call' | 'Site Visit' | 'Meeting' | 'Document' | 'Custom';

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dueAt: string;
  status: TaskStatus;
  assignedAgentId: string;
  createdBy: string;
  leadId?: string;
  propertyId?: string;
  notes: string;
  createdAt: string;
  completedAt?: string;
  reminderShownAt?: string;
}

export type MessageChannel = 'WhatsApp' | 'Facebook' | 'Instagram' | 'Email';

export interface ChatMessage {
  id: string;
  direction: 'in' | 'out';
  text: string;
  at: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface Message {
  id: string;
  channel: MessageChannel;
  from: string;
  fromContact: string;
  preview: string;
  fullText: string;
  receivedAt: string;
  isRead: boolean;
  convertedToLeadId?: string;
  thread: ChatMessage[];
}

export type Role = 'agent' | 'admin';

export interface Agent {
  id: string;
  name: string;
  initials: string;
  role: Role;
  avatarTone: string;
  responseAvgMinutes: number;
  active: boolean;
}

export type NotificationKind = 'reminder' | 'risk' | 'match' | 'lead' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;
  read: boolean;
  taskId?: string;
  leadId?: string;
}

export interface StickyNote {
  id: string;
  text: string;
  color: 'gold' | 'blue' | 'green' | 'pink';
  createdAt: string;
  pinned?: boolean;
}

export interface AppState {
  role: Role;
  currentAgentId: string;
  agents: Agent[];
  leads: Lead[];
  properties: Property[];
  tasks: Task[];
  messages: Message[];
  notifications: AppNotification[];
  notes: StickyNote[];
  hydrated: boolean;
}
