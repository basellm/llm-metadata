import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import {
  ensureDirSync,
  copyDirSyncIfExists,
  removeNonJsonFiles,
  sanitizeFileSegment,
  writeJSONIfChanged,
  writeTextIfChanged,
  readJSONIfExists,
} from './file-utils.js';

// We only need the basic Jest global types for compilation

declare const jest: {
  mock(moduleName: string): void;
  clearAllMocks(): void;
  spyOn(obj: any, methodName: string): any;
};

declare const describe: (title: string, fn: () => void) => void;
declare const it: (title: string, fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const expect: (actual: any) => any;


// Mock the fs module to avoid actually writing files during tests
jest.mock('node:fs');

// Don't mock the path module since we need extname and join to work properly
// jest.mock('node:path');

describe('file-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDirSync', () => {
    it('should create directory if it does not exist', () => {
      (existsSync as any).mockReturnValue(false);
      (mkdirSync as any).mockImplementation();

      ensureDirSync('/some/path');

      expect(existsSync).toHaveBeenCalledWith('/some/path');
      expect(mkdirSync).toHaveBeenCalledWith('/some/path', { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      (existsSync as any).mockReturnValue(true);

      ensureDirSync('/existing/path');

      expect(existsSync).toHaveBeenCalledWith('/existing/path');
      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('copyDirSyncIfExists', () => {
    it('should not copy anything if source directory does not exist', () => {
      (existsSync as any).mockReturnValueOnce(false);

      copyDirSyncIfExists('/source/path', '/dest/path');

      expect(existsSync).toHaveBeenCalledWith('/source/path');
    });

    it('should copy files and directories from source to destination', () => {
      // Source directory exists, destination may not exist initially
      (existsSync as any).mockImplementation((path: string) => {
        if (path === '/source/path') return true;
        if (path === '/source/path/subdir') return true;
        if (path === '/source/path/file.txt') return true;
        // When recursion happens for subdir, we need to handle that too
        if (path.endsWith('/file.txt')) return true;  // General pattern for files
        // Destination directory will be created by ensureDirSync, so initially return false
        if (path === '/dest/path') return false;
        // Files in destination may be checked after creation
        if (path.startsWith('/dest/path/') && path.endsWith('/file.txt')) return false;  // Assume doesn't exist initially
        if (path === '/dest/path/subdir') return false;  // Ditto for subdir
        return false;
      });

      // Mock statSync to return directory for subdir and file for file.txt
      (statSync as any).mockImplementation((path: string | undefined) => {
        if (!path) return { isDirectory: () => false, isFile: () => false };
        if (path === '/source/path/subdir' || path.endsWith('/subdir')) {
          return { isDirectory: () => true, isFile: () => false };
        }
        return { isDirectory: () => false, isFile: () => true };
      });

      // Mock readdirSync to return different items for different directories
      (readdirSync as any).mockImplementation((path: string) => {
        if (path === '/source/path') {
          return ['file.txt', 'subdir'];  // Main dir has file and subdirectory
        } else if (path.endsWith('/subdir')) {
          return [];  // Subdir is empty - prevent infinite recursion
        }
        return [];
      });

      // Mock readFileSync to return content
      (readFileSync as any).mockReturnValue('file content');

      // Mock mkdirSync for ensureDirSync to work (since it calls mkdirSync internally)
      (mkdirSync as any).mockImplementation();

      copyDirSyncIfExists('/source/path', '/dest/path');

      // Check that mkdirSync was called to ensure directory was created
      expect(mkdirSync).toHaveBeenCalledWith('/dest/path', { recursive: true });
      expect(readdirSync).toHaveBeenCalledWith('/source/path');
      // Check that read and write were called - account for recursive directory processing
      expect(readFileSync).toHaveBeenCalled();
      expect(readFileSync).toHaveBeenCalledWith('/source/path/file.txt');
      expect(writeFileSync).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalledWith('/dest/path/file.txt', 'file content');
      // Additionally check that it was called for subdir
      expect(mkdirSync).toHaveBeenCalledWith('/dest/path', { recursive: true }); // for destination
      expect(mkdirSync).toHaveBeenCalledWith('/dest/path/subdir', { recursive: true }); // for subdirectory
    });
  });

  describe('removeNonJsonFiles', () => {
    it('should not process if directory does not exist', () => {
      (existsSync as any).mockReturnValue(false);

      removeNonJsonFiles('/nonexistent/dir');

      expect(existsSync).toHaveBeenCalledWith('/nonexistent/dir');
    });

    it('should remove non-json files', () => {
      (existsSync as any).mockReturnValueOnce(true); // directory exists
      (readdirSync as any).mockReturnValue(['file1.txt', 'file2.json', 'file3.js']);

      // Mock statSync to check the full path to determine if it's a file
      (statSync as any).mockImplementation((inputPath: string | undefined) => {
        if (!inputPath) return { isFile: () => false };
        // Since we're receiving the full path to the file in the directory
        // We need to mock stat correctly for each specific file path
        // Only mock the specific files we know are there
        if (inputPath.endsWith('file1.txt') || inputPath.endsWith('file2.json') || inputPath.endsWith('file3.js')) {
          return { isFile: () => true };
        }
        return { isFile: () => false };
      });

      (unlinkSync as any).mockImplementation();

      removeNonJsonFiles('/some/dir');

      expect(unlinkSync).toHaveBeenCalledTimes(2); // Should remove txt and js files, keep json
    });

    it('should not remove files in dryRun mode', () => {
      (existsSync as any).mockReturnValueOnce(true);
      (readdirSync as any).mockReturnValue(['file1.txt']);
      (statSync as any).mockImplementation(() => ({ isFile: () => true }));
      (unlinkSync as any).mockImplementation();

      removeNonJsonFiles('/some/dir', { dryRun: true });

      expect(unlinkSync).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeFileSegment', () => {
    it('should replace invalid characters with underscores', () => {
      expect(sanitizeFileSegment('valid-file_name')).toBe('valid-file_name');
      expect(sanitizeFileSegment('file with spaces')).toBe('file_with_spaces');
      expect(sanitizeFileSegment('file/with\\invalid|chars')).toBe('file_with_invalid_chars');
      expect(sanitizeFileSegment('file@#$%^&*()chars')).toBe('file_________chars');
    });

    it('should allow alphanumeric, hyphens, underscores, and periods', () => {
      expect(sanitizeFileSegment('valid123-file_name.test')).toBe('valid123-file_name.test');
    });
  });

  describe('writeJSONIfChanged', () => {
    it('should write file if content has changed', () => {
      (existsSync as any).mockReturnValue(false); // File doesn't exist
      (writeFileSync as any).mockImplementation();
      (mkdirSync as any).mockImplementation(); // Mock mkdirSync used by ensureDirSync

      const result = writeJSONIfChanged('/path/to/file.json', { test: 'data' });

      expect(result).toBe(true); // Indicates change occurred
      expect(mkdirSync).toHaveBeenCalledWith('/path/to', { recursive: true }); // dirname('/path/to/file.json') = '/path/to'
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should not write file if content has not changed', () => {
      const data = { test: 'data' };
      // The stableStringify function formats with 2-space indents
      const originalContent = '{\n  \"test\": \"data\"\n}';
      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue(originalContent);
      (writeFileSync as any).mockImplementation();

      const result = writeJSONIfChanged('/path/to/file.json', data);

      expect(result).toBe(false); // No change
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should write in dryRun mode but return true', () => {
      (existsSync as any).mockReturnValue(false);
      (writeFileSync as any).mockImplementation();

      const result = writeJSONIfChanged('/path/to/file.json', { test: 'data' }, { dryRun: true });

      expect(result).toBe(true);
      expect(writeFileSync).not.toHaveBeenCalled(); // Not actually written in dryRun
    });
  });

  describe('writeTextIfChanged', () => {
    it('should write file if content has changed', () => {
      (existsSync as any).mockReturnValue(false); // File doesn't exist
      (writeFileSync as any).mockImplementation();
      (mkdirSync as any).mockImplementation(); // Mock mkdirSync used by ensureDirSync

      const result = writeTextIfChanged('/path/to/file.txt', 'new content');

      expect(result).toBe(true); // Change occurred
      expect(mkdirSync).toHaveBeenCalledWith('/path/to', { recursive: true }); // dirname('/path/to/file.txt') = '/path/to'
      expect(writeFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'new content', 'utf8');
    });

    it('should not write file if content has not changed', () => {
      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue('same content');

      const result = writeTextIfChanged('/path/to/file.txt', 'same content');

      expect(result).toBe(false); // No change
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it('should return true but not write in dryRun mode', () => {
      (existsSync as any).mockReturnValue(false);
      (writeFileSync as any).mockImplementation();

      const result = writeTextIfChanged('/path/to/file.txt', 'new content', { dryRun: true });

      expect(result).toBe(true);
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('readJSONIfExists', () => {
    it('should return null if file does not exist', () => {
      (existsSync as any).mockReturnValue(false);

      const result = readJSONIfExists<any>('/nonexistent/file.json');

      expect(result).toBeNull();
    });

    it('should return parsed JSON if file exists and is valid', () => {
      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue('{"key": "value"}');

      const result = readJSONIfExists<{key: string}>('/existing/file.json');

      expect(result).toEqual({ key: 'value' });
    });

    it('should return null if file exists but contains invalid JSON', () => {
      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = readJSONIfExists<any>('/invalid/json/file.json');

      expect(result).toBeNull();
    });
  });
});