import { parseArgv } from './cli-utils.js';
import { describe, it, expect } from '@jest/globals';

describe('cli-utils', () => {
  describe('parseArgv', () => {
    it('should return an empty object when no arguments are provided', () => {
      const result = parseArgv(['node', 'script.js']);
      expect(result).toEqual({});
    });

    it('should parse long form arguments without values as booleans', () => {
      const result = parseArgv(['node', 'script.js', '--verbose']);
      expect(result).toEqual({ verbose: true });
    });

    it('should parse long form arguments with values', () => {
      const result = parseArgv(['node', 'script.js', '--port', '3000']);
      expect(result).toEqual({ port: '3000' });
    });

    it('should parse multiple long form arguments', () => {
      const result = parseArgv([
        'node',
        'script.js',
        '--host',
        'localhost',
        '--port',
        '3000',
        '--verbose'
      ]);
      expect(result).toEqual({ host: 'localhost', port: '3000', verbose: true });
    });

    it('should parse short form arguments as booleans', () => {
      const result = parseArgv(['node', 'script.js', '-v']);
      expect(result).toEqual({ v: true });
    });

    it('should handle mixed short and long form arguments', () => {
      const result = parseArgv([
        'node',
        'script.js',
        '-v',
        '--port',
        '3000',
        '-h'
      ]);
      expect(result).toEqual({ v: true, port: '3000', h: true });
    });

    it('should not consume arguments that start with -- as values for previous arguments', () => {
      const result = parseArgv([
        'node',
        'script.js',
        '--host',
        '--port',
        '3000'
      ]);
      expect(result).toEqual({ host: true, port: '3000' });
    });

    it('should handle arguments with no values in between', () => {
      const result = parseArgv([
        'node',
        'script.js',
        '--env',
        'production',
        '--debug',
        '--port',
        '8080'
      ]);
      expect(result).toEqual({ env: 'production', debug: true, port: '8080' });
    });

    it('should handle single dash arguments with letters', () => {
      const result = parseArgv(['node', 'script.js', '-x', '-y', '-z']);
      expect(result).toEqual({ x: true, y: true, z: true });
    });

    it('should correctly skip consumed value arguments', () => {
      const result = parseArgv([
        'node',
        'script.js',
        '--name',
        'my-app',
        '--version',
        '1.0.0',
        '--verbose'
      ]);
      expect(result).toEqual({ name: 'my-app', version: '1.0.0', verbose: true });
    });

    it('should handle arguments starting with single dashes as values', () => {
      const result = parseArgv(['node', 'script.js', '--flag', '-value']);
      expect(result).toEqual({ flag: '-value' });
    });

    it('should handle numeric arguments as values', () => {
      const result = parseArgv(['node', 'script.js', '--count', '123']);
      expect(result).toEqual({ count: '123' });
    });
  });
});