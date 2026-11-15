/**
 * @format
 */

const FILE_SCHEME = 'file://';

/** Native APIs want plain paths; React Native components want file:// URIs. */
export const toFileUri = (path: string): string =>
  path.startsWith(FILE_SCHEME) ? path : `${FILE_SCHEME}${path}`;

export const toFilePath = (uri: string): string =>
  uri.startsWith(FILE_SCHEME)
    ? decodeURIComponent(uri.slice(FILE_SCHEME.length))
    : uri;
