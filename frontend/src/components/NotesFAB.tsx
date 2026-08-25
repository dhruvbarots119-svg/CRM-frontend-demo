// Floating Notes — a global draggable/floating action button and sticky-note pad.
// Notes persist across sessions via AppContext.

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { BottomSheet } from '@/src/components/BottomSheet';
import { GhostButton, PrimaryButton, Row, timeAgo } from '@/src/components/ui';
import { StickyNote } from '@/src/store/types';
import { useToast } from '@/src/components/Toast';

const NOTE_COLORS: Record<StickyNote['color'], { bg: string; ink: string; border: string }> = {
  gold: { bg: '#FFF7E6', ink: '#8A6A39', border: '#EFDDB6' },
  blue: { bg: '#E4EEFA', ink: '#1E4B8E', border: '#BEDBF7' },
  green: { bg: '#E7FBEF', ink: '#146C43', border: '#B7EDCB' },
  pink: { bg: '#FCE4EC', ink: '#8B2547', border: '#F5C1D2' },
};

export const NotesFAB: React.FC<{ hidden?: boolean }> = ({ hidden }) => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { state } = useApp();
  const pending = state.notes.length;
  if (hidden) return null;

  return (
    <>
      <Pressable
        testID="notes-fab"
        onPress={() => setOpen(true)}
        style={[styles.fab, { bottom: 82 + insets.bottom }]}
        hitSlop={4}
      >
        <Ionicons name="reader" size={20} color={colors.navy} />
        {pending > 0 ? (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{pending > 9 ? '9+' : pending}</Text>
          </View>
        ) : null}
      </Pressable>
      <NotesSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
};

const NotesSheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { state, addNote, deleteNote, togglePinNote, updateNote } = useApp();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [color, setColor] = useState<StickyNote['color']>('gold');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const submit = () => {
    if (!draft.trim()) {
      toast.show('Write something first.', 'warning');
      return;
    }
    addNote(draft, color);
    setDraft('');
    toast.show('Note saved.', 'success');
  };

  const sorted = [...state.notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      eyebrow="QUICK NOTES"
      title={`${state.notes.length} note${state.notes.length === 1 ? '' : 's'}`}
      testID="notes-sheet"
      fullHeight
    >
      <View style={styles.composer}>
        <TextInput
          testID="note-input"
          value={draft}
          onChangeText={setDraft}
          placeholder="Jot down a quick thought, follow-up, or reminder…"
          placeholderTextColor={colors.textSubtle}
          multiline
          style={styles.composerInput}
        />
        <View style={styles.composerFoot}>
          <Row gap={6}>
            {(Object.keys(NOTE_COLORS) as StickyNote['color'][]).map((c) => (
              <Pressable
                key={c}
                testID={`note-color-${c}`}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: NOTE_COLORS[c].bg, borderColor: NOTE_COLORS[c].border },
                  color === c && { borderWidth: 2, borderColor: colors.navy },
                ]}
              />
            ))}
          </Row>
          <PrimaryButton
            testID="note-add"
            label="Save note"
            icon="add"
            onPress={submit}
            style={{ minHeight: 40, paddingHorizontal: 14 }}
          />
        </View>
      </View>

      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="reader-outline" size={40} color={colors.gold} />
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptyBody}>Capture reminders, follow-ups and site-visit prep here — they stick around forever.</Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.md }}>
          {sorted.map((n) => {
            const c = NOTE_COLORS[n.color];
            const isEditing = editingId === n.id;
            return (
              <View
                key={n.id}
                testID={`note-${n.id}`}
                style={[styles.note, { backgroundColor: c.bg, borderColor: c.border }]}
              >
                <View style={styles.noteTop}>
                  {n.pinned ? <Ionicons name="pin" size={12} color={c.ink} /> : null}
                  <Text style={[styles.noteTime, { color: c.ink }]}>{timeAgo(n.createdAt)}</Text>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    testID={`note-pin-${n.id}`}
                    onPress={() => togglePinNote(n.id)}
                    hitSlop={6}
                    style={styles.noteAction}
                  >
                    <Ionicons
                      name={n.pinned ? 'pin' : 'pin-outline'}
                      size={16}
                      color={c.ink}
                    />
                  </Pressable>
                  <Pressable
                    testID={`note-edit-${n.id}`}
                    onPress={() => {
                      setEditingId(n.id);
                      setEditText(n.text);
                    }}
                    hitSlop={6}
                    style={styles.noteAction}
                  >
                    <Ionicons name="create-outline" size={16} color={c.ink} />
                  </Pressable>
                  <Pressable
                    testID={`note-delete-${n.id}`}
                    onPress={() => {
                      deleteNote(n.id);
                      toast.show('Note deleted.', 'success');
                    }}
                    hitSlop={6}
                    style={styles.noteAction}
                  >
                    <Ionicons name="trash-outline" size={16} color={c.ink} />
                  </Pressable>
                </View>
                {isEditing ? (
                  <View>
                    <TextInput
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      style={[styles.editInput, { color: c.ink }]}
                      autoFocus
                    />
                    <Row style={{ marginTop: 6 }}>
                      <GhostButton
                        label="Cancel"
                        onPress={() => setEditingId(null)}
                        style={{ flex: 1, minHeight: 36 }}
                      />
                      <PrimaryButton
                        label="Save"
                        onPress={() => {
                          updateNote(n.id, { text: editText.trim() || n.text });
                          setEditingId(null);
                        }}
                        style={{ flex: 1, minHeight: 36, paddingHorizontal: 10 }}
                      />
                    </Row>
                  </View>
                ) : (
                  <Text style={[styles.noteText, { color: c.ink }]}>{n.text}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.md,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.navy,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadgeText: { color: colors.gold, fontSize: 9, fontWeight: '800' },
  composer: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#EFDDB6',
  },
  composerInput: {
    minHeight: 70,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlignVertical: 'top',
  },
  composerFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, textAlign: 'center', maxWidth: 300 },
  note: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  noteTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  noteTime: { fontSize: 10, fontWeight: '700', opacity: 0.7 },
  noteAction: { padding: 4 },
  noteText: { fontSize: fontSize.sm, lineHeight: 20, fontWeight: '600' },
  editInput: {
    fontSize: fontSize.sm,
    minHeight: 60,
    textAlignVertical: 'top',
    lineHeight: 20,
    fontWeight: '600',
  },
});
