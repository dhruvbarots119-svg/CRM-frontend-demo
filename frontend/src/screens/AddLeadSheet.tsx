// Add-lead form used from FAB or convert-to-lead.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Intent, LeadSource } from '@/src/store/types';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Field } from '@/src/components/Field';
import { Chip, GhostButton, PrimaryButton, Row } from '@/src/components/ui';
import { colors, fontSize, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { useToast } from '@/src/components/Toast';

const SOURCES: LeadSource[] = ['Property Finder', 'Bayut', 'Dubizzle', 'Website', 'Instagram', 'WhatsApp', 'Facebook', 'Referral', 'Manual'];
const INTENTS: Intent[] = ['Buy', 'Rent', 'Invest'];

export const AddLeadSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  onCreated?: (leadId: string) => void;
}> = ({ visible, onClose, onCreated }) => {
  const { addLead, state } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('2 BR');
  const [source, setSource] = useState<LeadSource>('Manual');
  const [intent, setIntent] = useState<Intent>('Buy');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setBudget('');
    setArea('');
    setBedrooms('2 BR');
    setSource('Manual');
    setIntent('Buy');
    setNotes('');
  };

  const submit = () => {
    if (!name.trim()) {
      toast.show('Add a name to create the lead.', 'warning');
      return;
    }
    const lead = addLead({
      name: name.trim(),
      phone,
      email,
      budget: Number(budget) || 0,
      area,
      bedrooms,
      source,
      intent,
      notes,
    });
    const agent = state.agents.find((a) => a.id === lead.assignedAgentId);
    toast.show(`Lead auto-assigned to ${agent?.name.split(' ')[0]}.`, 'success');
    reset();
    onCreated?.(lead.id);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="ADD LEAD" title="New lead" testID="add-lead-sheet" fullHeight>
      <Field label="Full name" value={name} onChangeText={setName} placeholder="e.g. Sarah Khan" testID="input-name" />
      <Row gap={spacing.sm}>
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ flex: 1 }} placeholder="+971 ..." />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={{ flex: 1 }} />
      </Row>
      <Row gap={spacing.sm}>
        <Field label="Budget (AED)" value={budget} onChangeText={setBudget} keyboardType="numeric" style={{ flex: 1 }} placeholder="2400000" />
        <Field label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} style={{ flex: 1 }} placeholder="2 BR" />
      </Row>
      <Field label="Preferred area" value={area} onChangeText={setArea} placeholder="Dubai Marina" />

      <Text style={styles.label}>Source</Text>
      <View style={styles.chipWrap}>
        {SOURCES.map((s) => (
          <Chip key={s} label={s} small active={source === s} onPress={() => setSource(s)} testID={`src-${s}`} />
        ))}
      </View>

      <Text style={styles.label}>Intent</Text>
      <View style={styles.chipWrap}>
        {INTENTS.map((i) => (
          <Chip key={i} label={i} small active={intent === i} onPress={() => setIntent(i)} />
        ))}
      </View>

      <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Anything worth remembering?" />

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          SAI will auto-assign this lead to the agent with the lightest active load.
        </Text>
      </View>

      <Row>
        <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
        <PrimaryButton label="Create lead" onPress={submit} icon="add-circle" testID="create-lead" style={{ flex: 1 }} />
      </Row>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8, marginTop: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md },
  hint: { backgroundColor: colors.goldSoft, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  hintText: { color: colors.goldDark, fontSize: fontSize.xs, fontWeight: '600' },
});
