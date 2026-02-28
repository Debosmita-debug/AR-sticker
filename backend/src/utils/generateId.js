import { nanoid } from 'nanoid';

export const generateStickerId = () => {
  return `sticker_${nanoid(16)}`;
};

export const generateScanId = () => {
  return `scan_${nanoid(16)}`;
};
