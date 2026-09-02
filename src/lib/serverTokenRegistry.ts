import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface NabtaToken {
  token: string;
  createdAt: string;
  isActive: boolean;
  name: string;
}

// File-backed persistent server token registry
const DATA_DIR = path.join(process.cwd(), '.data');
const TOKENS_FILE = path.join(DATA_DIR, 'nabta_tokens.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function generateCryptoSecureToken(): string {
  return 'nabta_' + crypto.randomBytes(24).toString('hex');
}

export function getServerTokens(): NabtaToken[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(TOKENS_FILE)) {
      const initialToken: NabtaToken = {
        token: generateCryptoSecureToken(),
        createdAt: new Date().toISOString(),
        isActive: true,
        name: 'Primary Nabta Shareable Link',
      };
      fs.writeFileSync(TOKENS_FILE, JSON.stringify([initialToken], null, 2));
      return [initialToken];
    }
    const content = fs.readFileSync(TOKENS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading server tokens:', err);
    return [];
  }
}

export function saveServerTokens(tokens: NabtaToken[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (err) {
    console.error('Error saving server tokens:', err);
  }
}

export function createNewServerToken(name: string = 'Nabta Live Link'): NabtaToken {
  const currentTokens = getServerTokens();
  // Deactivate all previous tokens to ensure only one active shareable link at a time
  const updatedTokens = currentTokens.map((t) => ({ ...t, isActive: false }));
  
  const newToken: NabtaToken = {
    token: generateCryptoSecureToken(),
    createdAt: new Date().toISOString(),
    isActive: true,
    name,
  };

  updatedTokens.unshift(newToken);
  saveServerTokens(updatedTokens);
  return newToken;
}

export function revokeServerToken(tokenStr: string): boolean {
  const currentTokens = getServerTokens();
  const updatedTokens = currentTokens.map((t) => 
    t.token === tokenStr ? { ...t, isActive: false } : t
  );
  saveServerTokens(updatedTokens);
  return true;
}

export function isServerTokenValid(tokenStr: string): boolean {
  if (!tokenStr) return false;
  const currentTokens = getServerTokens();
  const found = currentTokens.find((t) => t.token === tokenStr && t.isActive);
  return Boolean(found);
}
