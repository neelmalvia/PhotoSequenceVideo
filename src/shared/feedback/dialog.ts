/**
 * Themed replacement for Alert.alert. Dialogs are queued, so showing one
 * while another is open waits its turn instead of replacing it.
 *
 *   if (await dialog.confirm({ title: 'Delete?', destructive: true })) { ... }
 *
 *   dialog.show({
 *     title: 'Photo access is off',
 *     actions: [
 *       { label: 'Not now', style: 'cancel' },
 *       { label: 'Open Settings', onPress: Linking.openSettings },
 *     ],
 *   });
 *
 * @format
 */

import { create } from 'zustand';

import type { LucideIcon } from '@/shared/icons';

export type DialogActionStyle = 'default' | 'cancel' | 'destructive';

export interface DialogAction {
  label: string;
  style?: DialogActionStyle;
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  /** Optional icon shown above the title. */
  icon?: LucideIcon;
  /** Defaults to a single "OK" button. */
  actions?: DialogAction[];
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive (red). */
  destructive?: boolean;
}

interface QueuedDialog extends Required<Pick<DialogOptions, 'actions'>> {
  id: number;
  title: string;
  message?: string;
  icon?: LucideIcon;
}

interface DialogState {
  queue: QueuedDialog[];
}

export const useDialogStore = create<DialogState>(() => ({ queue: [] }));

let nextId = 1;

function show(options: DialogOptions): void {
  const dialogItem: QueuedDialog = {
    id: nextId++,
    title: options.title,
    message: options.message,
    icon: options.icon,
    actions: options.actions?.length
      ? options.actions
      : [{ label: 'OK', style: 'default' }],
  };
  useDialogStore.setState(state => ({ queue: [...state.queue, dialogItem] }));
}

/** Closes the visible dialog and runs the chosen action (used by DialogHost). */
export function resolveCurrentDialog(action?: DialogAction): void {
  useDialogStore.setState(state => ({ queue: state.queue.slice(1) }));
  action?.onPress?.();
}

function confirm({
  title,
  message,
  icon,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise(resolve => {
    show({
      title,
      message,
      icon,
      actions: [
        { label: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          label: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
    });
  });
}

export const dialog = {
  show,
  confirm,
  /** A dialog with a single OK button. */
  alert: (title: string, message?: string) => show({ title, message }),
};
