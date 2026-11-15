/**
 * App-wide user feedback. Use these instead of Alert.alert:
 * - toast: short, non-blocking messages.
 * - dialog: popups that need a decision (confirm, custom actions).
 *
 * @format
 */

export { dialog } from './dialog';
export type { ConfirmOptions, DialogAction, DialogOptions } from './dialog';
export { FeedbackHost } from './FeedbackHost';
export { toast } from './toast';
