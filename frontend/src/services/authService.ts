// Auth operations: login, logout, session, user management (admin only).
// Uses Supabase Auth + profiles table.

import { supabase } from './supabaseClient'
import type { AppUser, UserRole } from '../types/auth.types'

// ── Session & profile ───────────────────────────────────────

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
    photo_url: profile.photo_url,
  }
}

// ── Login / Logout ──────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── User management (Admin only) ────────────────────────────

export interface CreateUserPayload {
  email: string
  password: string
  nome: string
  role: UserRole
  entidades: string[]
}

export async function createUser(payload: CreateUserPayload) {
  // Create auth user via Supabase Admin API (service role key needed on backend)
  // For now, use the standard sign-up + profile insert approach
  const { data, error } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })
  if (error) throw error

  const userId = data.user.id
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    nome: payload.nome,
    role: payload.role,
    entidades: payload.entidades,
  })
  if (profileError) throw profileError

  return data.user
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

export async function uploadUserPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('user-photos').upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('user-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function listAllUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, role, entidades, photo_url')
    .order('nome')
  if (error) throw error

  // Get emails from auth.users — only accessible with service role;
  // for now return without emails (admin page can show nome + role)
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    email: '',
    nome: p.nome as string,
    role: p.role as UserRole,
    entidades: (p.entidades as string[]) ?? [],
    photo_url: (p.photo_url as string) ?? null,
  }))
}
