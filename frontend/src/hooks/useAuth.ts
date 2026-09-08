import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { getCurrentUser } from '../services/authService'
import type { AppUser } from '../types/auth.types'

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getCurrentUser().then(setUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
