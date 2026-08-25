// SAI — Smart Agent Intelligence
// Main app shell: header, tabs, screens, sheets, and the 5-minute reminder poller.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import { AppProvider, useApp, visibleTasks } from '@/src/store/AppContext';
import { ToastProvider } from '@/src/components/Toast';
import { Header } from '@/src/components/Header';
import { BottomTabs, TabKey } from '@/src/components/BottomTabs';

import { CommandCenterScreen } from '@/src/screens/CommandCenterScreen';
import { LeadsScreen } from '@/src/screens/LeadsScreen';
import { LeadDetailSheet } from '@/src/screens/LeadDetailSheet';
import { AddLeadSheet } from '@/src/screens/AddLeadSheet';
import {
  PropertiesScreen,
  PropertyDetailSheet,
  AddPropertySheet,
} from '@/src/screens/PropertiesScreen';
import {
  TasksScreen,
  TaskDetailSheet,
  AddTaskSheet,
} from '@/src/screens/TasksScreen';
import { InboxScreen, MessageDetailSheet } from '@/src/screens/InboxScreen';
import { AdminScreen } from '@/src/screens/AdminScreen';
import { AskSaiSheet } from '@/src/screens/AskSaiSheet';
import { GlobalSearchSheet } from '@/src/screens/GlobalSearchSheet';
import { NotificationsSheet } from '@/src/screens/NotificationsSheet';
import { MoreScreen, MoreDest } from '@/src/screens/MoreScreen';
import { SettingsScreen } from '@/src/screens/SettingsScreen';
import { AddMenu } from '@/src/screens/AddMenu';

type Screen = TabKey | 'properties' | 'tasks' | 'admin' | 'settings';

const TITLES: Record<Screen, { title: string; eyebrow: string }> = {
  home: { title: 'Command Center', eyebrow: 'TODAY' },
  leads: { title: 'Leads & Pipeline', eyebrow: 'PIPELINE' },
  inbox: { title: 'Unified Inbox', eyebrow: 'CONVERSATIONS' },
  more: { title: 'Workspace', eyebrow: 'MODULES' },
  properties: { title: 'Properties', eyebrow: 'LISTINGS' },
  tasks: { title: 'Tasks & Reminders', eyebrow: 'TODO' },
  admin: { title: 'Team & Analytics', eyebrow: 'REPORTS' },
  settings: { title: 'Settings', eyebrow: 'PREFERENCES' },
};

const AppShell: React.FC = () => {
  const { state, pushNotification } = useApp();
  const [screen, setScreen] = useState<Screen>('home');

  const [leadId, setLeadId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // In-app reminder poller — every 5 minutes check for overdue tasks and push a
  // notification once per task per app session.
  const remindedTaskIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!state.hydrated) return;
    const check = () => {
      const now = Date.now();
      const overdue = visibleTasks(state).filter(
        (t) => t.status === 'Pending' && new Date(t.dueAt).getTime() <= now,
      );
      overdue.forEach((t) => {
        if (remindedTaskIds.current.has(t.id)) return;
        remindedTaskIds.current.add(t.id);
        pushNotification({
          title: 'Task overdue',
          body: `${t.title} — due ${new Date(t.dueAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`,
          kind: 'reminder',
          taskId: t.id,
        });
      });
    };
    check();
    const int = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(int);
  }, [state, pushNotification]);

  const onNavigate = useCallback((k: TabKey) => setScreen(k), []);
  const onAdd = useCallback(() => setAddMenuOpen(true), []);

  const goMore = (d: MoreDest) => {
    switch (d) {
      case 'properties':
        setScreen('properties');
        break;
      case 'tasks':
        setScreen('tasks');
        break;
      case 'admin':
        setScreen('admin');
        break;
      case 'ask':
        setAskOpen(true);
        break;
      case 'settings':
        setScreen('settings');
        break;
    }
  };

  const meta = TITLES[screen];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={meta.title}
        eyebrow={meta.eyebrow}
        onSearch={() => setSearchOpen(true)}
        onNotifications={() => setNotifOpen(true)}
        onAskSai={() => setAskOpen(true)}
      />
      <View style={styles.body}>
        {screen === 'home' && (
          <CommandCenterScreen
            onOpenLead={setLeadId}
            onOpenTask={setTaskId}
            goLeads={() => setScreen('leads')}
            goInbox={() => setScreen('inbox')}
          />
        )}
        {screen === 'leads' && <LeadsScreen onOpenLead={setLeadId} onAddLead={() => setAddLeadOpen(true)} />}
        {screen === 'inbox' && <InboxScreen onOpenMessage={setMessageId} />}
        {screen === 'more' && <MoreScreen onNavigate={goMore} />}
        {screen === 'properties' && (
          <PropertiesScreen onOpenProperty={setPropertyId} onAddProperty={() => setAddPropertyOpen(true)} />
        )}
        {screen === 'tasks' && <TasksScreen onAddTask={() => setAddTaskOpen(true)} onOpenTask={setTaskId} />}
        {screen === 'admin' && <AdminScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </View>

      <BottomTabs
        active={(['home', 'leads', 'inbox', 'more'].includes(screen) ? (screen as TabKey) : 'more') as TabKey}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />

      {/* Sheets */}
      <LeadDetailSheet leadId={leadId} onClose={() => setLeadId(null)} onOpenProperty={setPropertyId} />
      <AddLeadSheet visible={addLeadOpen} onClose={() => setAddLeadOpen(false)} onCreated={(id) => setLeadId(id)} />
      <PropertyDetailSheet propertyId={propertyId} onClose={() => setPropertyId(null)} />
      <AddPropertySheet visible={addPropertyOpen} onClose={() => setAddPropertyOpen(false)} />
      <TaskDetailSheet taskId={taskId} onClose={() => setTaskId(null)} />
      <AddTaskSheet visible={addTaskOpen} onClose={() => setAddTaskOpen(false)} />
      <MessageDetailSheet
        messageId={messageId}
        onClose={() => setMessageId(null)}
        onLeadCreated={(id) => setLeadId(id)}
      />
      <AskSaiSheet visible={askOpen} onClose={() => setAskOpen(false)} />
      <GlobalSearchSheet
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenLead={setLeadId}
        onOpenProperty={setPropertyId}
        onOpenTask={setTaskId}
        onOpenMessage={setMessageId}
      />
      <NotificationsSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onOpenLead={setLeadId}
        onOpenTask={setTaskId}
      />
      <AddMenu
        visible={addMenuOpen}
        onClose={() => setAddMenuOpen(false)}
        onPick={(a) => {
          if (a === 'lead') setAddLeadOpen(true);
          else if (a === 'task') setAddTaskOpen(true);
          else if (a === 'property') setAddPropertyOpen(true);
          else if (a === 'ask') setAskOpen(true);
        }}
      />
    </SafeAreaView>
  );
};

export default function Index() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, backgroundColor: colors.bg },
});
