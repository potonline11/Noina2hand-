/**
 * Robust Safe Storage wrapper with transparent in-memory backup fallback.
 * Prevents "SecurityError: Access is denied for this document" in sandboxed environments and restricted iframes.
 */

class SafeStorage implements Storage {
  private inMemoryData: Record<string, string> = {};
  private actualStorage: Storage | null = null;

  constructor(type: 'localStorage' | 'sessionStorage') {
    try {
      // Query the dynamic window property with a try/catch guard
      const storage = window[type];
      // Perform a minimal write-and-read test to confirm the storage is permitted and fully writable
      const testKey = '__storage_test_key__';
      storage.setItem(testKey, testKey);
      const retrieved = storage.getItem(testKey);
      storage.removeItem(testKey);
      
      if (retrieved === testKey) {
        this.actualStorage = storage;
      }
    } catch {
      this.actualStorage = null;
      console.warn(`[SafeStorage] ${type} is not available/permitted. Falling back to in-memory mode.`);
    }
  }

  get length(): number {
    if (this.actualStorage) {
      try {
        return this.actualStorage.length;
      } catch {
        // Fallback
      }
    }
    return Object.keys(this.inMemoryData).length;
  }

  clear(): void {
    if (this.actualStorage) {
      try {
        this.actualStorage.clear();
        return;
      } catch {
        // Fallback
      }
    }
    this.inMemoryData = {};
  }

  getItem(key: string): string | null {
    if (this.actualStorage) {
      try {
        return this.actualStorage.getItem(key);
      } catch {
        // Fallback
      }
    }
    return Object.prototype.hasOwnProperty.call(this.inMemoryData, key) 
      ? this.inMemoryData[key] 
      : null;
  }

  key(index: number): string | null {
    if (this.actualStorage) {
      try {
        return this.actualStorage.key(index);
      } catch {
        // Fallback
      }
    }
    const keys = Object.keys(this.inMemoryData);
    return index >= 0 && index < keys.length ? keys[index] : null;
  }

  removeItem(key: string): void {
    if (this.actualStorage) {
      try {
        this.actualStorage.removeItem(key);
        return;
      } catch {
        // Fallback
      }
    }
    delete this.inMemoryData[key];
  }

  setItem(key: string, value: string): void {
    if (this.actualStorage) {
      try {
        this.actualStorage.setItem(key, value);
        return;
      } catch {
        // Fallback
      }
    }
    this.inMemoryData[key] = String(value);
  }
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');
