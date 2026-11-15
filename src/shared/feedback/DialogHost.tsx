/**
 * Renders the dialog at the front of the queue (see dialog.ts).
 *
 * @format
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON_SIZE } from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';
import {
  resolveCurrentDialog,
  useDialogStore,
  type DialogAction,
} from './dialog';

export function DialogHost() {
  const current = useDialogStore(s => s.queue[0]);

  if (!current) {
    return null;
  }

  const cancelAction = current.actions.find(a => a.style === 'cancel');
  const Icon = current.icon;
  const stacked = current.actions.length > 2;

  return (
    <Modal
      key={current.id}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android back button behaves like Cancel (or the only button).
      onRequestClose={() =>
        resolveCurrentDialog(cancelAction ?? current.actions[0])
      }
    >
      <View style={styles.scrim}>
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={styles.card}
        >
          {Icon ? (
            <View style={styles.iconWrap}>
              <Icon color={colors.text} size={ICON_SIZE.lg} />
            </View>
          ) : null}
          <Text style={styles.title}>{current.title}</Text>
          {current.message ? (
            <Text style={styles.message}>{current.message}</Text>
          ) : null}
          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {current.actions.map(action => (
              <DialogButton
                key={action.label}
                action={action}
                stretch={stacked}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DialogButton({
  action,
  stretch,
}: {
  action: DialogAction;
  stretch: boolean;
}) {
  const style = action.style ?? 'default';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => resolveCurrentDialog(action)}
      style={({ pressed }) => [
        styles.button,
        !stretch && styles.buttonInline,
        style === 'cancel' && styles.buttonCancel,
        style === 'default' && styles.buttonDefault,
        style === 'destructive' && styles.buttonDestructive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          style === 'cancel' && styles.buttonLabelCancel,
        ]}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionsStacked: { flexDirection: 'column' },
  button: {
    minHeight: 46,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInline: { flex: 1 },
  buttonCancel: { backgroundColor: colors.surfaceRaised },
  buttonDefault: { backgroundColor: colors.primary },
  buttonDestructive: { backgroundColor: colors.danger },
  pressed: { opacity: 0.8 },
  buttonLabel: { color: colors.onPrimary, fontSize: 15, fontWeight: '600' },
  buttonLabelCancel: { color: colors.text },
});
