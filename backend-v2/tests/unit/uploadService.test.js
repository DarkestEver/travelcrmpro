const path = require('path');
const fs = require('fs').promises;
const {
  deleteFile,
  getFileUrl,
  fileExists,
  getFileInfo,
  ensureUploadDirs,
  AVATAR_DIR,
  DOCUMENT_DIR,
} = require('../../src/services/uploadService');

describe('Upload Service Tests', () => {
  beforeAll(async () => {
    // Ensure upload directories exist
    await ensureUploadDirs();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const avatarFiles = await fs.readdir(AVATAR_DIR);
      for (const file of avatarFiles) {
        if (file.includes('test-')) {
          await fs.unlink(path.join(AVATAR_DIR, file));
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  });

  describe('ensureUploadDirs', () => {
    it('should create upload directories', async () => {
      await ensureUploadDirs();
      
      const avatarDirExists = await fs.access(AVATAR_DIR).then(() => true).catch(() => false);
      const documentDirExists = await fs.access(DOCUMENT_DIR).then(() => true).catch(() => false);
      
      expect(avatarDirExists).toBe(true);
      expect(documentDirExists).toBe(true);
    });
  });

  describe('getFileUrl', () => {
    it('should generate correct avatar URL', () => {
      const url = getFileUrl('test-avatar.jpg', 'avatar');
      expect(url).toBe('/uploads/avatars/test-avatar.jpg');
    });

    it('should generate correct document URL', () => {
      const url = getFileUrl('test-doc.pdf', 'document');
      expect(url).toBe('/uploads/documents/test-doc.pdf');
    });

    it('should return null for empty filename', () => {
      const url = getFileUrl(null);
      expect(url).toBeNull();
    });

    it('should return as-is if already full path', () => {
      const fullPath = '/uploads/avatars/existing.jpg';
      const url = getFileUrl(fullPath);
      expect(url).toBe(fullPath);
    });
  });

  describe('fileExists', () => {
    it('should return false for non-existent file', async () => {
      const exists = await fileExists('/uploads/avatars/nonexistent.jpg');
      expect(exists).toBe(false);
    });

    it('should return true for existing file', async () => {
      // Create a test file
      const testFile = path.join(AVATAR_DIR, 'test-exists.txt');
      await fs.writeFile(testFile, 'test content');
      
      const exists = await fileExists('/uploads/avatars/test-exists.txt');
      expect(exists).toBe(true);
      
      // Cleanup
      await fs.unlink(testFile);
    });
  });

  describe('getFileInfo', () => {
    it('should return file info for existing file', async () => {
      // Create a test file
      const testFile = path.join(AVATAR_DIR, 'test-info.txt');
      await fs.writeFile(testFile, 'test content');
      
      const info = await getFileInfo('/uploads/avatars/test-info.txt');
      
      expect(info.exists).toBe(true);
      expect(info.size).toBeGreaterThan(0);
      expect(info.created).toBeDefined();
      expect(info.modified).toBeDefined();
      expect(typeof info.created.getTime()).toBe('number');
      expect(typeof info.modified.getTime()).toBe('number');
      
      // Cleanup
      await fs.unlink(testFile);
    });

    it('should return exists false for non-existent file', async () => {
      const info = await getFileInfo('/uploads/avatars/nonexistent.jpg');
      expect(info.exists).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      // Create a test file
      const testFile = path.join(AVATAR_DIR, 'test-delete.txt');
      await fs.writeFile(testFile, 'test content');
      
      const deleted = await deleteFile('/uploads/avatars/test-delete.txt');
      expect(deleted).toBe(true);
      
      // Verify file is deleted
      const exists = await fileExists('/uploads/avatars/test-delete.txt');
      expect(exists).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const deleted = await deleteFile('/uploads/avatars/nonexistent.jpg');
      expect(deleted).toBe(false);
    });
  });
});
