import type { Edition } from "./edition.ts";

const EDITION_KEY = "owo-times-edition-v1";
const PHOTO_DB = "owo-times-photos-v1";
const PHOTO_STORE = "photos";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createEditionStorage(storage: KeyValueStorage | undefined = globalThis.localStorage) {
  return {
    loadEdition() {
      try {
        const value = storage?.getItem(EDITION_KEY);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    saveEdition(edition: Edition) {
      try {
        storage?.setItem(EDITION_KEY, JSON.stringify(edition));
        return true;
      } catch {
        return false;
      }
    },
  };
}

function openPhotoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("IndexedDB is not available"));
    const request = indexedDB.open(PHOTO_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function photoRequest<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openPhotoDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHOTO_STORE, mode);
    const request = operation(transaction.objectStore(PHOTO_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export const photoStorage = {
  save(key: string, blob: Blob) { return photoRequest("readwrite", (store) => store.put(blob, key)); },
  load(key: string) { return photoRequest<Blob | undefined>("readonly", (store) => store.get(key)); },
  remove(key: string) { return photoRequest<undefined>("readwrite", (store) => store.delete(key)); },
};
