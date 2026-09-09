import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
  useTheme, alpha,
} from '@mui/material'
import VisibilityIcon    from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { signIn }   from '../../services/authService'
import { strings }  from '../../i18n/strings.pt-BR'

// ── Decorative floating orb ───────────────────────────────────────────────────
function Orb({ size, top, left, color, blur }: {
  size: number; top: string; left: string; color: string; blur: number
}) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        width: size, height: size,
        top, left,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.55,
        pointerEvents: 'none',
      }}
    />
  )
}

export default function LoginPage() {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main   // teal

  const navigate = useNavigate()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

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

  const borderColor = alpha('#ffffff', 0.10)

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
          position: 'relative',
          overflow: 'hidden',
          // Deep dark background — always dark regardless of theme, for visual impact
          bgcolor: '#0a0e14',
          p: 6,
        }}
      >
        {/* Decorative orbs */}
        <Orb size={420} top="-100px"  left="-80px"  color={`radial-gradient(circle, ${alpha(primary, 0.55)}, transparent 70%)`} blur={60} />
        <Orb size={300} top="55%"     left="60%"    color={`radial-gradient(circle, ${alpha('#0288d1', 0.4)}, transparent 70%)`}  blur={80} />
        <Orb size={200} top="75%"     left="-40px"  color={`radial-gradient(circle, ${alpha(primary, 0.3)}, transparent 70%)`}  blur={50} />

        {/* Subtle grid overlay */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(${alpha('#ffffff', 0.025)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha('#ffffff', 0.025)} 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* SiGCon brand mark */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 11, height: 11,
                borderRadius: '50%',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${primary}, ${alpha(primary, 0.6)})`,
                boxShadow: `0 0 14px ${alpha(primary, 0.85)}, 0 0 30px ${alpha(primary, 0.4)}`,
              }}
            />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.3rem',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                background: `linear-gradient(135deg, #ffffff 0%, ${alpha(primary, 0.9)} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {strings.app.name}
            </Typography>
          </Box>

          {/* Main hero text — centred vertically */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 6 }}>
            <Typography
              sx={{
                fontSize: '2.6rem',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                mb: 2,
              }}
            >
              Gestão de contratos{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(135deg, ${primary} 0%, #4db6ac 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                inteligente.
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: alpha('#ffffff', 0.5), lineHeight: 1.6, maxWidth: 340 }}>
              {strings.app.subtitle} — visibilidade completa de cada fase do processo contratual.
            </Typography>
          </Box>

          {/* Institution logos — pinned to bottom */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              pt: 3,
              borderTop: `1px solid ${alpha('#ffffff', 0.08)}`,
            }}
          >
            {[
              { src: '/agir_logo.png',                  alt: 'AGIR',                   h: 28 },
              { src: '/logo_daherlab.png',              alt: 'DaherLab',               h: 32 },
              { src: '/logo_transformacao_digital.png', alt: 'Transformação Digital',  h: 28 },
            ].map(({ src, alt, h }) => (
              <Box
                key={alt}
                component="img"
                src={src}
                alt={alt}
                sx={{
                  height: h,
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  opacity: 0.55,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.85 },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Right panel — form ───────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile brand mark */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1,
              mb: 4,
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${primary}, ${alpha(primary, 0.6)})`,
                boxShadow: `0 0 10px ${alpha(primary, 0.8)}`,
              }}
            />
            <Typography
              sx={{
                fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em',
                background: `linear-gradient(135deg, ${primary} 0%, ${isDark ? '#4db6ac' : theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {strings.app.name}
            </Typography>
          </Box>

          {/* Form card */}
          <Box
            sx={{
              bgcolor: isDark ? alpha('#161b22', 0.9) : '#ffffff',
              border: `1px solid ${isDark ? alpha('#ffffff', 0.08) : alpha('#000', 0.08)}`,
              borderRadius: '20px',
              p: { xs: 3, sm: 4 },
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
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  lineHeight: 1.2,
                  mb: 0.75,
                }}
              >
                {strings.auth.login}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                {strings.auth.loginSubtitle}
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}
              >
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.02),
                    '& fieldset': { borderColor: borderColor },
                    '&:hover fieldset': { borderColor: alpha(primary, 0.4) },
                    '&.Mui-focused fieldset': {
                      borderColor: primary,
                      boxShadow: `0 0 0 3px ${alpha(primary, 0.15)}`,
                    },
                  },
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: isDark ? alpha('#ffffff', 0.04) : alpha('#000', 0.02),
                    '& fieldset': { borderColor: borderColor },
                    '&:hover fieldset': { borderColor: alpha(primary, 0.4) },
                    '&.Mui-focused fieldset': {
                      borderColor: primary,
                      boxShadow: `0 0 0 3px ${alpha(primary, 0.15)}`,
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.disabled' }}
                      >
                        {showPassword
                          ? <VisibilityOffIcon sx={{ fontSize: 18 }} />
                          : <VisibilityIcon   sx={{ fontSize: 18 }} />}
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
                }}
              >
                {loading
                  ? <CircularProgress size={20} color="inherit" />
                  : strings.auth.login}
              </Button>
            </Box>
          </Box>

          {/* Footer */}
          <Typography
            sx={{
              mt: 3,
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'text.disabled',
            }}
          >
            {strings.app.name} · {strings.app.subtitle}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
