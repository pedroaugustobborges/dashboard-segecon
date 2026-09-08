import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, Typography, List, ListSubheader,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Chip,
  Divider, IconButton, Tooltip, useTheme,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TableChartIcon from '@mui/icons-material/TableChart'
import AssignmentIcon from '@mui/icons-material/Assignment'
import GavelIcon from '@mui/icons-material/Gavel'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuthContext } from '../../features/auth/AuthContext'
import { signOut } from '../../services/authService'
import { strings } from '../../i18n/strings.pt-BR'

const SIDEBAR_WIDTH = 248
const TOPBAR_HEIGHT = 64

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  adminOnly?: boolean
  comingSoon?: boolean
}

const navGroups: Array<{ heading?: string; items: NavItem[]; adminOnly?: boolean }> = [
  {
    items: [
      { label: strings.nav.overview, path: '/visao-geral', icon: <DashboardIcon fontSize="small" /> },
      { label: strings.nav.processos, path: '/processos', icon: <TableChartIcon fontSize="small" /> },
    ],
  },
  {
    heading: 'Fases do Processo',
    items: [
      { label: strings.nav.fase1AnaliseContrato,      path: '/fase1-analise-contrato',      icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase1AprovacaoSolicitacao, path: '/fase1-aprovacao-solicitacao', icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase2,                     path: '/fase2',                       icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase3,                     path: '/fase3',                       icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase4,                     path: '/fase4',                       icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase5,                     path: '/fase5',                       icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase6,                     path: '/fase6',                       icon: <GavelIcon fontSize="small" /> },
      { label: strings.nav.fase7,                     path: '/fase7',                       icon: <AssignmentIcon fontSize="small" /> },
      { label: strings.nav.fase8,                     path: '/fase8',                       icon: <AssignmentIcon fontSize="small" /> },
    ],
  },
  {
    heading: 'Outros',
    items: [
      {
        label: strings.nav.alteracaoContratual,
        path: '/alteracoes-contratuais',
        icon: <SwapHorizIcon fontSize="small" />,
        comingSoon: true,
      },
    ],
  },
  {
    heading: 'Administração',
    adminOnly: true,
    items: [
      {
        label: strings.nav.gestaoUsuario,
        path: '/gestao-usuario',
        icon: <PeopleIcon fontSize="small" />,
        adminOnly: true,
      },
    ],
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function AppShell() {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthContext()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path

  const sidebar = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar header */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="subtitle1" fontWeight={700} color="primary.main" lineHeight={1.2}>
          {strings.app.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {strings.app.subtitle}
        </Typography>
      </Box>

      {/* Nav list */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {navGroups.map((group, gi) => {
          if (group.adminOnly && user?.role !== 'Admin') return null
          return (
            <List
              key={gi}
              dense
              disablePadding
              subheader={
                group.heading ? (
                  <ListSubheader
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'text.disabled',
                      lineHeight: '2rem',
                      px: 2.5,
                      bgcolor: 'transparent',
                    }}
                  >
                    {group.heading}
                  </ListSubheader>
                ) : null
              }
            >
              {group.items.map((item) => {
                if (item.adminOnly && user?.role !== 'Admin') return null
                const active = isActive(item.path)
                return (
                  <ListItemButton
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      mb: 0.25,
                      px: 1.5,
                      bgcolor: active ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: active ? 'primary.light' : 'action.hover' },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'primary.main' : 'text.primary',
                        noWrap: true,
                      }}
                    />
                    {item.comingSoon && (
                      <Chip
                        label="Em breve"
                        size="small"
                        sx={{ fontSize: '0.6rem', height: 18, ml: 0.5 }}
                      />
                    )}
                  </ListItemButton>
                )
              })}
            </List>
          )
        })}
      </Box>

      {/* User card at bottom */}
      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          src={user?.photo_url ?? undefined}
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem' }}
        >
          {user ? getInitials(user.nome) : '?'}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="caption" fontWeight={600} noWrap display="block">
            {user?.nome ?? ''}
          </Typography>
          <Chip
            label={user?.role ?? ''}
            size="small"
            color={user?.role === 'Admin' ? 'primary' : 'default'}
            sx={{ height: 16, fontSize: '0.6rem' }}
          />
        </Box>
        <Tooltip title={strings.auth.logout}>
          <IconButton size="small" onClick={handleLogout} color="default">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar — fixed left column */}
      <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}>
        {sidebar}
      </Box>

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Toolbar
            sx={{
              height: TOPBAR_HEIGHT,
              position: 'relative',
              px: { xs: 2, sm: 3 },
            }}
          >
            {/* Left logo */}
            <Box
              component="img"
              src="/agir_logo.png"
              alt="AGIR"
              sx={{ height: 36, objectFit: 'contain' }}
            />

            {/* Center logo — absolutely centered relative to toolbar */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <Box
                component="img"
                src="/logo_daherlab.png"
                alt="DaherLab"
                sx={{ height: 40, objectFit: 'contain', display: 'block' }}
              />
            </Box>

            {/* Right logo + user widget */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/logo_transformacao_digital.png"
                alt="Transformação Digital"
                sx={{ height: 36, objectFit: 'contain' }}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={user?.photo_url ?? undefined}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}
                >
                  {user ? getInitials(user.nome) : '?'}
                </Avatar>
                <Typography variant="body2" fontWeight={500} color="text.primary" noWrap sx={{ maxWidth: 140 }}>
                  {user?.nome ?? ''}
                </Typography>
                <Tooltip title={strings.auth.logout}>
                  <IconButton size="small" onClick={handleLogout}>
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 3 } }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
