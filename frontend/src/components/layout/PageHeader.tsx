// PageHeader — Phase 2 will implement the full page header with breadcrumbs
import { Box, Typography } from '@mui/material'

interface Props {
  title: string
}

export function PageHeader({ title }: Props) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5">{title}</Typography>
    </Box>
  )
}
