// ── PEM → CryptoKey ──

function pemToBinary(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

// IndexedDB-based key storage (chỉ lưu CryptoKey, không lưu PEM)

const DB_NAME = 'agritrace-keystore';
const STORE_NAME = 'private-keys';

function openKeyStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storePrivateKey(
  keyId: string,
  cryptoKey: CryptoKey,
): Promise<void> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(cryptoKey, keyId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPrivateKey(
  keyId: string,
): Promise<CryptoKey | null> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(keyId);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePrivateKey(keyId: string): Promise<void> {
  const db = await openKeyStore();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(keyId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function hasStoredKey(keyId: string): Promise<boolean> {
  const key = await getPrivateKey(keyId);
  return key !== null;
}

// Sign data bằng CryptoKey, trả về signature dạng base64

export async function signData(
  privateKey: CryptoKey,
  data: string,
): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoded,
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Build canonical string để ký số

export function buildActivityLogCanonical(log: {
  id: string;
  batch_id: string;
  activity_type: string;
  performed_at: string;
}): string {
  return `SIGN:activity_log:${log.id}:${log.batch_id}:${log.activity_type}:${log.performed_at}`;
}

export function buildInspectionCanonical(ins: {
  id: string;
  batch_id: string;
  inspection_type: string;
  result: string;
  conducted_at: string;
}): string {
  return `SIGN:inspection:${ins.id}:${ins.batch_id}:${ins.inspection_type}:${ins.result}:${ins.conducted_at}`;
}

// Utility để download PEM file (dùng khi user tạo key mới và cần tải private key về)

export function downloadPemFile(pem: string, filename: string) {
  const blob = new Blob([pem], { type: 'application/x-pem-file' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Utility để đọc file PEM từ input[type="file"]

export function readPemFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
