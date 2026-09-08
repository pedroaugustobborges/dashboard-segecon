import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { signIn } from '../../services/authService'
import { strings } from '../../i18n/strings.pt-BR'

export default function LoginPage() {
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        bgcolor: 'background.default',
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          bgcolor: 'primary.main',
          backgroundImage: 'linear-gradient(145deg, #00897b 0%, #00695c 100%)',
          p: 6,
          color: '#fff',
        }}
      >
        <Box
          component="img"
          src="/logo_daherlab.png"
          alt="DaherLab"
          sx={{ height: 56, filter: 'brightness(0) invert(1)', objectFit: 'contain' }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {strings.app.name}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.85, fontWeight: 400 }}>
            {strings.app.subtitle}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 4, mt: 2, alignItems: 'center' }}>
          <Box
            component="img"
            src="/agir_logo.png"
            alt="AGIR"
            sx={{ height: 36, filter: 'brightness(0) invert(1)', objectFit: 'contain', opacity: 0.9 }}
          />
          <Box
            component="img"
            src="/logo_transformacao_digital.png"
            alt="Transformação Digital"
            sx={{ height: 36, filter: 'brightness(0) invert(1)', objectFit: 'contain', opacity: 0.9 }}
          />
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 420, p: 1 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
              <Box
                component="img"
                src="/logo_daherlab.png"
                alt="DaherLab"
                sx={{ height: 40, objectFit: 'contain' }}
              />
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700}>
                {strings.auth.login}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {strings.auth.loginSubtitle}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

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
                autoComplete="email"
                autoFocus
              />
              <TextField
                label={strings.auth.senha}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link href="#" variant="body2" underline="hover">
                  {strings.auth.esqueceuSenha}
                </Link>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : strings.auth.login}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
