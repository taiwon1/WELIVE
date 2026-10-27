import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const folders = new Set(['uploads', 'profiles']);

function assetRoot() {
  const root = process.env.LOCAL_ASSET_DIR;
  if (!root || !path.isAbsolute(root)) throw new Error('LOCAL_ASSET_DIR must be absolute');
  return root;
}

function assetPath(key: string) {
  const parts = key.split('/');
  const folder = parts[0];
  const filename = parts[1];
  if (parts.length !== 2 || !folder || !filename || !folders.has(folder) || !/^[0-9]+-[0-9a-f-]+\.(png|jpg|webp)$/.test(filename)) {
    throw new Error('Invalid local asset key');
  }
  return path.join(assetRoot(), folder, filename);
}

export async function writeLocalAsset(file: Express.Multer.File, folder: string, extension: string) {
  if (!folders.has(folder)) throw new Error('Invalid asset folder');
  const key = `${folder}/${Date.now()}-${randomUUID()}${extension}`;
  const destination = assetPath(key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, file.buffer, { flag: 'wx', mode: 0o644 });
  return { key, url: `/assets/${key}` };
}

export async function deleteLocalAsset(fileUrl: string) {
  if (!fileUrl.startsWith('/assets/')) return;
  const destination = assetPath(fileUrl.slice('/assets/'.length));
  try {
    await unlink(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
