// Properties list + detail + add/edit.
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@/src/theme';
import { useApp } from '@/src/store/AppContext';
import { Property, PropertyStatus, PropertyType } from '@/src/store/types';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Field } from '@/src/components/Field';
import { Card, Chip, EmptyState, fmtAED, GhostButton, PrimaryButton, Row, Section } from '@/src/components/ui';
import { useToast } from '@/src/components/Toast';

const STATUS_META: Record<PropertyStatus, { soft: string; color: string }> = {
  Available: { soft: colors.successSoft, color: colors.success },
  'Under Offer': { soft: colors.warningSoft, color: colors.warning },
  Sold: { soft: colors.surfaceElev, color: colors.textMuted },
  Rented: { soft: colors.infoSoft, color: colors.info },
};

const TYPES: PropertyType[] = ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Off-Plan'];
const STATUSES: PropertyStatus[] = ['Available', 'Under Offer', 'Sold', 'Rented'];

export const PropertiesScreen: React.FC<{
  onOpenProperty: (id: string) => void;
  onAddProperty: () => void;
}> = ({ onOpenProperty, onAddProperty }) => {
  const { state } = useApp();
  const [filter, setFilter] = useState<'All' | PropertyType>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = state.properties;
    if (filter !== 'All') list = list.filter((p) => p.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.area.toLowerCase().includes(q));
    }
    return list;
  }, [state.properties, filter, search]);

  const leadsByProperty = useMemo(() => {
    const map: Record<string, number> = {};
    state.leads.forEach((l) => {
      l.matchedPropertyIds.forEach((id) => {
        map[id] = (map[id] || 0) + 1;
      });
    });
    return map;
  }, [state.leads]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{state.properties.length}</Text>
            <Text style={styles.summaryLabel}>Listings</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {state.properties.filter((p) => p.status === 'Available').length}
            </Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {state.properties.filter((p) => p.status === 'Under Offer').length}
            </Text>
            <Text style={styles.summaryLabel}>Under offer</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{state.properties.filter((p) => p.status === 'Sold').length}</Text>
            <Text style={styles.summaryLabel}>Sold</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
          style={styles.chipRow}
        >
          <Chip label="All" active={filter === 'All'} onPress={() => setFilter('All')} testID="prop-filter-all" />
          {TYPES.map((t) => (
            <Chip key={t} label={t} active={filter === t} onPress={() => setFilter(t)} testID={`prop-filter-${t}`} />
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState icon="business" title="No properties" body="Add your first listing to unlock matching." />
        ) : (
          <View style={styles.grid}>
            {filtered.map((p) => {
              const meta = STATUS_META[p.status];
              const matches = leadsByProperty[p.id] || 0;
              return (
                <Pressable
                  key={p.id}
                  testID={`property-${p.id}`}
                  onPress={() => onOpenProperty(p.id)}
                  style={styles.card}
                >
                  <View style={styles.imgWrap}>
                    <Image source={{ uri: p.photoUrl }} style={styles.img} resizeMode="cover" />
                    <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
                      <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                      <Text style={[styles.statusText, { color: meta.color }]}>{p.status}</Text>
                    </View>
                    {matches > 0 ? (
                      <View style={styles.matchBadge}>
                        <Ionicons name="sparkles" size={10} color={colors.onGold} />
                        <Text style={styles.matchText}>{matches} lead{matches > 1 ? 's' : ''}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {p.area} · {p.bedrooms}BR · {p.sizeSqft.toLocaleString()} sq ft
                    </Text>
                    <Text style={styles.cardPrice}>{fmtAED(p.price)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <PrimaryButton
          testID="add-property-fab"
          label="Add property"
          icon="add-circle"
          onPress={onAddProperty}
          style={styles.fab}
        />
      </View>
    </View>
  );
};

// ------------------------------------------------------------------------
// Detail sheet + add sheet
// ------------------------------------------------------------------------

export const PropertyDetailSheet: React.FC<{
  propertyId: string | null;
  onClose: () => void;
}> = ({ propertyId, onClose }) => {
  const { state, updateProperty, deleteProperty } = useApp();
  const toast = useToast();
  const p = state.properties.find((x) => x.id === propertyId);
  if (!p) return null;

  const meta = STATUS_META[p.status];
  const matchingLeads = state.leads.filter((l) => l.matchedPropertyIds.includes(p.id));

  return (
    <BottomSheet visible={!!propertyId} onClose={onClose} eyebrow="LISTING" title={p.title} testID="property-detail" fullHeight>
      <Image source={{ uri: p.photoUrl }} style={styles.heroImg} resizeMode="cover" />
      <Row style={{ marginTop: spacing.md }}>
        <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.statusText, { color: meta.color }]}>{p.status}</Text>
        </View>
        <Text style={styles.detailPrice}>{fmtAED(p.price)}</Text>
      </Row>
      <Text style={styles.detailMeta}>
        {p.type} · {p.bedrooms}BR · {p.bathrooms}BA · {p.sizeSqft.toLocaleString()} sq ft
      </Text>
      <Text style={styles.detailAddress}>{p.address}</Text>

      <Section title="Status">
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={s}
              small
              active={p.status === s}
              color={STATUS_META[s].color}
              soft={STATUS_META[s].soft}
              onPress={() => {
                updateProperty(p.id, { status: s });
                toast.show(`Marked as ${s}.`, 'success');
              }}
              testID={`status-${s}`}
            />
          ))}
        </View>
      </Section>

      <Section title="Amenities">
        <View style={styles.amenityWrap}>
          {p.amenities.map((a) => (
            <Chip key={a} label={a} small soft={colors.surfaceElev} color={colors.text} />
          ))}
        </View>
      </Section>

      <Section title="Owner">
        <Card>
          <Text style={styles.ownerName}>{p.ownerName || 'Not set'}</Text>
          <Text style={styles.ownerPhone}>{p.ownerPhone || '—'}</Text>
          <Text style={styles.ownerCharges}>Service charges: AED {p.serviceCharges}/sq ft</Text>
        </Card>
      </Section>

      <Section title={`Matched leads (${matchingLeads.length})`}>
        {matchingLeads.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyBlockText}>No leads matched yet.</Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {matchingLeads.map((l) => (
              <View key={l.id} style={styles.matchLeadRow}>
                <Text style={styles.matchLeadName}>{l.name}</Text>
                <Text style={styles.matchLeadMeta}>{fmtAED(l.budget)} · {l.bedrooms}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      {p.notes ? (
        <Section title="Notes">
          <Card>
            <Text style={styles.notesText}>{p.notes}</Text>
          </Card>
        </Section>
      ) : null}

      {state.role === 'admin' ? (
        <GhostButton
          icon="trash"
          label="Delete property"
          danger
          testID="delete-property"
          onPress={() => {
            deleteProperty(p.id);
            toast.show('Property deleted.', 'success');
            onClose();
          }}
        />
      ) : null}
    </BottomSheet>
  );
};

export const AddPropertySheet: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { addProperty } = useApp();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('2');
  const [baths, setBaths] = useState('2');
  const [size, setSize] = useState('');
  const [type, setType] = useState<PropertyType>('Apartment');
  const [status, setStatus] = useState<PropertyStatus>('Available');
  const [owner, setOwner] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [amenities, setAmenities] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800');

  const submit = () => {
    if (!title.trim()) {
      toast.show('Add a title.', 'warning');
      return;
    }
    addProperty({
      title: title.trim(),
      area,
      address: area,
      price: Number(price) || 0,
      bedrooms: Number(beds) || 1,
      bathrooms: Number(baths) || 1,
      sizeSqft: Number(size) || 0,
      type,
      status,
      ownerName: owner,
      ownerPhone,
      amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean),
      photoUrl: photo,
      notes,
    });
    toast.show('Property added.', 'success');
    setTitle(''); setArea(''); setPrice(''); setSize(''); setOwner(''); setOwnerPhone(''); setAmenities(''); setNotes('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="ADD" title="New property" testID="add-property-sheet" fullHeight>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="Marina Vista 2503" testID="input-title" />
      <Field label="Area / Address" value={area} onChangeText={setArea} placeholder="Dubai Marina" />
      <Row gap={spacing.sm}>
        <Field label="Price (AED)" value={price} onChangeText={setPrice} keyboardType="numeric" style={{ flex: 1 }} />
        <Field label="Size (sq ft)" value={size} onChangeText={setSize} keyboardType="numeric" style={{ flex: 1 }} />
      </Row>
      <Row gap={spacing.sm}>
        <Field label="Bedrooms" value={beds} onChangeText={setBeds} keyboardType="numeric" style={{ flex: 1 }} />
        <Field label="Bathrooms" value={baths} onChangeText={setBaths} keyboardType="numeric" style={{ flex: 1 }} />
      </Row>

      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.chipInline}>
        {TYPES.map((t) => (
          <Chip key={t} small label={t} active={type === t} onPress={() => setType(t)} />
        ))}
      </View>

      <Text style={styles.formLabel}>Status</Text>
      <View style={styles.chipInline}>
        {STATUSES.map((s) => (
          <Chip key={s} small label={s} active={status === s} onPress={() => setStatus(s)} color={STATUS_META[s].color} soft={STATUS_META[s].soft} />
        ))}
      </View>

      <Field label="Owner name" value={owner} onChangeText={setOwner} />
      <Field label="Owner phone" value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" />
      <Field label="Amenities (comma-separated)" value={amenities} onChangeText={setAmenities} placeholder="Balcony, Pool, Gym" />
      <Field label="Photo URL" value={photo} onChangeText={setPhoto} />
      <Field label="Notes" value={notes} onChangeText={setNotes} multiline />

      <Row>
        <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
        <PrimaryButton label="Create" onPress={submit} icon="add-circle" testID="create-property" style={{ flex: 1 }} />
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
  summaryValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  chipRow: { marginBottom: spacing.md, marginHorizontal: -spacing.lg },
  chipRowContent: { paddingHorizontal: spacing.lg, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 130 },
  statusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  matchText: { color: colors.onGold, fontSize: 10, fontWeight: '800' },
  cardBody: { padding: spacing.sm + 2 },
  cardTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },
  cardMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  cardPrice: { color: colors.goldDark, fontSize: fontSize.base, fontWeight: '800', marginTop: 5 },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  fab: { paddingHorizontal: spacing.xl, minWidth: 200 },
  heroImg: { width: '100%', height: 200, borderRadius: radius.md },
  detailPrice: { color: colors.goldDark, fontSize: fontSize.xl, fontWeight: '800', marginLeft: 8 },
  detailMeta: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', marginTop: 8 },
  detailAddress: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ownerName: { color: colors.text, fontSize: fontSize.base, fontWeight: '700' },
  ownerPhone: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 3 },
  ownerCharges: { color: colors.textSubtle, fontSize: fontSize.xs, marginTop: 6 },
  emptyBlock: { padding: spacing.md, backgroundColor: colors.surfaceElev, borderRadius: radius.md },
  emptyBlockText: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center' },
  matchLeadRow: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  matchLeadName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  matchLeadMeta: { color: colors.textMuted, fontSize: fontSize.xs },
  notesText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 20 },
  formLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
  chipInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
});
