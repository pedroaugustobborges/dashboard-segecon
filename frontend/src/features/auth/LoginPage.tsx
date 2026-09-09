import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { signIn } from '../../services/authService'
import { strings } from '../../i18n/strings.pt-BR'

export default function LoginPage() {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/visao-geral', { replace: true })
    } catch {
      setError(strings.auth.loginError)
    } finally {
      setLoading(false)
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.02),
      '& fieldset': {
        borderColor: isDark ? alpha('#ffffff', 0.1) : alpha('#000', 0.12),
      },
      '&:hover fieldset': { borderColor: alpha(primary, 0.45) },
      '&.Mui-focused fieldset': {
        borderColor: primary,
        boxShadow: `0 0 0 3px ${alpha(primary, 0.13)}`,
      },
    },
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        bgcolor: 'background.default',
      }}
    >
      {/* ── Left panel — branding ────────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#060a0f',
          p: 6,
        }}
      >
        {/* Single large ambient glow — subtle, centred */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 640,
            height: 640,
            top: '46%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(primary, 0.16)} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Premium dot grid */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, ${alpha('#ffffff', 0.055)} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />

        {/* ── Centred hero ─────────────────────────────────────────────────── */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {/* Glow wrapper — drop-shadow applied to parent so gradient text glows */}
          <Box
            sx={{
              filter: `drop-shadow(0 0 24px ${alpha(primary, 0.85)}) drop-shadow(0 0 60px ${alpha(primary, 0.4)})`,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: 'clamp(3.5rem, 6vw, 5rem)',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                background: `linear-gradient(135deg, #00e5b0 0%, ${primary} 48%, #80cbc4 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {strings.app.name}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: alpha('#ffffff', 0.28),
            }}
          >
            {strings.app.subtitle}
          </Typography>
        </Box>

        {/* ── Institution logos — pinned to bottom ─────────────────────────── */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            pt: 3,
            borderTop: `1px solid ${alpha('#ffffff', 0.07)}`,
          }}
        >
          <Box
            component="img"
            src="/agir_logo_colorida.png"
            alt="AGIR"
            sx={{
              height: 26,
              objectFit: 'contain',
              opacity: 0.5,
              filter: 'brightness(0) invert(1)',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: alpha('#ffffff', 0.1), my: 0.5 }}
          />

          <Box
            component="img"
            src="/logo_daherlab.png"
            alt="DaherLab"
            sx={{
              height: 30,
              objectFit: 'contain',
              opacity: 0.5,
              filter: 'brightness(0) invert(1)',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: alpha('#ffffff', 0.1), my: 0.5 }}
          />

          <Box
            component="img"
            src="/logo_transformacao_digital.png"
            alt="Transformação Digital"
            sx={{
              height: 26,
              objectFit: 'contain',
              opacity: 0.5,
              filter: 'brightness(0) invert(1)',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          />
        </Box>
      </Box>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Form card */}
          <Box
            sx={{
              bgcolor: isDark ? alpha('#161b22', 0.9) : '#ffffff',
              border: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000', 0.08)}`,
              borderRadius: '20px',
              p: { xs: 3, sm: 4.5 },
              boxShadow: isDark
                ? `0 0 0 1px ${alpha(primary, 0.06)}, 0 24px 64px ${alpha('#000', 0.55)}`
                : `0 4px 6px ${alpha('#000', 0.04)}, 0 20px 48px ${alpha('#000', 0.08)}`,
              backdropFilter: isDark ? 'blur(12px)' : 'none',
            }}
          >
            {/* Heading */}
            <Box mb={3.5}>
              <Typography
                sx={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: 'text.primary',
                  lineHeight: 1.15,
                  mb: 0.6,
                }}
              >
                {strings.auth.login}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
                {strings.auth.loginSubtitle}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <TextField
                label={strings.auth.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="email"
                autoFocus
                sx={fieldSx}
              />

              <TextField
                label={strings.auth.senha}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="current-password"
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.disabled' }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
                <Typography
                  component="a"
                  href="#"
                  sx={{
                    fontSize: '0.8rem',
                    color: primary,
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {strings.auth.esqueceuSenha}
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 0.5,
                  height: 44,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  letterSpacing: '0.01em',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: `0 4px 20px ${alpha(primary, 0.38)}`,
                  },
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : strings.auth.login}
              </Button>
            </Box>
          </Box>

          {/* Footer */}
          <Typography
            sx={{
              mt: 3,
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'text.disabled',
              letterSpacing: '0.02em',
            }}
          >
            {strings.app.name} · {strings.app.subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
