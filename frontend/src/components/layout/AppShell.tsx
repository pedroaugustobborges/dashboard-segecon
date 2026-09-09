// App shell — fixed sidebar + sticky topbar + scrollable main content.
// Sidebar is position:fixed at left:0 so it is always flush with the viewport edge.
// Main content is offset with ml: SIDEBAR_WIDTH.

import { Outlet, useLocation, useNavigate, NavLink } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, Typography, List,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Chip,
  Divider, IconButton, Tooltip, useTheme, alpha,
} from '@mui/material'
import DashboardIcon      from '@mui/icons-material/Dashboard'
import TableChartIcon     from '@mui/icons-material/TableChart'
import AssignmentIcon     from '@mui/icons-material/Assignment'
import GavelIcon          from '@mui/icons-material/Gavel'
import SwapHorizIcon      from '@mui/icons-material/SwapHoriz'
import PeopleIcon         from '@mui/icons-material/People'
import LogoutIcon         from '@mui/icons-material/Logout'
import LightModeIcon      from '@mui/icons-material/LightMode'
import DarkModeIcon       from '@mui/icons-material/DarkMode'
import EditNoteIcon       from '@mui/icons-material/EditNote'
import HowToVoteIcon      from '@mui/icons-material/HowToVote'
import RequestQuoteIcon   from '@mui/icons-material/RequestQuote'
import StorefrontIcon     from '@mui/icons-material/Storefront'
import AnalyticsIcon      from '@mui/icons-material/Analytics'
import VerifiedIcon       from '@mui/icons-material/Verified'
import DrawIcon           from '@mui/icons-material/Draw'
import AttachFileIcon     from '@mui/icons-material/AttachFile'
import PublishIcon        from '@mui/icons-material/Publish'
import { useAuthContext } from '../../features/auth/AuthContext'
import { useColorMode }   from '../../theme/ThemeContext'
import { signOut }        from '../../services/authService'
import { strings }        from '../../i18n/strings.pt-BR'

export const SIDEBAR_WIDTH  = 280
export const TOPBAR_HEIGHT  = 64

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
      { label: strings.nav.overview,  path: '/visao-geral', icon: <DashboardIcon fontSize="small" /> },
      { label: strings.nav.processos, path: '/processos',   icon: <TableChartIcon fontSize="small" /> },
    ],
  },
  {
    heading: 'Fases do Processo',
    items: [
      { label: strings.nav.fase1AnaliseContrato,      path: '/fase1-analise-contrato',      icon: <EditNoteIcon fontSize="small" /> },
      { label: strings.nav.fase1AprovacaoSolicitacao, path: '/fase1-aprovacao-solicitacao', icon: <HowToVoteIcon fontSize="small" /> },
      { label: strings.nav.fase2,                     path: '/fase2',                       icon: <RequestQuoteIcon fontSize="small" /> },
      { label: strings.nav.fase3,                     path: '/fase3',                       icon: <StorefrontIcon fontSize="small" /> },
      { label: strings.nav.fase4,                     path: '/fase4',                       icon: <AnalyticsIcon fontSize="small" /> },
      { label: strings.nav.fase5,                     path: '/fase5',                       icon: <VerifiedIcon fontSize="small" /> },
      { label: strings.nav.fase6,                     path: '/fase6',                       icon: <DrawIcon fontSize="small" /> },
      { label: strings.nav.fase7,                     path: '/fase7',                       icon: <AttachFileIcon fontSize="small" /> },
      { label: strings.nav.fase8,                     path: '/fase8',                       icon: <PublishIcon fontSize="small" /> },
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
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

// Section heading with flanking lines ── HEADING ──
function SectionLabel({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1.5, pb: 0.5 }}>
      <Box sx={{ height: '1px', width: 10, bgcolor: 'divider', flexShrink: 0 }} />
      <Typography
        sx={{
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }} />
    </Box>
  )
}

export function AppShell() {
  const theme    = useTheme()
  const { mode, toggleColorMode } = useColorMode()
  const isDark   = mode === 'dark'
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const primary  = theme.palette.primary.main

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebar = (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: SIDEBAR_WIDTH,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#111318' : '#ffffff',
        borderRight: `1px solid ${isDark
          ? alpha('#ffffff', 0.07)
          : alpha('#000000', 0.07)}`,
        // Subtle right-edge glow in dark mode
        boxShadow: isDark
          ? `1px 0 0 ${alpha(primary, 0.08)}, 4px 0 24px ${alpha('#000', 0.45)}`
          : `1px 0 12px ${alpha('#000', 0.05)}`,
        zIndex: theme.zIndex.drawer,
        overflow: 'hidden',
      }}
    >
      {/* ── Logo / Brand ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 2,
          borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.07)}`,
          // Subtle teal gradient wash behind the brand
          background: isDark
            ? `linear-gradient(135deg, ${alpha(primary, 0.14)} 0%, transparent 70%)`
            : `linear-gradient(135deg, ${alpha(primary, 0.07)} 0%, transparent 70%)`,
        }}
      >
        {/* Glowing dot + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              flexShrink: 0,
              background: `linear-gradient(135deg, ${primary}, ${theme.palette.primary.dark})`,
              boxShadow: `0 0 8px ${alpha(primary, isDark ? 0.8 : 0.5)}`,
            }}
          />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${primary} 0%, ${isDark ? '#4db6ac' : theme.palette.primary.dark} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {strings.app.name}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', lineHeight: 1.4, pl: '17px', display: 'block', fontSize: '0.68rem' }}
        >
          {strings.app.subtitle}
        </Typography>
      </Box>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, px: 0 }}>
        {navGroups.map((group, gi) => {
          if (group.adminOnly && user?.role !== 'Admin') return null
          return (
            <Box key={gi} sx={{ mb: 0.5 }}>
              {group.heading && <SectionLabel label={group.heading} />}
              <List dense disablePadding>
                {group.items.map((item) => {
                  if (item.adminOnly && user?.role !== 'Admin') return null
                  const active = isActive(item.path)
                  return (
                    <Box key={item.path} sx={{ px: 1.5, mb: 0.25 }}>
                      <ListItemButton
                        component={NavLink}
                        to={item.path}
                        sx={{
                          borderRadius: '12px',
                          px: 1.5,
                          py: 0.9,
                          alignItems: 'flex-start',
                          bgcolor: active
                            ? (isDark ? alpha(primary, 0.16) : alpha(primary, 0.09))
                            : 'transparent',
                          boxShadow: active
                            ? `inset 0 0 0 1px ${alpha(primary, isDark ? 0.30 : 0.20)}`
                            : 'none',
                          '&:hover': {
                            bgcolor: active
                              ? (isDark ? alpha(primary, 0.21) : alpha(primary, 0.13))
                              : (isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04)),
                          },
                          transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 32,
                            mt: '1px',
                            color: active ? primary : 'text.secondary',
                            transition: 'color 0.15s',
                            '& svg': {
                              filter: active && isDark
                                ? `drop-shadow(0 0 4px ${alpha(primary, 0.6)})`
                                : 'none',
                              transition: 'filter 0.15s',
                            },
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: '0.8125rem',
                              fontWeight: active ? 700 : 400,
                              color: active ? primary : 'text.primary',
                              lineHeight: 1.35,
                              transition: 'color 0.15s',
                            },
                          }}
                        />
                        {item.comingSoon && (
                          <Chip
                            label="Em breve"
                            size="small"
                            sx={{
                              fontSize: '0.58rem',
                              height: 18,
                              ml: 0.5,
                              mt: '2px',
                              flexShrink: 0,
                              opacity: 0.65,
                              bgcolor: isDark ? alpha('#ffffff', 0.08) : alpha('#000', 0.06),
                              color: 'text.secondary',
                              border: `1px solid ${alpha('#ffffff', 0.1)}`,
                            }}
                          />
                        )}
                      </ListItemButton>
                    </Box>
                  )
                })}
              </List>
            </Box>
          )
        })}
      </Box>

      {/* ── Footer: dark mode toggle + user card ─────────────────────────── */}
      <Box
        sx={{
          borderTop: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.07)}`,
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Dark mode toggle row */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'} placement="right">
            <Box
              onClick={toggleColorMode}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.25,
                py: 0.6,
                borderRadius: '20px',
                border: `1px solid ${isDark ? alpha('#ffffff', 0.12) : alpha('#000', 0.10)}`,
                cursor: 'pointer',
                userSelect: 'none',
                bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.02),
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: `1px solid ${alpha(primary, 0.5)}`,
                  bgcolor: alpha(primary, 0.08),
                  '& .toggle-icon': { color: primary },
                },
              }}
            >
              {isDark
                ? <LightModeIcon className="toggle-icon" sx={{ fontSize: 13, color: 'text.secondary', transition: 'color 0.2s' }} />
                : <DarkModeIcon  className="toggle-icon" sx={{ fontSize: 13, color: 'text.secondary', transition: 'color 0.2s' }} />}
              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1 }}>
                {isDark ? 'Claro' : 'Escuro'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* User card */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 1,
            py: 0.75,
            borderRadius: '12px',
            border: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.06)}`,
            bgcolor: isDark ? alpha('#ffffff', 0.03) : alpha('#000', 0.02),
          }}
        >
          <Avatar
            src={user?.photo_url ?? undefined}
            sx={{
              width: 34,
              height: 34,
              bgcolor: primary,
              fontSize: '0.8rem',
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${alpha(primary, isDark ? 0.4 : 0.25)}`,
            }}
          >
            {user ? getInitials(user.nome) : '?'}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}
              noWrap
            >
              {user?.nome ?? ''}
            </Typography>
            <Chip
              label={user?.role ?? ''}
              size="small"
              color={user?.role === 'Admin' ? 'primary' : 'default'}
              sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, mt: 0.25 }}
            />
          </Box>
          <Tooltip title={strings.auth.logout} placement="right">
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{
                color: 'text.disabled',
                flexShrink: 0,
                '&:hover': { color: 'error.main', bgcolor: alpha('#f44336', 0.08) },
                transition: 'color 0.15s, background-color 0.15s',
              }}
            >
              <LogoutIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )

  // ── Shell layout ───────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Fixed sidebar — always flush to left edge */}
      {sidebar}

      {/* Main area — offset by sidebar width */}
      <Box
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: isDark ? alpha('#161b22', 0.92) : alpha('#ffffff', 0.92),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? alpha('#ffffff', 0.07) : alpha('#000', 0.07)}`,
            boxShadow: isDark
              ? `0 1px 0 ${alpha('#ffffff', 0.05)}, 0 4px 20px ${alpha('#000', 0.35)}`
              : `0 1px 0 ${alpha('#000', 0.05)}, 0 4px 12px ${alpha('#000', 0.04)}`,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ height: TOPBAR_HEIGHT, position: 'relative', px: { xs: 2, sm: 3 } }}>
            {/* Left: AGIR logo */}
            <Box
              component="img"
              src="/agir_logo.png"
              alt="AGIR"
              sx={{
                height: 34,
                objectFit: 'contain',
                opacity: isDark ? 0.85 : 1,
                filter: isDark ? 'brightness(1.1)' : 'none',
              }}
            />

            {/* Center: DaherLab logo — absolutely centered */}
            <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <Box
                component="img"
                src="/logo_daherlab.png"
                alt="DaherLab"
                sx={{
                  height: 38,
                  objectFit: 'contain',
                  display: 'block',
                  opacity: isDark ? 0.85 : 1,
                  filter: isDark ? 'brightness(1.15)' : 'none',
                }}
              />
            </Box>

            {/* Right: Transformação Digital logo + user */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src="/logo_transformacao_digital.png"
                alt="Transformação Digital"
                sx={{
                  height: 34,
                  objectFit: 'contain',
                  opacity: isDark ? 0.85 : 1,
                  filter: isDark ? 'brightness(1.1)' : 'none',
                }}
              />
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={user?.photo_url ?? undefined}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: primary,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    boxShadow: `0 0 0 2px ${alpha(primary, 0.3)}`,
                  }}
                >
                  {user ? getInitials(user.nome) : '?'}
                </Avatar>
                <Typography variant="body2" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: 140 }}>
                  {user?.nome ?? ''}
                </Typography>
                <Tooltip title={strings.auth.logout}>
                  <IconButton
                    size="small"
                    onClick={handleLogout}
                    sx={{
                      color: 'text.disabled',
                      '&:hover': { color: 'error.main', bgcolor: alpha('#f44336', 0.08) },
                      transition: 'color 0.15s, background-color 0.15s',
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
