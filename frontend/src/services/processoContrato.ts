// Business logic and Supabase queries for processo_contrato.
// Components must NOT query Supabase directly — always go through this service.

import { supabase } from './supabaseClient'
import type { ProcessoContrato, Fase1AnaliseContrato } from '../types/processoContrato.types'

export interface ProcessoContratoFilters {
  entidades?: string[]
  solicitacao_tipo?: string[]
  dataInicio?: string
  dataFim?: string
  incluirCancelados?: boolean
  departamentos?: string[]
}

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: ProcessoContratoFilters,
) {
  if (filters.entidades?.length) {
    query = query.in('entidade', filters.entidades)
  }
  if (filters.solicitacao_tipo?.length) {
    query = query.in('solicitacao_tipo', filters.solicitacao_tipo)
  }
  if (filters.dataInicio) {
    query = query.gte('solicitacao_data_importacao', filters.dataInicio)
  }
  if (filters.dataFim) {
    query = query.lte('solicitacao_data_importacao', filters.dataFim)
  }
  if (!filters.incluirCancelados) {
    query = query.eq('solicitacao_cancelada', false)
  }
  if (filters.departamentos?.length) {
    query = query.in('solicitacao_departamento', filters.departamentos)
  }
  return query
}

export async function fetchProcessos(
  filters: ProcessoContratoFilters = {},
): Promise<ProcessoContrato[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('processo_contrato').select('*')
  query = applyFilters(query, filters)
  const { data, error } = await query
  if (error) throw error

  // Deduplicate by id_controle_sc (the source-system business key).
  // The ETL can insert multiple rows for the same process; we keep only the first.
  const seen = new Set<number>()
  return (data as ProcessoContrato[]).filter((p) => {
    if (p.id_controle_sc === null) return true
    if (seen.has(p.id_controle_sc)) return false
    seen.add(p.id_controle_sc)
    return true
  })
}

export async function fetchDistinctEntidades(): Promise<string[]> {
  const { data, error } = await supabase
    .from('processo_contrato')
    .select('entidade')
  if (error) throw error
  const unique = [...new Set((data ?? []).map((r: { entidade: string | null }) => r.entidade).filter(Boolean))]
  return (unique as string[]).sort()
}

// Distinct analyst names from the reserva table — used to pre-populate
// the "Nome" field when creating new users in Gestão de Usuários.
export async function fetchDistinctNomesFase1(): Promise<string[]> {
  const { data, error } = await supabase
    .from('fase1_analise_contrato_reserva')
    .select('nome')
  if (error) throw error
  const unique = [
    ...new Set(
      (data ?? [])
        .map((r: { nome: string | null }) => r.nome)
        .filter((n): n is string => !!n && n.trim().length > 0),
    ),
  ]
  return (unique as string[]).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export interface ReservaRecord {
  id: number
  id_controle_sc: number | null
  nome: string | null
}

export async function fetchFase1AnaliseReservaByScIds(
  idControleScList: number[],
): Promise<ReservaRecord[]> {
  const BATCH = 500
  const results: ReservaRecord[] = []
  for (let i = 0; i < idControleScList.length; i += BATCH) {
    const batch = idControleScList.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('fase1_analise_contrato_reserva')
      .select('id, id_controle_sc, nome')
      .in('id_controle_sc', batch)
    if (error) throw error
    results.push(...(data as ReservaRecord[]))
  }
  // Deduplicate by (id_controle_sc, nome)
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = `${r.id_controle_sc ?? ''}|||${r.nome ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchFase1AnaliseByScIds(
  idControleScList: number[],
): Promise<Fase1AnaliseContrato[]> {
  const BATCH = 500
  const results: Fase1AnaliseContrato[] = []
  for (let i = 0; i < idControleScList.length; i += BATCH) {
    const batch = idControleScList.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from('fase1_analise_contrato')
      .select('*')
      .in('id_controle_sc', batch)
    if (error) throw error
    results.push(...(data as Fase1AnaliseContrato[]))
  }

  // Deduplicate by (id_controle_sc, nome) — one record per (process, responsável) pair.
  const seen = new Set<string>()
  return results.filter((r) => {
    const key = `${r.id_controle_sc ?? ''}|||${r.nome ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
