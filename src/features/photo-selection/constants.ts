/**
 * @format
 */

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 5;

/**
 * Photos are downscaled by the picker. This keeps memory low while rendering
 * (five full-resolution photos can exhaust memory on Android) and still
 * leaves headroom over the 720x1280 output for the Ken Burns zoom.
 */
export const PICKER_MAX_DIMENSION = 1600;
export const PICKER_JPEG_QUALITY = 0.9;
