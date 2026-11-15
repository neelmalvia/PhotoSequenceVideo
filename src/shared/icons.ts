/**
 * The app's icon set, from Lucide.
 *
 * Icons are imported one file each: Metro does not tree-shake, so importing
 * from the package root would bundle all ~1,600 icons. Add new icons here
 * rather than importing lucide-react-native directly in screens.
 *
 * @format
 */

export { default as ArrowLeft } from 'lucide-react-native/icons/arrow-left';
export { default as AudioLines } from 'lucide-react-native/icons/audio-lines';
export { default as Check } from 'lucide-react-native/icons/check';
export { default as ChevronLeft } from 'lucide-react-native/icons/chevron-left';
export { default as CircleAlert } from 'lucide-react-native/icons/circle-alert';
export { default as CircleCheck } from 'lucide-react-native/icons/circle-check';
export { default as Clapperboard } from 'lucide-react-native/icons/clapperboard';
export { default as Clock } from 'lucide-react-native/icons/clock';
export { default as Download } from 'lucide-react-native/icons/download';
export { default as Film } from 'lucide-react-native/icons/film';
// Named ImageIcon so it never shadows React Native's <Image>.
export { default as ImageIcon } from 'lucide-react-native/icons/image';
export { default as ImagePlus } from 'lucide-react-native/icons/image-plus';
export { default as Info } from 'lucide-react-native/icons/info';
export { default as Maximize } from 'lucide-react-native/icons/maximize';
export { default as Pause } from 'lucide-react-native/icons/pause';
export { default as Play } from 'lucide-react-native/icons/play';
export { default as Plus } from 'lucide-react-native/icons/plus';
export { default as Share2 } from 'lucide-react-native/icons/share-2';
export { default as Settings } from 'lucide-react-native/icons/settings';
export { default as Trash } from 'lucide-react-native/icons/trash';
export { default as TriangleAlert } from 'lucide-react-native/icons/triangle-alert';
export { default as X } from 'lucide-react-native/icons/x';

export type { LucideIcon } from 'lucide-react-native';

export const ICON_SIZE = { sm: 16, md: 20, lg: 24, xl: 40 } as const;
export const ICON_STROKE = 2;
