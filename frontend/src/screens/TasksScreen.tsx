// Tasks screen — list, priority filter, overdue highlight, add / edit / toggle / delete.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, priorityMeta, radius, spacing } from '@/src/theme';
import { useApp, visibleTasks } from '@/src/store/AppContext';
import { Task, TaskPriority, TaskType } from '@/src/store/types';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Field } from '@/src/components/Field';
import { Chip, fmtDateTime, GhostButton, PrimaryButton, Row } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

const PRIORITIES: TaskPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const TYPES: TaskType[] = ['Follow-up', 'Call', 'Viewing', 'Meeting', 'Document', 'Custom'];

const isOverdue = (t: Task) => t.status === 'Pending' && new Date(t.dueAt) < new Date();

export const TasksScreen: React.FC<{
  onAddTask: () => void;
  onOpenTask: (id: string) => void;
}> = ({ onAddTask, onOpenTask }) => {
  const { state, toggleTask } = useApp();
  const tasks = visibleTasks(state);
  const [filter, setFilter] = useState<'All' | 'Overdue' | 'Today' | 'Completed'>('All');
  const toast = useToast();

  const filtered = useMemo(() => {
    const today = new Date().toDateString();
    if (filter === 'All') return tasks;
    if (filter === 'Overdue') return tasks.filter(isOverdue);
    if (filter === 'Today')
      return tasks.filter((t) => t.status === 'Pending' && new Date(t.dueAt).toDateString() === today);
    return tasks.filter((t) => t.status === 'Completed');
  }, [tasks, filter]);

  const pending = tasks.filter((t) => t.status === 'Pending').length;
  const overdue = tasks.filter(isOverdue).length;
  const done = tasks.filter((t) => t.status === 'Completed').length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pending}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>{overdue}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{done}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
          {(['All', 'Overdue', 'Today', 'Completed'] as const).map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} testID={`task-filter-${f}`} />
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyBody}>Add a task or switch filter.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {filtered.map((t) => {
              const overdueTask = isOverdue(t);
              const prio = priorityMeta[t.priority];
              const agent = state.agents.find((a) => a.id === t.assignedAgentId);
              return (
                <Pressable
                  key={t.id}
                  testID={`task-${t.id}`}
                  onPress={() => onOpenTask(t.id)}
                  style={[styles.taskRow, overdueTask && styles.taskRowOverdue]}
                >
                  <Pressable
                    testID={`task-toggle-${t.id}`}
                    onPress={() => {
                      toggleTask(t.id);
                      toast.show(t.status === 'Pending' ? 'Task completed.' : 'Task reopened.', 'success');
                    }}
                    style={styles.checkbox}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={t.status === 'Completed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={26}
                      color={t.status === 'Completed' ? colors.success : overdueTask ? colors.error : colors.textSubtle}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <View style={styles.taskTop}>
                      <Text
                        style={[
                          styles.taskTitle,
                          t.status === 'Completed' && { textDecorationLine: 'line-through', color: colors.textSubtle },
                        ]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <View style={[styles.prioPill, { backgroundColor: prio.soft }]}>
                        <Text style={[styles.prioText, { color: prio.color }]}>{t.priority}</Text>
                      </View>
                    </View>
                    <Text style={[styles.taskMeta, overdueTask && { color: colors.error, fontWeight: '700' }]}>
                      {overdueTask ? '⚠ Overdue · ' : ''}
                      {fmtDateTime(t.dueAt)} · {t.type}
                    </Text>
                    <Text style={styles.taskAgent}>{agent?.name || 'Unassigned'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <PrimaryButton
          label="Add task"
          icon="add-circle"
          onPress={onAddTask}
          testID="add-task-fab"
          style={styles.fab}
        />
      </View>
    </View>
  );
};

export const TaskDetailSheet: React.FC<{
  taskId: string | null;
  onClose: () => void;
}> = ({ taskId, onClose }) => {
  const { state, toggleTask, updateTask, deleteTask } = useApp();
  const toast = useToast();
  const t = state.tasks.find((x) => x.id === taskId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignee, setAssignee] = useState('');

  React.useEffect(() => {
    if (t && editing) {
      setTitle(t.title);
      setNotes(t.notes);
      setPriority(t.priority);
      setAssignee(t.assignedAgentId);
    }
  }, [t, editing]);

  if (!t) return null;

  const overdueTask = isOverdue(t);
  const agent = state.agents.find((a) => a.id === t.assignedAgentId);
  const lead = state.leads.find((l) => l.id === t.leadId);
  const isAdmin = state.role === 'admin';

  const save = () => {
    updateTask(t.id, { title, notes, priority, assignedAgentId: assignee });
    setEditing(false);
    toast.show('Task updated.', 'success');
  };

  return (
    <BottomSheet visible={!!taskId} onClose={onClose} eyebrow="TASK" title={t.title} testID="task-detail" fullHeight>
      <View style={styles.taskDetailMeta}>
        <View style={[styles.prioPill, { backgroundColor: priorityMeta[t.priority].soft }]}>
          <Text style={[styles.prioText, { color: priorityMeta[t.priority].color }]}>{t.priority}</Text>
        </View>
        <Chip label={t.type} small soft={colors.surfaceElev} color={colors.textMuted} />
        <Chip
          label={t.status}
          small
          soft={t.status === 'Completed' ? colors.successSoft : colors.warningSoft}
          color={t.status === 'Completed' ? colors.success : colors.warning}
        />
      </View>

      {overdueTask ? (
        <View style={styles.overdueBanner}>
          <Ionicons name="warning" size={16} color={colors.error} />
          <Text style={styles.overdueText}>Overdue — was due {fmtDateTime(t.dueAt)}</Text>
        </View>
      ) : (
        <Text style={styles.dueLine}>Due {fmtDateTime(t.dueAt)}</Text>
      )}

      {agent ? <Text style={styles.detailRow}>Assigned to <Text style={{ fontWeight: '700' }}>{agent.name}</Text></Text> : null}
      {lead ? <Text style={styles.detailRow}>Linked lead: {lead.name}</Text> : null}
      {t.notes ? <Text style={styles.detailNotes}>{t.notes}</Text> : null}

      {editing ? (
        <View style={styles.editForm}>
          <Field label="Title" value={title} onChangeText={setTitle} />
          <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
          <Text style={styles.formLabel}>Priority</Text>
          <View style={styles.chipRowInline}>
            {PRIORITIES.map((p) => (
              <Chip
                key={p}
                small
                label={p}
                active={priority === p}
                onPress={() => setPriority(p)}
                color={priorityMeta[p].color}
                soft={priorityMeta[p].soft}
              />
            ))}
          </View>
          {isAdmin ? (
            <>
              <Text style={styles.formLabel}>Assign to</Text>
              <View style={styles.chipRowInline}>
                {state.agents.filter((a) => a.role === 'agent').map((a) => (
                  <Chip key={a.id} small label={a.name.split(' ')[0]} active={assignee === a.id} onPress={() => setAssignee(a.id)} />
                ))}
              </View>
            </>
          ) : null}
          <Row>
            <GhostButton label="Cancel" onPress={() => setEditing(false)} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={save} testID="save-task" style={{ flex: 1 }} />
          </Row>
        </View>
      ) : (
        <>
          <PrimaryButton
            label={t.status === 'Completed' ? 'Reopen task' : 'Mark complete'}
            icon={t.status === 'Completed' ? 'refresh' : 'checkmark-done'}
            testID="btn-toggle-task"
            onPress={() => {
              toggleTask(t.id);
              toast.show(t.status === 'Pending' ? 'Task completed.' : 'Task reopened.', 'success');
            }}
            style={{ marginTop: spacing.md }}
          />
          <Row style={{ marginTop: spacing.sm }}>
            <GhostButton label="Edit" icon="create" onPress={() => setEditing(true)} style={{ flex: 1 }} />
            <GhostButton
              label="Delete"
              icon="trash"
              danger
              onPress={() => {
                deleteTask(t.id);
                toast.show('Task deleted.', 'success');
                onClose();
              }}
              style={{ flex: 1 }}
            />
          </Row>
        </>
      )}
    </BottomSheet>
  );
};

export const AddTaskSheet: React.FC<{ visible: boolean; onClose: () => void; leadId?: string }> = ({ visible, onClose, leadId }) => {
  const { state, addTask } = useApp();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('Follow-up');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDays, setDueDays] = useState('1');
  const [notes, setNotes] = useState('');
  const [assignee, setAssignee] = useState(state.currentAgentId);
  const isAdmin = state.role === 'admin';

  React.useEffect(() => {
    if (visible) setAssignee(state.currentAgentId);
  }, [visible, state.currentAgentId]);

  const submit = () => {
    if (!title.trim()) {
      toast.show('Give the task a title.', 'warning');
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + (Number(dueDays) || 1));
    addTask({
      title: title.trim(),
      type,
      priority,
      notes,
      dueAt: due.toISOString(),
      leadId,
      assignedAgentId: assignee,
    });
    toast.show('Task created.', 'success');
    setTitle(''); setNotes(''); setDueDays('1');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="TASK" title="New task" testID="add-task-sheet" fullHeight>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Follow up with Sarah" testID="input-task-title" />
      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.chipRowInline}>
        {TYPES.map((tt) => (
          <Chip key={tt} small label={tt} active={type === tt} onPress={() => setType(tt)} />
        ))}
      </View>
      <Text style={styles.formLabel}>Priority</Text>
      <View style={styles.chipRowInline}>
        {PRIORITIES.map((p) => (
          <Chip key={p} small label={p} active={priority === p} onPress={() => setPriority(p)} color={priorityMeta[p].color} soft={priorityMeta[p].soft} />
        ))}
      </View>
      <Field label="Due in (days)" value={dueDays} onChangeText={setDueDays} keyboardType="numeric" />
      {isAdmin ? (
        <>
          <Text style={styles.formLabel}>Assign to</Text>
          <View style={styles.chipRowInline}>
            {state.agents.filter((a) => a.role === 'agent').map((a) => (
              <Chip key={a.id} small label={a.name.split(' ')[0]} active={assignee === a.id} onPress={() => setAssignee(a.id)} />
            ))}
          </View>
        </>
      ) : null}
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Row>
        <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
        <PrimaryButton label="Create task" onPress={submit} icon="add-circle" testID="create-task" style={{ flex: 1 }} />
      </Row>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 140 },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  chipRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
  chipRowContent: { paddingHorizontal: spacing.lg, gap: 8 },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  taskRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  taskRowOverdue: { borderColor: colors.error, backgroundColor: '#FFF6F6' },
  checkbox: { padding: 2 },
  taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  taskTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800', flex: 1 },
  prioPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  prioText: { fontSize: 10, fontWeight: '800' },
  taskMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  taskAgent: { color: colors.textSubtle, fontSize: 10, marginTop: 2 },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  fab: { paddingHorizontal: spacing.xl, minWidth: 200 },
  taskDetailMeta: { flexDirection: 'row', gap: 6, marginBottom: spacing.md, alignItems: 'center' },
  overdueBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  overdueText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '700' },
  dueLine: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  detailRow: { color: colors.text, fontSize: fontSize.sm, marginTop: 4 },
  detailNotes: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceElev,
    padding: spacing.md,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  editForm: { marginTop: spacing.md },
  formLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6, marginTop: 6 },
  chipRowInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
});
