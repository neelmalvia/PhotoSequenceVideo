/**
 * @format
 */

export interface Photo {
  id: string;
  /** file:// URI to a local, already downscaled JPEG. */
  uri: string;
  width: number;
  height: number;
}
