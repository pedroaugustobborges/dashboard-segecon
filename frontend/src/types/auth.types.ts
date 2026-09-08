export type UserRole = 'Admin' | 'Analista'

export interface AppUser {
  id: string
  email: string
  nome: string
  role: UserRole
  entidades: string[]   // empty means all (Admin), list of entidade values for Analista
  photo_url: string | null
}
