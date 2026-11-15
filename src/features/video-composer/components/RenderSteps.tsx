/**
 * The render checklist: load photos, render with music, save to the library.
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Check } from '@/shared/icons';
import { colors, radius, spacing } from '@/shared/theme';
import type { ComposerPhase } from '../hooks/useVideoComposer';

type StepState = 'pending' | 'active' | 'done';

interface RenderStepsProps {
  phase: ComposerPhase;
  progress: number;
  etaSeconds: number | null;
}

const PHASE_ORDER: ComposerPhase[] = ['loading', 'rendering', 'saving', 'done'];

function stepState(step: ComposerPhase, phase: ComposerPhase): StepState {
  const current = PHASE_ORDER.indexOf(phase);
  const index = PHASE_ORDER.indexOf(step);
  if (current < 0 || current < index) {
    return 'pending';
  }
  return current === index ? 'active' : 'done';
}

function etaLabel(etaSeconds: number | null): string {
  if (etaSeconds === null) {
    return 'Estimating time…';
  }
  return etaSeconds <= 1 ? 'Almost done' : `About ${etaSeconds}s left`;
}

export function RenderSteps({ phase, progress, etaSeconds }: RenderStepsProps) {
  const percent = Math.round(progress * 100);
  return (
    <View style={styles.card} accessibilityRole="list">
      <StepRow
        number={1}
        label="Loading photos"
        state={stepState('loading', phase)}
      />
      <StepRow
        number={2}
        label="Rendering video with music"
        state={stepState('rendering', phase)}
        trailing={phase === 'rendering' ? `${percent}%` : undefined}
        progress={phase === 'rendering' ? progress : undefined}
        detail={phase === 'rendering' ? etaLabel(etaSeconds) : undefined}
      />
      <StepRow
        number={3}
        label="Saving to My videos"
        state={stepState('saving', phase)}
        last
      />
    </View>
  );
}

interface StepRowProps {
  number: number;
  label: string;
  state: StepState;
  trailing?: string;
  progress?: number;
  detail?: string;
  last?: boolean;
}

function StepRow({
  number,
  label,
  state,
  trailing,
  progress,
  detail,
  last = false,
}: StepRowProps) {
  const done = state === 'done';
  const active = state === 'active';
  return (
    <View
      accessibilityLabel={`${label}: ${state === 'done' ? 'done' : state}`}
      style={[styles.row, !last && styles.rowDivider]}
    >
      <View
        style={[
          styles.marker,
          done && styles.markerDone,
          active && styles.markerActive,
        ]}
      >
        {done ? (
          <Check color={colors.background} size={16} strokeWidth={3} />
        ) : (
          <Text style={[styles.markerText, active && styles.markerTextActive]}>
            {number}
          </Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.label,
              active && styles.labelActive,
              state === 'pending' && styles.labelPending,
            ]}
          >
            {label}
          </Text>
          {done ? <Text style={styles.trailing}>Done</Text> : null}
          {trailing ? (
            <Text style={[styles.trailing, styles.trailingActive]}>
              {trailing}
            </Text>
          ) : null}
        </View>
        {progress !== undefined ? (
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]}
            />
          </View>
        ) : null}
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const MARKER = 28;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg - 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 9,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { backgroundColor: colors.success, borderColor: colors.success },
  markerActive: { borderWidth: 3, borderColor: colors.primary },
  markerText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  markerTextActive: { color: colors.text },
  body: {
    flex: 1,
    gap: 6,
    minHeight: MARKER,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: { flexShrink: 1, color: colors.text, fontSize: 15 },
  labelActive: { fontWeight: '600' },
  labelPending: { color: colors.textMuted },
  trailing: { color: colors.textMuted, fontSize: 13 },
  trailingActive: { color: colors.text, fontWeight: '600' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },
  detail: { color: colors.textMuted, fontSize: 12 },
});
