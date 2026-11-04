import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PROFILE_TYPE_HINTS,
  PROFILE_TYPE_LABELS,
  PROFILE_TYPES,
} from '../profile';
import type { CareRecipient, ProfileType } from '../types/models';
import { AidAmiTheme, px } from '../theme/AidAmiTheme';

import { Avatar } from './Avatar';

type ProfileTypePickerProps = {
  selected: ProfileType;
  onSelect: (type: ProfileType) => void;
  disabled?: boolean;
  /** When true, show short guidance under the selected type. */
  showHint?: boolean;
};

/**
 * Accessible French profile-type chips (≥48px). Persist via caller → care_recipients repo.
 */
export function ProfileTypePicker({
  selected,
  onSelect,
  disabled = false,
  showHint = true,
}: ProfileTypePickerProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Type de profil du proche"
    >
      <View style={styles.chipRow}>
        {PROFILE_TYPES.map((type) => {
          const isSelected = type === selected;
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
                pressed && !disabled && styles.pressed,
              ]}
              onPress={() => {
                if (!disabled && type !== selected) onSelect(type);
              }}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={PROFILE_TYPE_LABELS[type]}
              accessibilityHint={PROFILE_TYPE_HINTS[type]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && styles.chipLabelSelected,
                ]}
              >
                {PROFILE_TYPE_LABELS[type]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showHint ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {PROFILE_TYPE_HINTS[selected]}
        </Text>
      ) : null}
    </View>
  );
}

type CareRecipientSelectorProps = {
  recipients: CareRecipient[];
  activeId: string;
  onSelect: (recipient: CareRecipient) => void;
  disabled?: boolean;
};

/** Select among demo / foyer proches (≥48px rows). */
export function CareRecipientSelector({
  recipients,
  activeId,
  onSelect,
  disabled = false,
}: CareRecipientSelectorProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Proche accompagné"
      style={styles.recipientList}
    >
      {recipients.map((recipient) => {
        const isSelected = recipient.id === activeId;
        return (
          <Pressable
            key={recipient.id}
            style={({ pressed }) => [
              styles.recipientRow,
              isSelected && styles.recipientRowSelected,
              disabled && styles.chipDisabled,
              pressed && !disabled && styles.pressed,
            ]}
            onPress={() => {
              if (!disabled && !isSelected) onSelect(recipient);
            }}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled }}
            accessibilityLabel={`${recipient.first_name}, profil ${PROFILE_TYPE_LABELS[recipient.profile_type]}`}
          >
            <Avatar
              name={recipient.first_name}
              id={recipient.id}
              size={48}
            />
            <View style={styles.recipientText}>
              <Text style={styles.recipientName}>{recipient.first_name}</Text>
              <Text style={styles.recipientMeta}>
                {PROFILE_TYPE_LABELS[recipient.profile_type]}
              </Text>
            </View>
            {isSelected ? (
              <Text style={styles.activeBadge} accessibilityElementsHidden>
                Actif
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: px(AidAmiTheme.touchTarget.minHeight),
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: px(AidAmiTheme.borderRadius.button),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderWidth: 2,
    borderColor: AidAmiTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: AidAmiTheme.colors.primary,
    borderColor: AidAmiTheme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipLabel: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '600',
    color: AidAmiTheme.colors.primary,
  },
  chipLabelSelected: {
    color: AidAmiTheme.colors.onAccent,
  },
  hint: {
    marginTop: 10,
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    lineHeight:
      px(AidAmiTheme.typography.sizeCaption) *
      AidAmiTheme.typography.lineHeight,
    color: AidAmiTheme.colors.textMuted,
  },
  recipientList: {
    gap: 8,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: px(AidAmiTheme.touchTarget.minHeight) + 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: px(AidAmiTheme.borderRadius.card),
    backgroundColor: AidAmiTheme.colors.surfaceMuted,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recipientRowSelected: {
    borderColor: AidAmiTheme.colors.accent,
    backgroundColor: AidAmiTheme.colors.surface,
  },
  recipientText: {
    flex: 1,
    gap: 2,
  },
  recipientName: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeBody),
    fontWeight: '700',
    color: AidAmiTheme.colors.primary,
  },
  recipientMeta: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    color: AidAmiTheme.colors.textMuted,
  },
  activeBadge: {
    fontFamily: AidAmiTheme.typography.fontFamily,
    fontSize: px(AidAmiTheme.typography.sizeCaption),
    fontWeight: '700',
    color: AidAmiTheme.colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
});
