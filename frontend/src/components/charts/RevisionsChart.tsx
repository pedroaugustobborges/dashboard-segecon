// Shows how many processes had 0, 1, 2, 3+ revisions in Fase 1 / Análise Contrato.
// Derived from fase1_analise_contrato records grouped by id_controle_sc.

import { useMemo } from 'react'
import { Box, Typography, Skeleton, Chip, Tooltip } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from 'recharts'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import type { Fase1AnaliseContrato } from '../../types/processoContrato.types'
import { strings } from '../../i18n/strings.pt-BR'

interface Props {
  fase1Records: Fase1AnaliseContrato[]
  loading?: boolean
  height?: number
}

export function RevisionsChart({ fase1Records, loading, height = 220 }: Props) {
  const { chartData, avgRevisions } = useMemo(() => {
    // Count distinct nro_revisao values per id_controle_sc (= revision count per process)
    const revPerProcess = new Map<number, Set<number>>()
    for (const rec of fase1Records) {
      if (rec.id_controle_sc === null) continue
      if (!revPerProcess.has(rec.id_controle_sc)) revPerProcess.set(rec.id_controle_sc, new Set())
      revPerProcess.get(rec.id_controle_sc)!.add(rec.nro_revisao ?? 0)
    }

    const countBucket: Record<string, number> = {}
    let total = 0
    for (const revSet of revPerProcess.values()) {
      const revCount = revSet.size
      const key = revCount >= 4 ? '4+' : String(revCount)
      countBucket[key] = (countBucket[key] ?? 0) + 1
      total += revCount
    }

    const avg = revPerProcess.size > 0 ? Math.round((total / revPerProcess.size) * 10) / 10 : 0

    const order = ['0', '1', '2', '3', '4+']
    const chartData = order
      .filter((k) => countBucket[k] !== undefined)
      .map((k) => ({ name: `${k} rev.`, value: countBucket[k] ?? 0 }))

    return { chartData, avgRevisions: avg }
  }, [fase1Records])

  if (loading) return <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>{strings.faseIndicators.revisoes}</Typography>
        <Chip label={`${strings.faseIndicators.media}: ${avgRevisions}`} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
        <Tooltip title={strings.faseIndicators.revisoesTip} arrow>
          <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
        </Tooltip>
      </Box>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <RTooltip
            formatter={(v) => [v, strings.faseIndicators.processos]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={i === 0 ? '#00897b' : i === 1 ? '#0288d1' : i === 2 ? '#f57c00' : '#c62828'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
