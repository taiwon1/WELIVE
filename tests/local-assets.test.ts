import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { StorageService } from '../src/services/s3.service';
import { deleteLocalAsset } from '../src/services/local-assets.service';

describe('서버 디스크 이미지 저장', () => {
  let directory: string;
  const originalMode = process.env.UPLOAD_STORAGE;
  const originalDirectory = process.env.LOCAL_ASSET_DIR;

  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'welive-asset-test-'));
    process.env.UPLOAD_STORAGE = 'local';
    process.env.LOCAL_ASSET_DIR = directory;
  });

  afterAll(async () => {
    if (originalMode === undefined) delete process.env.UPLOAD_STORAGE;
    else process.env.UPLOAD_STORAGE = originalMode;
    if (originalDirectory === undefined) delete process.env.LOCAL_ASSET_DIR;
    else process.env.LOCAL_ASSET_DIR = originalDirectory;
    await rm(directory, { recursive: true, force: true });
  });

  it('실제 이미지 바이트를 저장하고 프로필 교체 때 삭제한다', async () => {
    const file = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      mimetype: 'image/jpeg',
      size: 4,
      originalname: 'photo.jpg',
    } as Express.Multer.File;
    const storage = new StorageService();
    const url = await storage.uploadFile(file, 'profiles');
    expect(url).toMatch(/^\/assets\/profiles\/[0-9]+-[0-9a-f-]+\.jpg$/);
    const saved = path.join(directory, url.slice('/assets/'.length));
    expect(await readFile(saved)).toEqual(file.buffer);
    await storage.deleteFile(url);
    await expect(stat(saved)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('경로 조작과 예상 밖 파일 형식을 거절한다', async () => {
    await expect(deleteLocalAsset('/assets/profiles/..')).rejects.toThrow('Invalid local asset key');
    const file = {
      buffer: Buffer.from('script'),
      mimetype: 'image/svg+xml',
      size: 6,
      originalname: 'script.svg',
    } as Express.Multer.File;
    await expect(new StorageService().uploadFile(file, 'profiles')).rejects.toMatchObject({ statusCode: 400 });
  });
});
