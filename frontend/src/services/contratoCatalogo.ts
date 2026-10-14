import { supabase } from './supabaseClient'
import type { ContratoCatalogo, ContratoGestor } from '../types/processoContrato.types'

export async function fetchContratoCatalogo(entidades?: string[]): Promise<ContratoCatalogo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('contrato_catalogo')
    .select('id, id_controle_catalogo, id_controle_contrato, entidade, nome, data_inicio, data_termino, status, valor_estimado, valor_consumido, percentual_consumido, empresa_id')
  if (entidades?.length) query = query.in('entidade', entidades)
  const { data, error } = await query
  if (error) throw error
  return data as ContratoCatalogo[]
}

/**
 * Fetches contrato_gestor rows for the given id_controle_contrato list.
 * Returns a Map<id_controle_contrato, nome> keeping only the first gestor per contract.
 */
export async function fetchGestoresByContratoIds(
  ids: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  if (!ids.length) return map
  const BATCH = 500
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('contrato_gestor')
      .select('id_controle_contrato, nome')
      .in('id_controle_contrato', batch)
    if (error) throw error
    for (const row of (data as Pick<ContratoGestor, 'id_controle_contrato' | 'nome'>[]) ) {
      if (row.id_controle_contrato && row.nome && !map.has(row.id_controle_contrato)) {
        map.set(row.id_controle_contrato, row.nome)
      }
    }
  }
  return map
}
