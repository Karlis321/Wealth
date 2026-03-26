'use client';

import {
  generateSalt,
  bytesToBase64,
  base64ToBytes,
  deriveKey,
  encryptString,
  decryptString,
} from './crypto';
import { supabase } from './supabase';

const ACTIVE_PROFILE_KEY = 'wcc_active_profile';
const SENTINEL = 'wcc_auth_ok_v2';

export interface Profile {
  name: string;
  salt: string;
  sentinel: string;
}

export interface ProfilesState {
  profiles: Profile[];
  activeProfile: string | null;
}

// ─── Local active-profile tracking (no sensitive data) ────────────────────────

export function loadProfiles(): ProfilesState {
  if (typeof window === 'undefined') return { profiles: [], activeProfile: null };
  const activeProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);
  return { profiles: [], activeProfile };
}

export function saveProfiles(state: ProfilesState): void {
  if (typeof window === 'undefined') return;
  if (state.activeProfile) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, state.activeProfile);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export function setActiveProfile(name: string | null): void {
  if (typeof window === 'undefined') return;
  if (name) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, name);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

// ─── Supabase profile ops ──────────────────────────────────────────────────────

/** Check if a profile name exists in Supabase. */
export async function checkProfileExists(name: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('name', name.trim())
    .maybeSingle();
  return !!data;
}

/**
 * Create a new profile with a password.
 * Returns the derived CryptoKey on success.
 */
export async function createProfile(
  name: string,
  password: string
): Promise<{ state: ProfilesState; key: CryptoKey }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required.');

  // Check if name already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('name')
    .eq('name', trimmed)
    .maybeSingle();

  if (existing) throw new Error('A profile with that name already exists.');

  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const sentinel = await encryptString(key, SENTINEL);

  const { error } = await supabase.from('profiles').insert({
    name: trimmed,
    salt: bytesToBase64(salt),
    sentinel,
  });

  if (error) throw new Error('Failed to create profile. Check your connection.');

  setActiveProfile(trimmed);
  return {
    state: { profiles: [], activeProfile: trimmed },
    key,
  };
}

/**
 * Verify a password for an existing profile.
 * Returns the CryptoKey on success, null on wrong password or unknown profile.
 */
export async function verifyPassword(
  name: string,
  password: string
): Promise<CryptoKey | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('salt, sentinel')
    .eq('name', name)
    .maybeSingle();

  if (error || !profile) return null;

  try {
    const salt = base64ToBytes(profile.salt);
    const key = await deriveKey(password, salt);
    const decrypted = await decryptString(key, profile.sentinel);
    if (decrypted !== SENTINEL) return null;
    return key;
  } catch {
    return null;
  }
}

/** Delete a profile and its store data from Supabase. */
export async function deleteProfile(name: string): Promise<ProfilesState> {
  await supabase.from('profiles').delete().eq('name', name);

  const active = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (active === name) localStorage.removeItem(ACTIVE_PROFILE_KEY);

  return { profiles: [], activeProfile: null };
}
