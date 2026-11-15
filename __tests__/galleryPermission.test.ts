/**
 * @format
 */

import { PermissionsAndroid } from 'react-native';

import {
  mapAndroidResult,
  mapIosStatus,
  needsAndroidWritePermission,
} from '@/shared/permissions/galleryPermission';

describe('mapIosStatus', () => {
  it('treats full and limited access as granted', () => {
    expect(mapIosStatus('granted')).toBe('granted');
    expect(mapIosStatus('limited')).toBe('granted');
  });

  it('asks when the user has not decided yet', () => {
    expect(mapIosStatus('not-determined')).toBe('undetermined');
  });

  it('sends refusals and restrictions to Settings', () => {
    expect(mapIosStatus('denied')).toBe('blocked');
    expect(mapIosStatus('blocked')).toBe('blocked');
    expect(mapIosStatus('unavailable')).toBe('blocked');
  });
});

describe('mapAndroidResult', () => {
  it('maps each request outcome', () => {
    expect(mapAndroidResult(PermissionsAndroid.RESULTS.GRANTED)).toBe(
      'granted',
    );
    expect(mapAndroidResult(PermissionsAndroid.RESULTS.DENIED)).toBe('denied');
    expect(mapAndroidResult(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)).toBe(
      'blocked',
    );
  });
});

describe('needsAndroidWritePermission', () => {
  it('is only needed before scoped storage (Android 10, API 29)', () => {
    expect(needsAndroidWritePermission(28)).toBe(true);
    expect(needsAndroidWritePermission(29)).toBe(false);
    expect(needsAndroidWritePermission(36)).toBe(false);
  });
});
