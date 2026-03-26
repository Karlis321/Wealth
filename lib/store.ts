'use client';

import { v4 as uuidv4 } from 'uuid';
import type { AppStore, PublicAsset, PrivateObligation, MintosAccount } from './types';
import { encryptString, decryptString } from './crypto';
import { supabase } from './supabase';

// localStorage key used as offline cache
const CACHE_KEY_BASE = 'wcc_cache_v1';

function cacheKey(profileName: string): string {
  return `${CACHE_KEY_BASE}_${profileName}`;
}

export const DEFAULT_STORE: AppStore = {
  publicAssets: [],
  privateObligations: [],
  mintosAccounts: [],
  baseCurrency: 'EUR',
  tags: ['#LongTerm', '#ShortTerm', '#Risky', '#Stable', '#Growth', '#Income'],
  lastUpdated: null,
};

// ─── Load ──────────────────────────────────────────────────────────────────────

/**
 * Load store for a profile.
 * Tries Supabase first; falls back to localStorage cache if offline.
 */
export async function loadEncryptedStore(
  profileName: string,
  key: CryptoKey
): Promise<AppStore> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('store_data')
      .eq('name', profileName)
      .maybeSingle();

    if (!error && data?.store_data) {
      const decrypted = await decryptString(key, data.store_data);
      const parsed = { ...DEFAULT_STORE, ...JSON.parse(decrypted) };
      // Update local cache
      localStorage.setItem(cacheKey(profileName), data.store_data);
      return parsed;
    }
  } catch {
    // fall through to cache
  }

  // 2. Fall back to local cache (offline mode)
  try {
    const cached = localStorage.getItem(cacheKey(profileName));
    if (cached) {
      const decrypted = await decryptString(key, cached);
      return { ...DEFAULT_STORE, ...JSON.parse(decrypted) };
    }
  } catch {
    // corrupted cache — start fresh
  }

  return { ...DEFAULT_STORE };
}

// ─── Save ──────────────────────────────────────────────────────────────────────

/**
 * Encrypt and persist the store.
 * Writes to Supabase + updates local cache simultaneously.
 */
export async function saveEncryptedStore(
  store: AppStore,
  profileName: string,
  key: CryptoKey
): Promise<void> {
  const json = JSON.stringify({ ...store, lastUpdated: new Date().toISOString() });
  const encrypted = await encryptString(key, json);

  // Always update local cache immediately (instant, works offline)
  localStorage.setItem(cacheKey(profileName), encrypted);

  // Push to Supabase in the background (best-effort)
  supabase
    .from('profiles')
    .update({ store_data: encrypted, updated_at: new Date().toISOString() })
    .eq('name', profileName)
    .then(({ error }) => {
      if (error) console.warn('Supabase sync failed — data saved locally only:', error.message);
    });
}

// ─── Public Assets CRUD ────────────────────────────────────────────────────────

export function addPublicAsset(
  store: AppStore,
  data: Omit<PublicAsset, 'id' | 'addedAt'>
): AppStore {
  const asset: PublicAsset = {
    ...data,
    id: uuidv4(),
    addedAt: new Date().toISOString(),
  };
  return { ...store, publicAssets: [...store.publicAssets, asset] };
}

export function updatePublicAsset(
  store: AppStore,
  id: string,
  data: Partial<Omit<PublicAsset, 'id' | 'addedAt'>>
): AppStore {
  return {
    ...store,
    publicAssets: store.publicAssets.map((a) =>
      a.id === id ? { ...a, ...data } : a
    ),
  };
}

export function deletePublicAsset(store: AppStore, id: string): AppStore {
  return {
    ...store,
    publicAssets: store.publicAssets.filter((a) => a.id !== id),
  };
}

// ─── Private Obligations CRUD ──────────────────────────────────────────────────

export function addPrivateObligation(
  store: AppStore,
  data: Omit<PrivateObligation, 'id' | 'addedAt'>
): AppStore {
  const ob: PrivateObligation = {
    ...data,
    id: uuidv4(),
    addedAt: new Date().toISOString(),
  };
  return { ...store, privateObligations: [...store.privateObligations, ob] };
}

export function updatePrivateObligation(
  store: AppStore,
  id: string,
  data: Partial<Omit<PrivateObligation, 'id' | 'addedAt'>>
): AppStore {
  return {
    ...store,
    privateObligations: store.privateObligations.map((o) =>
      o.id === id ? { ...o, ...data } : o
    ),
  };
}

export function deletePrivateObligation(store: AppStore, id: string): AppStore {
  return {
    ...store,
    privateObligations: store.privateObligations.filter((o) => o.id !== id),
  };
}

// ─── Mintos Accounts CRUD ──────────────────────────────────────────────────────

export function addMintosAccount(
  store: AppStore,
  data: Omit<MintosAccount, 'id' | 'addedAt'>
): AppStore {
  const account: MintosAccount = {
    ...data,
    id: uuidv4(),
    addedAt: new Date().toISOString(),
  };
  return { ...store, mintosAccounts: [...(store.mintosAccounts ?? []), account] };
}

export function updateMintosAccount(
  store: AppStore,
  id: string,
  data: Partial<Omit<MintosAccount, 'id' | 'addedAt'>>
): AppStore {
  return {
    ...store,
    mintosAccounts: (store.mintosAccounts ?? []).map((a) =>
      a.id === id ? { ...a, ...data } : a
    ),
  };
}

export function deleteMintosAccount(store: AppStore, id: string): AppStore {
  return {
    ...store,
    mintosAccounts: (store.mintosAccounts ?? []).filter((a) => a.id !== id),
  };
}

// ─── Tags ──────────────────────────────────────────────────────────────────────

export function addTag(store: AppStore, tag: string): AppStore {
  if (store.tags.includes(tag)) return store;
  return { ...store, tags: [...store.tags, tag] };
}
