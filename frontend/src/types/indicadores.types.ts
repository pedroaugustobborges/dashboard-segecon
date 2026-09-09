import type { FaseKey } from './processoContrato.types'

export interface KpiData {
  label: string
  value: number | string
  unit?: string
  delta?: number // % change vs previous period, optional
}

export interface DistributionItem {
  label: string
  value: number
  color?: string
  median?: number
}

export interface LeadTimeData {
  phase: FaseKey
  phaseName: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  inProgressCount: number // processes still in this phase
}
