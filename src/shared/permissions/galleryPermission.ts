/**
 * Permission to save media to the user's gallery.
 *
 * Reading photos needs no permission in this app: both platforms use the
 * system photo picker (Android PickVisualMedia, iOS PHPicker), which only
 * hands back what the user taps. Managing saved videos is what needs consent:
 * - iOS: read-write photo library access ("Limited" is enough: assets the
 *   app creates are always part of the selection). Add-only access is not
 *   enough because the app must look up the asset it saved in order to move
 *   it to Recently Deleted later.
 * - Android 9 and below: WRITE_EXTERNAL_STORAGE. Android 10+ needs nothing:
 *   MediaStore inserts are allowed under scoped storage, and items the app
 *   inserted stay owned by it, so it can trash them.
 *
 * @format
 */

import {
  iosReadGalleryPermission,
  iosRequestReadWriteGalleryPermission,
  type CameraRollAuthorizationStatus,
} from '@react-native-camera-roll/camera-roll';
import { PermissionsAndroid, Platform, type Permission } from 'react-native';

/**
 * granted: go ahead.
 * denied:  the user said no but can be asked again.
 * blocked: the OS won't show the prompt again; only Settings can change it.
 */
export type PermissionResult = 'granted' | 'denied' | 'blocked';

const ANDROID_SCOPED_STORAGE_API = 29;

export function mapIosStatus(
  status: CameraRollAuthorizationStatus,
): PermissionResult | 'undetermined' {
  switch (status) {
    case 'granted':
    case 'limited':
      return 'granted';
    case 'not-determined':
      return 'undetermined';
    // iOS never re-prompts after a refusal, and "unavailable" means
    // restricted (e.g. parental controls), so both need Settings.
    default:
      return 'blocked';
  }
}

export function mapAndroidResult(
  result: (typeof PermissionsAndroid.RESULTS)[keyof typeof PermissionsAndroid.RESULTS],
): PermissionResult {
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }
  return 'denied';
}

export function needsAndroidWritePermission(apiLevel: number): boolean {
  return apiLevel < ANDROID_SCOPED_STORAGE_API;
}

async function requestIos(): Promise<PermissionResult> {
  const current = mapIosStatus(await iosReadGalleryPermission('readWrite'));
  if (current !== 'undetermined') {
    return current;
  }
  const requested = mapIosStatus(await iosRequestReadWriteGalleryPermission());
  return requested === 'undetermined' ? 'denied' : requested;
}

async function requestAndroid(): Promise<PermissionResult> {
  if (!needsAndroidWritePermission(Number(Platform.Version))) {
    return 'granted';
  }
  const permission = PermissionsAndroid.PERMISSIONS
    .WRITE_EXTERNAL_STORAGE as Permission;
  if (await PermissionsAndroid.check(permission)) {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(permission, {
    title: 'Save videos to your gallery',
    message:
      'Photo Sequence needs storage access to save the video you created.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return mapAndroidResult(result);
}

/** Checks, and if needed requests, access to save and later trash videos. */
export function requestGalleryAccess(): Promise<PermissionResult> {
  return Platform.OS === 'ios' ? requestIos() : requestAndroid();
}
