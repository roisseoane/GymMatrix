import LZString from 'lz-string';
import type { AppState } from '../types/models';
import { INITIAL_STATE } from '../data/constants';

const STORAGE_KEY = 'workout_app_v1';

export class DataService {
  /**
   * Loads the application state from localStorage.
   * Decompresses the data using LZ-String.
   */
  static load(): AppState | null {
    try {
      const compressed = localStorage.getItem(STORAGE_KEY);
      if (!compressed) return null;

      const decompressed = LZString.decompressFromUTF16(compressed);
      if (!decompressed) {
        console.error('DataService: Failed to decompress data.');
        return null;
      }

      const parsed = JSON.parse(decompressed);

      // Migration Guard: Validate Schema
      if (!this.validateSchema(parsed)) {
          console.error('DataService: Invalid schema detected. Resetting to safe state.');
          return null;
      }

      // Migration Guard: Sanitize Data (Fill missing fields)
      return this.sanitizeData(parsed);

    } catch (error) {
      console.error('DataService: Error loading data', error);
      return null;
    }
  }

  /**
   * Validates that the loaded object has the minimum required structure.
   */
  private static validateSchema(data: unknown): boolean {
      if (!data || typeof data !== 'object') return false;
      // Critical fields must exist
      return 'exercises' in data && 'logs' in data;
  }

  /**
   * Ensures the loaded data has all properties expected by the current AppState version.
   * Fills missing properties with defaults from INITIAL_STATE.
   */
  private static sanitizeData(data: unknown): AppState {
      // Create a new object starting with defaults, then overwrite with loaded data
      // This ensures any new top-level properties added to AppState in the future
      // will be present (from INITIAL_STATE) even if missing in old storage.
      return {
          ...INITIAL_STATE,
          ...data,
          // Deep merge or specific sanitization could happen here if needed,
          // but top-level spread covers the "new property added" case.
      };
  }

  /**
   * Saves the application state to localStorage.
   * Compresses the data using LZ-String to maximize space.
   * Throws an error if storage quota is exceeded.
   */
  static save(data: AppState): void {
    try {
      const json = JSON.stringify(data);
      const compressed = LZString.compressToUTF16(json);
      localStorage.setItem(STORAGE_KEY, compressed);
    } catch (error) {
      if (this.isQuotaExceededError(error)) {
        throw new Error('QuotaExceededError: LocalStorage is full.');
      }
      console.error('DataService: Error saving data', error);
      throw error;
    }
  }

  /**
   * Clear all data.
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Helper to identify QuotaExceededError across browsers.
   */
  private static isQuotaExceededError(e: unknown): boolean {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      localStorage.length !== 0
    );
  }
}
