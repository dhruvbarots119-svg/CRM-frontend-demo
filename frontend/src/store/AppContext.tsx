// Global app state with AsyncStorage-backed persistence.
//
// State is stored as ONE JSON string per collection under the `sai:v1:*` keys.
// The underlying storage wrapper only supports primitives so we stringify
// ourselves. Writes are debounced through a small helper.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { storage } from '@/src/utils/storage';
import { seedAgents, seedLeads, seedMessages, seedNotes, seedNotifications, seedProperties, seedTasks } from './seed';
import {
  Agent,
  AppNotification,
  AppState,
  CallLog,
  ChatMessage,
  Lead,
  LeadStage,
  Message,
  Property,
  Role,
  StickyNote,
  Task,
} from './types';

const KEYS = {
  role: 'sai:v1:role',
  currentAgentId: 'sai:v1:currentAgentId',
  agents: 'sai:v1:agents',
  leads: 'sai:v1:leads',
  properties: 'sai:v1:properties',
  tasks: 'sai:v1:tasks',
  messages: 'sai:v1:messages',
  notifications: 'sai:v1:notifications',
  notes: 'sai:v1:notes',
} as const;

const load = async <T,>(key: string, fallback: T): Promise<T> => {
  const raw = await storage.getItem(key, '');
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const save = (key: string, value: unknown) => {
  storage.setItem(key, JSON.stringify(value));
};

type Ctx = {
  state: AppState;
  setRole: (role: Role) => void;
  setCurrentAgent: (agentId: string) => void;

  // Leads
  addLead: (input: Partial<Lead> & { name: string }) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  moveLeadStage: (id: string, stage: LeadStage) => void;
  addCallLog: (leadId: string, log: Omit<CallLog, 'id' | 'at' | 'agentId'> & { at?: string }) => void;
  toggleLeadChecklist: (leadId: string, itemKey: string) => void;
  deleteLead: (id: string) => void;

  // Properties
  addProperty: (input: Partial<Property> & { title: string }) => Property;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Tasks
  addTask: (input: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Messages
  markMessageRead: (id: string) => void;
  sendMessage: (messageId: string, text: string) => void;
  convertMessageToLead: (messageId: string) => Lead | null;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;

  // Sticky notes
  addNote: (text: string, color?: StickyNote['color']) => void;
  updateNote: (id: string, patch: Partial<StickyNote>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Helpers
  getMatchingProperties: (leadId: string) => Property[];
  reseed: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// Deterministic auto-reply for the mocked chat interface — picks a plausible
// response so agents can see the round-trip without a real backend.
const pickReply = (outgoingText: string): string => {
  const t = outgoingText.toLowerCase();
  if (t.includes('site visit') || t.includes('visit') || t.includes('sunday') || t.includes('slot'))
    return 'Sunday works! Please share the exact time and address.';
  if (t.includes('price') || t.includes('budget') || t.includes('cr') || t.includes('lakh') || t.includes('₹'))
    return 'Sounds good. Can you also share what the final all-in-cost would be, including stamp duty?';
  if (t.includes('loan') || t.includes('emi') || t.includes('mortgage'))
    return 'Great — I already have a pre-approval from HDFC. Please share the property paperwork.';
  if (t.includes('brochure') || t.includes('deck') || t.includes('document') || t.includes('rera'))
    return 'Received, thanks. I will review and revert in a few hours.';
  if (t.includes('hi') || t.includes('hello') || t.includes('namaste'))
    return 'Namaste 🙏 — glad you got back. Let me know when you have a moment.';
  return 'Thanks, that helps! Let me think and revert.';
};

const CHECKLIST_TEMPLATE: Record<LeadStage, string[]> = {
  New: ['Verify contact', 'Log source', 'Send intro message'],
  Contacted: ['Qualify budget', 'Confirm timeline', 'Capture preferences'],
  SiteVisit: ['Book viewing', 'Prepare comps', 'Confirm attendance'],
  Negotiation: ['Submit offer', 'Collect mortgage docs', 'Draft MOU'],
  ClosedWon: ['Deposit received', 'Transfer scheduled', 'Handover checklist'],
  ClosedLost: ['Log reason', 'Nurture list', 'Schedule 3m follow-up'],
};

const emptyChecklist = (stage: LeadStage) =>
  CHECKLIST_TEMPLATE[stage].reduce<Record<string, boolean>>((acc, k) => ({ ...acc, [k]: false }), {});

// Auto-assign to the agent (role=agent) with the fewest active leads.
const pickAutoAssignAgent = (agents: Agent[], leads: Lead[]): string => {
  const agentOnly = agents.filter((a) => a.role === 'agent' && a.active);
  if (agentOnly.length === 0) return agents[0]?.id ?? '';
  const load: Record<string, number> = {};
  agentOnly.forEach((a) => (load[a.id] = 0));
  leads.forEach((l) => {
    if (l.stage !== 'ClosedWon' && l.stage !== 'ClosedLost' && load[l.assignedAgentId] !== undefined) {
      load[l.assignedAgentId] += 1;
    }
  });
  return agentOnly.sort((a, b) => load[a.id] - load[b.id])[0].id;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    role: 'agent',
    currentAgentId: 'agent-dhruv',
    agents: seedAgents,
    leads: seedLeads,
    properties: seedProperties,
    tasks: seedTasks,
    messages: seedMessages,
    notifications: seedNotifications,
    notes: seedNotes,
    hydrated: false,
  });

  // Hydrate from storage on mount.
  useEffect(() => {
    (async () => {
      const [role, agentId, agents, leads, properties, tasks, messages, notifications, notes] = await Promise.all([
        load<Role>(KEYS.role, 'agent'),
        load<string>(KEYS.currentAgentId, 'agent-dhruv'),
        load<Agent[]>(KEYS.agents, seedAgents),
        load<Lead[]>(KEYS.leads, seedLeads),
        load<Property[]>(KEYS.properties, seedProperties),
        load<Task[]>(KEYS.tasks, seedTasks),
        load<Message[]>(KEYS.messages, seedMessages),
        load<AppNotification[]>(KEYS.notifications, seedNotifications),
        load<StickyNote[]>(KEYS.notes, seedNotes),
      ]);
      setState({
        role,
        currentAgentId: agentId,
        agents: agents.length ? agents : seedAgents,
        leads: leads.length ? leads : seedLeads,
        properties: properties.length ? properties : seedProperties,
        tasks: tasks.length ? tasks : seedTasks,
        messages: messages.length ? messages : seedMessages,
        notifications,
        notes: notes.length ? notes : seedNotes,
        hydrated: true,
      });
    })();
  }, []);

  // Persist on state change (after hydration).
  const initialized = useRef(false);
  useEffect(() => {
    if (!state.hydrated) return;
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    save(KEYS.role, state.role);
    save(KEYS.currentAgentId, state.currentAgentId);
    save(KEYS.agents, state.agents);
    save(KEYS.leads, state.leads);
    save(KEYS.properties, state.properties);
    save(KEYS.tasks, state.tasks);
    save(KEYS.messages, state.messages);
    save(KEYS.notifications, state.notifications);
    save(KEYS.notes, state.notes);
  }, [state]);

  const setRole = useCallback((role: Role) => {
    setState((s) => {
      if (role === 'admin') {
        return { ...s, role, currentAgentId: 'admin-rania' };
      }
      const firstAgent = s.agents.find((a) => a.role === 'agent');
      return { ...s, role, currentAgentId: firstAgent?.id ?? s.currentAgentId };
    });
  }, []);

  const setCurrentAgent = useCallback((agentId: string) => {
    setState((s) => ({ ...s, currentAgentId: agentId }));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setState((s) => ({
      ...s,
      notifications: [
        { ...n, id: uid('notif'), createdAt: new Date().toISOString(), read: false },
        ...s.notifications,
      ].slice(0, 60),
    }));
  }, []);

  const addLead = useCallback((input: Partial<Lead> & { name: string }): Lead => {
    let created: Lead | null = null;
    setState((s) => {
      const assignedAgentId = input.assignedAgentId || pickAutoAssignAgent(s.agents, s.leads);
      const stage: LeadStage = input.stage || 'New';
      const lead: Lead = {
        id: uid('lead'),
        phone: '',
        email: '',
        source: 'Manual',
        stage,
        score: 50,
        scoreReasons: ['New lead — pending qualification'],
        budget: 0,
        bedrooms: '',
        area: '',
        intent: 'Buy',
        timeline: '',
        lastContactAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        assignedAgentId,
        notes: '',
        dealValue: 0,
        matchedPropertyIds: [],
        callLogs: [],
        checklist: emptyChecklist(stage),
        memory: { concerns: [], preferences: [] },
        talkTimeMinutes: 0,
        ...input,
      };
      created = lead;
      const agentName = s.agents.find((a) => a.id === assignedAgentId)?.name ?? 'agent';
      return {
        ...s,
        leads: [lead, ...s.leads],
        notifications: [
          {
            id: uid('notif'),
            title: 'New lead auto-assigned',
            body: `${lead.name} routed to ${agentName} (lightest load).`,
            kind: 'lead',
            createdAt: new Date().toISOString(),
            read: false,
            leadId: lead.id,
          },
          ...s.notifications,
        ],
      };
    });
    return created!;
  }, []);

  const updateLead = useCallback((id: string, patch: Partial<Lead>) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const moveLeadStage = useCallback((id: string, stage: LeadStage) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) => {
        if (l.id !== id) return l;
        const isClose = stage === 'ClosedWon' || stage === 'ClosedLost';
        const nowIso = new Date().toISOString();
        const patch: Partial<Lead> = {
          stage,
          checklist: { ...emptyChecklist(stage), ...l.checklist },
          lastContactAt: nowIso,
        };
        if (isClose) {
          patch.closedAt = nowIso;
          const fu = new Date();
          fu.setDate(fu.getDate() + 3);
          patch.followUpDueAt = fu.toISOString();
          const anniv = new Date();
          anniv.setFullYear(anniv.getFullYear() + 1);
          patch.anniversaryAt = anniv.toISOString();
        }
        return { ...l, ...patch };
      }),
    }));
  }, []);

  const addCallLog = useCallback(
    (leadId: string, log: Omit<CallLog, 'id' | 'at' | 'agentId'> & { at?: string }) => {
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) => {
          if (l.id !== leadId) return l;
          const entry: CallLog = {
            id: uid('call'),
            at: log.at || new Date().toISOString(),
            outcome: log.outcome,
            notes: log.notes,
            agentId: s.currentAgentId,
            durationMinutes: log.durationMinutes || 0,
          };
          const newLogs = [entry, ...l.callLogs];
          const talkTimeMinutes = newLogs.reduce((sum, c) => sum + (c.durationMinutes || 0), 0);
          return { ...l, callLogs: newLogs, lastContactAt: entry.at, talkTimeMinutes };
        }),
      }));
    },
    [],
  );

  const toggleLeadChecklist = useCallback((leadId: string, itemKey: string) => {
    setState((s) => ({
      ...s,
      leads: s.leads.map((l) =>
        l.id === leadId ? { ...l, checklist: { ...l.checklist, [itemKey]: !l.checklist[itemKey] } } : l,
      ),
    }));
  }, []);

  const deleteLead = useCallback((id: string) => {
    setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
  }, []);

  const addProperty = useCallback((input: Partial<Property> & { title: string }): Property => {
    let created: Property | null = null;
    setState((s) => {
      const p: Property = {
        id: uid('prop'),
        area: '',
        address: '',
        price: 0,
        status: 'Available',
        type: 'Apartment',
        bedrooms: 1,
        bathrooms: 1,
        sizeSqft: 0,
        developer: '',
        amenities: [],
        photoUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        ownerName: '',
        ownerPhone: '',
        serviceCharges: 0,
        notes: '',
        createdAt: new Date().toISOString(),
        ...input,
      };
      created = p;
      return { ...s, properties: [p, ...s.properties] };
    });
    return created!;
  }, []);

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setState((s) => ({
      ...s,
      properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setState((s) => ({ ...s, properties: s.properties.filter((p) => p.id !== id) }));
  }, []);

  const addTask = useCallback((input: Partial<Task> & { title: string }): Task => {
    let created: Task | null = null;
    setState((s) => {
      const t: Task = {
        id: uid('task'),
        type: 'Custom',
        priority: 'Medium',
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        status: 'Pending',
        assignedAgentId: s.currentAgentId,
        createdBy: s.currentAgentId,
        notes: '',
        createdAt: new Date().toISOString(),
        ...input,
      };
      created = t;
      return { ...s, tasks: [t, ...s.tasks] };
    });
    return created!;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        const done = t.status !== 'Completed';
        return {
          ...t,
          status: done ? 'Completed' : 'Pending',
          completedAt: done ? new Date().toISOString() : undefined,
        };
      }),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    }));
  }, []);

  const sendMessage = useCallback((messageId: string, text: string) => {
    if (!text.trim()) return;
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => {
        if (m.id !== messageId) return m;
        const out: ChatMessage = {
          id: uid('m'),
          direction: 'out',
          text: text.trim(),
          at: new Date().toISOString(),
          status: 'sent',
        };
        return {
          ...m,
          isRead: true,
          preview: text.trim().slice(0, 80),
          thread: [...(m.thread || []), out],
        };
      }),
    }));

    // Simulate an incoming reply after ~1.4s for the demo — so agents can see
    // the two-way chat feel without an actual backend.
    setTimeout(() => {
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) => {
          if (m.id !== messageId) return m;
          const reply: ChatMessage = {
            id: uid('m'),
            direction: 'in',
            text: pickReply(text),
            at: new Date().toISOString(),
          };
          return {
            ...m,
            preview: reply.text.slice(0, 80),
            receivedAt: reply.at,
            thread: [...(m.thread || []), reply],
          };
        }),
      }));
    }, 1400);
  }, []);

  const convertMessageToLead = useCallback((messageId: string): Lead | null => {
    let created: Lead | null = null;
    setState((s) => {
      const msg = s.messages.find((m) => m.id === messageId);
      if (!msg) return s;
      if (msg.convertedToLeadId) {
        created = s.leads.find((l) => l.id === msg.convertedToLeadId) ?? null;
        return s;
      }
      const assignedAgentId = pickAutoAssignAgent(s.agents, s.leads);
      const lead: Lead = {
        id: uid('lead'),
        name: msg.from,
        phone: msg.channel === 'WhatsApp' ? msg.fromContact : '',
        email: msg.channel === 'Email' ? msg.fromContact : '',
        source: msg.channel === 'Email' ? 'Website' : (msg.channel as any),
        stage: 'New',
        score: 60,
        scoreReasons: [`Inbound ${msg.channel} enquiry`, 'Included budget in first message'],
        budget: 0,
        bedrooms: '',
        area: '',
        intent: 'Buy',
        timeline: '',
        lastContactAt: msg.receivedAt,
        createdAt: new Date().toISOString(),
        assignedAgentId,
        notes: `Converted from ${msg.channel}: ${msg.fullText}`,
        dealValue: 0,
        matchedPropertyIds: [],
        callLogs: [],
        checklist: emptyChecklist('New'),
        memory: { concerns: [], preferences: [] },
        talkTimeMinutes: 0,
      };
      created = lead;
      const agentName = s.agents.find((a) => a.id === assignedAgentId)?.name ?? 'agent';
      return {
        ...s,
        leads: [lead, ...s.leads],
        messages: s.messages.map((m) => (m.id === messageId ? { ...m, isRead: true, convertedToLeadId: lead.id } : m)),
        notifications: [
          {
            id: uid('notif'),
            title: 'Message converted to lead',
            body: `${msg.from} (${msg.channel}) → routed to ${agentName}.`,
            kind: 'lead',
            createdAt: new Date().toISOString(),
            read: false,
            leadId: lead.id,
          },
          ...s.notifications,
        ],
      };
    });
    return created;
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }, []);

  // ---- Notes ------------------------------------------------------------
  const addNote = useCallback((text: string, color: StickyNote['color'] = 'gold') => {
    if (!text.trim()) return;
    setState((s) => ({
      ...s,
      notes: [
        { id: uid('note'), text: text.trim(), color, createdAt: new Date().toISOString() },
        ...s.notes,
      ],
    }));
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<StickyNote>) => {
    setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    }));
  }, []);

  const getMatchingProperties = useCallback(
    (leadId: string): Property[] => {
      const lead = state.leads.find((l) => l.id === leadId);
      if (!lead) return [];
      const budget = lead.budget || Infinity;
      const bedCount = parseInt(lead.bedrooms) || 0;
      return state.properties
        .filter((p) => p.status === 'Available' || p.status === 'Under Offer')
        .map((p) => {
          let score = 60;
          if (p.price <= budget) score += 15;
          if (p.price <= budget * 0.98) score += 5;
          if (bedCount && p.bedrooms === bedCount) score += 12;
          if (lead.area && p.area.toLowerCase().includes(lead.area.toLowerCase().split(' ')[0]))
            score += 10;
          if (lead.memory.preferences.some((pref) => p.amenities.join(' ').toLowerCase().includes(pref.toLowerCase())))
            score += 5;
          return { p, score: Math.min(99, score) };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((x) => x.p);
    },
    [state.leads, state.properties],
  );

  const reseed = useCallback(async () => {
    await Promise.all([
      storage.removeItem(KEYS.role),
      storage.removeItem(KEYS.currentAgentId),
      storage.removeItem(KEYS.agents),
      storage.removeItem(KEYS.leads),
      storage.removeItem(KEYS.properties),
      storage.removeItem(KEYS.tasks),
      storage.removeItem(KEYS.messages),
      storage.removeItem(KEYS.notifications),
      storage.removeItem(KEYS.notes),
    ]);
    setState({
      role: 'agent',
      currentAgentId: 'agent-dhruv',
      agents: seedAgents,
      leads: seedLeads,
      properties: seedProperties,
      tasks: seedTasks,
      messages: seedMessages,
      notifications: seedNotifications,
      notes: seedNotes,
      hydrated: true,
    });
  }, []);

  const value: Ctx = useMemo(
    () => ({
      state,
      setRole,
      setCurrentAgent,
      addLead,
      updateLead,
      moveLeadStage,
      addCallLog,
      toggleLeadChecklist,
      deleteLead,
      addProperty,
      updateProperty,
      deleteProperty,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      markMessageRead,
      sendMessage,
      convertMessageToLead,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      getMatchingProperties,
      reseed,
    }),
    [
      state,
      setRole,
      setCurrentAgent,
      addLead,
      updateLead,
      moveLeadStage,
      addCallLog,
      toggleLeadChecklist,
      deleteLead,
      addProperty,
      updateProperty,
      deleteProperty,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      markMessageRead,
      sendMessage,
      convertMessageToLead,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
      addNote,
      updateNote,
      deleteNote,
      togglePinNote,
      getMatchingProperties,
      reseed,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
};

export const useApp = (): Ctx => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

// Visible-to-current-role lead filter.
export const visibleLeads = (state: AppState): Lead[] =>
  state.role === 'admin' ? state.leads : state.leads.filter((l) => l.assignedAgentId === state.currentAgentId);

export const visibleTasks = (state: AppState): Task[] =>
  state.role === 'admin' ? state.tasks : state.tasks.filter((t) => t.assignedAgentId === state.currentAgentId);
