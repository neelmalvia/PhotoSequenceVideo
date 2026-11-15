/**
 * @format
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TabScreenProps } from '@/app/navigation/types';
import { useE2ESeed } from '@/dev/useE2ESeed';
import { Button } from '@/shared/components/Button';
import { toast } from '@/shared/feedback';
import { Clapperboard, ICON_SIZE, ImagePlus, X } from '@/shared/icons';
import { colors, radius, spacing, typography } from '@/shared/theme';
import type { Photo } from '@/shared/types/media';
import { MAX_PHOTOS, MIN_PHOTOS } from '../constants';
import { pickPhotos } from '../services/photoLibrary';
import { useSelectionStore, validateSelection } from '../store/selectionStore';

const COLUMNS = 3;

export function SelectPhotosScreen({ navigation }: TabScreenProps<'Create'>) {
  const photos = useSelectionStore(s => s.photos);
  const addPhotos = useSelectionStore(s => s.addPhotos);
  const removePhoto = useSelectionStore(s => s.removePhoto);
  const [picking, setPicking] = useState(false);

  const { width } = useWindowDimensions();
  const tileSize =
    (width - spacing.md * 2 - spacing.sm * (COLUMNS - 1)) / COLUMNS;

  const remaining = MAX_PHOTOS - photos.length;
  const validation = validateSelection(photos.length);

  // Dev-only: lets scripted simulator runs skip the system picker.
  useE2ESeed(
    useCallback(
      (seeded: Photo[]) => {
        addPhotos(seeded);
        navigation.navigate('Compose');
      },
      [addPhotos, navigation],
    ),
  );

  const handleAdd = useCallback(async () => {
    setPicking(true);
    try {
      addPhotos(await pickPhotos(remaining));
    } catch (e) {
      toast.error(
        'Could not open photos',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setPicking(false);
    }
  }, [addPhotos, remaining]);

  const renderItem = useCallback(
    ({ item, index }: { item: Photo; index: number }) => (
      <View style={[styles.tile, { width: tileSize, height: tileSize * 1.3 }]}>
        <Image
          source={{ uri: item.uri }}
          style={styles.tileImage}
          fadeDuration={0}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove photo ${index + 1}`}
          hitSlop={8}
          onPress={() => removePhoto(item.id)}
          style={styles.remove}
        >
          <X color={colors.text} size={ICON_SIZE.sm} strokeWidth={2.5} />
        </Pressable>
      </View>
    ),
    [removePhoto, tileSize],
  );

  return (
    // Bottom inset is handled by the tab bar.
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.title}>Photo Sequence</Text>
        <Text style={[typography.subtitle, styles.subtitle]}>
          Pick {MIN_PHOTOS} to {MAX_PHOTOS} photos. We'll turn them into a short
          video with dissolve and slide transitions and music.
        </Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ImagePlus color={colors.textMuted} size={ICON_SIZE.xl} />
            <Text style={[typography.subtitle, styles.emptyText]}>
              No photos selected yet.
            </Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={[typography.caption, styles.counter]}>
          {photos.length} of {MAX_PHOTOS} selected
          {validation.valid ? '' : ` · ${validation.reason}`}
        </Text>
        <Button
          testID="add-photos"
          title={photos.length === 0 ? 'Choose photos' : 'Add more photos'}
          icon={ImagePlus}
          variant={validation.valid ? 'secondary' : 'primary'}
          onPress={handleAdd}
          loading={picking}
          disabled={remaining === 0}
        />
        <Button
          testID="create-video"
          title="Create video"
          icon={Clapperboard}
          onPress={() => navigation.navigate('Compose')}
          disabled={!validation.valid}
          style={styles.createButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  grid: { padding: spacing.md, flexGrow: 1 },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  tile: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  tileImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.xs,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: '700' },
  remove: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: spacing.md },
  footer: { padding: spacing.md, gap: spacing.sm },
  counter: { textAlign: 'center', marginBottom: spacing.xs },
  createButton: { marginTop: spacing.xs },
});
