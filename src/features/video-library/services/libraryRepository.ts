/**
 * Persists the video library: the MP4s and thumbnails live in
 * Documents/library (kept until the user deletes them, unlike the cache), and
 * index.json records the metadata. The index is versioned so its shape can
 * evolve with a migration instead of silently breaking.
 *
 * @format
 */

import {
  DocumentDirectoryPath,
  exists,
  mkdir,
  moveFile,
  readFile,
  unlink,
  writeFile,
} from '@dr.pogodin/react-native-fs';

import type { LibraryTarget, LibraryVideo } from '../types';

const LIBRARY_DIR = `${DocumentDirectoryPath}/library`;
const INDEX_PATH = `${LIBRARY_DIR}/index.json`;
const INDEX_VERSION = 1;

interface IndexFile {
  version: number;
  videos: LibraryVideo[];
}

export const libraryPath = (fileName: string): string =>
  `${LIBRARY_DIR}/${fileName}`;

const isLibraryVideo = (value: unknown): value is LibraryVideo => {
  const v = value as Partial<LibraryVideo> | null;
  return (
    !!v &&
    typeof v.id === 'string' &&
    typeof v.videoFile === 'string' &&
    typeof v.createdAt === 'number' &&
    typeof v.durationMs === 'number'
  );
};

/** Parses index.json defensively; a corrupt or unknown file yields an empty library. */
export function parseIndex(raw: string): LibraryVideo[] {
  try {
    const data = JSON.parse(raw) as Partial<IndexFile>;
    if (data.version !== INDEX_VERSION || !Array.isArray(data.videos)) {
      return [];
    }
    return data.videos.filter(isLibraryVideo).map(v => ({
      ...v,
      thumbnailFile: v.thumbnailFile ?? null,
      photoCount: v.photoCount ?? 0,
      width: v.width ?? 0,
      height: v.height ?? 0,
      savedToGallery: v.savedToGallery ?? false,
      galleryUri: v.galleryUri ?? null,
      deletedAt: v.deletedAt ?? null,
    }));
  } catch {
    return [];
  }
}

export function serializeIndex(videos: LibraryVideo[]): string {
  const data: IndexFile = { version: INDEX_VERSION, videos };
  return JSON.stringify(data);
}

async function ensureLibraryDir(): Promise<void> {
  if (!(await exists(LIBRARY_DIR))) {
    await mkdir(LIBRARY_DIR);
  }
}

/** Loads the index and drops entries whose video file no longer exists. */
export async function loadLibrary(): Promise<LibraryVideo[]> {
  await ensureLibraryDir();
  if (!(await exists(INDEX_PATH))) {
    return [];
  }
  const videos = parseIndex(await readFile(INDEX_PATH, 'utf8'));
  const present = await Promise.all(
    videos.map(v => exists(libraryPath(v.videoFile))),
  );
  return videos.filter((_, i) => present[i]);
}

/** Writes to a temp file and swaps it in, so a crash mid-write can't corrupt the index. */
export async function saveLibrary(videos: LibraryVideo[]): Promise<void> {
  await ensureLibraryDir();
  const tempPath = `${INDEX_PATH}.tmp`;
  await writeFile(tempPath, serializeIndex(videos), 'utf8');
  if (await exists(INDEX_PATH)) {
    await unlink(INDEX_PATH);
  }
  await moveFile(tempPath, INDEX_PATH);
}

export async function createLibraryTarget(): Promise<LibraryTarget> {
  await ensureLibraryDir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const videoFile = `video-${id}.mp4`;
  const thumbnailFile = `thumb-${id}.jpg`;
  return {
    id,
    videoFile,
    thumbnailFile,
    videoPath: libraryPath(videoFile),
    thumbnailPath: libraryPath(thumbnailFile),
  };
}

const unlinkIfExists = async (path: string): Promise<void> => {
  if (await exists(path)) {
    await unlink(path);
  }
};

export async function deleteLibraryFiles(
  files: Pick<LibraryVideo, 'videoFile' | 'thumbnailFile'>,
): Promise<void> {
  await Promise.all([
    unlinkIfExists(libraryPath(files.videoFile)),
    files.thumbnailFile
      ? unlinkIfExists(libraryPath(files.thumbnailFile))
      : Promise.resolve(),
  ]);
}
