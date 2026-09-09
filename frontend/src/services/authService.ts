// Auth operations: login, logout, session, user management (admin only).
// Uses Supabase Auth + profiles table.

import { supabase } from './supabaseClient'
import type { AppUser, UserRole } from '../types/auth.types'

// ── Helpers ─────────────────────────────────────────────────────────────────

// Resolves a stored photo value to a displayable URL.
// The DB stores the storage PATH (e.g. "uuid/avatar.jpg") — not a full URL.
// Legacy rows that already contain a full URL pass through unchanged.
// Signed URLs expire after 7 days — sufficient for an internal app.
async function resolvePhotoUrl(photoValue: string | null): Promise<string | null> {
  if (!photoValue) return null
  // Already a full URL (legacy entry) — use as-is
  if (photoValue.startsWith('http')) return photoValue
  const { data } = await supabase.storage
    .from('user-photos')
    .createSignedUrl(photoValue, 7 * 24 * 3600)   // 7-day signed URL
  return data?.signedUrl ?? null
}

// ── Session & profile ────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('nome, role, entidades, photo_url')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null

  return {
    id: user.id,
    email: user.email ?? '',
    nome: profile.nome,
    role: profile.role as UserRole,
    entidades: profile.entidades ?? [],
    photo_url: await resolvePhotoUrl(profile.photo_url),
  }
}

// ── Login / Logout ───────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── User management (Admin only) ─────────────────────────────────────────────

export interface CreateUserPayload {
  email: string
  password: string
  nome: string
  role: UserRole
  entidades: string[]
}

export async function createUser(payload: CreateUserPayload) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: {
      email: payload.email,
      password: payload.password,
      nome: payload.nome,
      role: payload.role,
      entidades: payload.entidades,
    },
  })
  if (error) {
    // The edge function returns { error: "..." } JSON with a non-2xx status.
    // Supabase JS wraps this as a generic FunctionsHttpError — extract the real message.
    try {
      const body = await (error as any).context?.json?.()
      if (body?.error) throw new Error(body.error)
    } catch (inner) {
      if (inner instanceof Error && inner.message !== error.message) throw inner
    }
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<AppUser, 'nome' | 'role' | 'entidades' | 'photo_url'>>,
) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, atualizado_em: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function resetUserPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

// Uploads the file and returns the storage PATH (not the full URL).
// The path is stored in profiles.photo_url; resolved to a signed URL on read.
export async function uploadUserPhoto(userId: string, file: File): Promise<string> {
  const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('user-photos')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path   // store path, not URL — resolvePhotoUrl handles the rest
}

export async function listAllUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role, entidades, photo_url')
    .order('nome')
  if (error) throw error

  // Resolve each stored path to a signed URL in parallel
  const users = await Promise.all(
    (data ?? []).map(async (p: Record<string, unknown>) => ({
      id:        p.id        as string,
      email:     '',
      nome:      p.nome      as string,
      role:      p.role      as UserRole,
      entidades: (p.entidades as string[]) ?? [],
      photo_url: await resolvePhotoUrl((p.photo_url as string) ?? null),
    })),
  )

  return users
}
