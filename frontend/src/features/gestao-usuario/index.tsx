import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar, Chip,
  IconButton, Tooltip, Drawer, TextField, Select, MenuItem,
  FormControl, InputLabel, Autocomplete, Alert, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Snackbar, Divider,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import AddIcon from '@mui/icons-material/Add'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import {
  listAllUsers, createUser, updateUserProfile,
  resetUserPassword, uploadUserPhoto,
  type CreateUserPayload,
} from '../../services/authService'
import { fetchDistinctEntidades } from '../../services/processoContrato'
import { useUserRole } from '../../hooks/useUserRole'
import { strings } from '../../i18n/strings.pt-BR'
import type { AppUser, UserRole } from '../../types/auth.types'

// ── Drawer form state ──────────────────────────────────────────

interface FormState {
  nome: string
  email: string
  senha: string
  role: UserRole
  entidades: string[]
  photoFile: File | null
  photoPreview: string | null
}

const defaultForm: FormState = {
  nome: '',
  email: '',
  senha: '',
  role: 'Analista',
  entidades: [],
  photoFile: null,
  photoPreview: null,
}

// ── Helpers ────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function EntidadesCell({ entidades }: { entidades: string[] }) {
  const MAX = 3
  if (entidades.length === 0) return <Typography variant="body2" color="text.disabled">—</Typography>
  const visible = entidades.slice(0, MAX)
  const extra = entidades.length - MAX
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((e) => (
        <Chip key={e} label={e} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
      ))}
      {extra > 0 && (
        <Chip label={`+${extra}`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
      )}
    </Box>
  )
}

// ── Main component ─────────────────────────────────────────────

export default function GestaoUsuario() {
  const { isAdmin, loading: roleLoading } = useUserRole()
  const qc = useQueryClient()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AppUser | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null)
  const [snack, setSnack] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Queries ──────────────────────────────────────────────────

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: listAllUsers,
    enabled: isAdmin,
  })

  const { data: entidadeOptions = [] } = useQuery({
    queryKey: ['distinct-entidades'],
    queryFn: fetchDistinctEntidades,
    enabled: isAdmin,
  })

  // ── Mutations ────────────────────────────────────────────────

  const createMut = useMutation({
    mutationFn: async (payload: CreateUserPayload & { photoFile: File | null }) => {
      const user = await createUser(payload)
      if (payload.photoFile) {
        const url = await uploadUserPhoto(user.id, payload.photoFile)
        await updateUserProfile(user.id, { photo_url: url })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setDrawerOpen(false)
      setSnack(strings.gestaoUsuario.usuarioCriado)
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const updateMut = useMutation({
    mutationFn: async ({ userId, updates, photoFile }: {
      userId: string
      updates: Partial<Pick<AppUser, 'nome' | 'role' | 'entidades' | 'photo_url'>>
      photoFile: File | null
    }) => {
      if (photoFile) {
        const url = await uploadUserPhoto(userId, photoFile)
        updates = { ...updates, photo_url: url }
      }
      await updateUserProfile(userId, updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setDrawerOpen(false)
      setSnack(strings.gestaoUsuario.usuarioAtualizado)
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const resetMut = useMutation({
    mutationFn: (email: string) => resetUserPassword(email),
    onSuccess: () => {
      setResetTarget(null)
      setSnack(strings.gestaoUsuario.senhaResetEnviada)
    },
  })

  // ── Handlers ─────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null)
    setForm(defaultForm)
    setFormError(null)
    setDrawerOpen(true)
  }

  function openEdit(user: AppUser) {
    setEditTarget(user)
    setForm({
      nome: user.nome,
      email: user.email,
      senha: '',
      role: user.role,
      entidades: user.entidades,
      photoFile: null,
      photoPreview: user.photo_url,
    })
    setFormError(null)
    setDrawerOpen(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setForm((f) => ({ ...f, photoFile: file, photoPreview: preview }))
  }

  function handleSubmit() {
    setFormError(null)
    if (editTarget) {
      updateMut.mutate({
        userId: editTarget.id,
        updates: { nome: form.nome, role: form.role, entidades: form.entidades },
        photoFile: form.photoFile,
      })
    } else {
      createMut.mutate({
        email: form.email,
        password: form.senha,
        nome: form.nome,
        role: form.role,
        entidades: form.entidades,
        photoFile: form.photoFile,
      })
    }
  }

  const isMutating = createMut.isPending || updateMut.isPending

  // ── Access guard ─────────────────────────────────────────────

  if (roleLoading) return null

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{strings.errors.semAcesso}</Alert>
      </Box>
    )
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {strings.gestaoUsuario.title}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {strings.gestaoUsuario.novoUsuario}
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {strings.errors.carregamentoFalhou}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }}></TableCell>
              <TableCell>{strings.gestaoUsuario.colNome}</TableCell>
              <TableCell>{strings.gestaoUsuario.colEmail}</TableCell>
              <TableCell>{strings.gestaoUsuario.colPerfil}</TableCell>
              <TableCell>{strings.gestaoUsuario.colUnidades}</TableCell>
              <TableCell align="right">{strings.gestaoUsuario.colAcoes}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : (users ?? []).length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {strings.gestaoUsuario.nenhumUsuario}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              : (users ?? []).map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Avatar
                        src={u.photo_url ?? undefined}
                        sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}
                      >
                        {getInitials(u.nome)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{u.nome}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{u.email || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={strings.gestaoUsuario.perfis[u.role]}
                        size="small"
                        color={u.role === 'Admin' ? 'primary' : 'default'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {u.role === 'Admin'
                        ? <Typography variant="body2" color="text.disabled">Todas</Typography>
                        : <EntidadesCell entidades={u.entidades} />
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={strings.gestaoUsuario.editarUsuario}>
                        <IconButton size="small" onClick={() => openEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {u.email && (
                        <Tooltip title={strings.gestaoUsuario.resetarSenha}>
                          <IconButton size="small" onClick={() => setResetTarget(u)}>
                            <LockResetIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !isMutating && setDrawerOpen(false)}
        PaperProps={{ sx: { width: 480, p: 3 } }}
      >
        <Typography variant="h6" fontWeight={700} mb={3}>
          {editTarget ? strings.gestaoUsuario.editarUsuario : strings.gestaoUsuario.criarUsuario}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Photo upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={form.photoPreview ?? undefined}
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.2rem' }}
            >
              {form.nome ? getInitials(form.nome) : '?'}
            </Avatar>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              {strings.gestaoUsuario.carregarFoto}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
          </Box>

          <TextField
            label={strings.gestaoUsuario.nome}
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
            fullWidth
          />

          {!editTarget && (
            <>
              <TextField
                label={strings.gestaoUsuario.email}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label={strings.auth.senha}
                type="password"
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                required
                fullWidth
              />
            </>
          )}

          <FormControl fullWidth>
            <InputLabel>{strings.gestaoUsuario.perfil}</InputLabel>
            <Select
              value={form.role}
              label={strings.gestaoUsuario.perfil}
              onChange={(e) => setForm((f) => ({
                ...f,
                role: e.target.value as UserRole,
                entidades: e.target.value === 'Admin' ? [] : f.entidades,
              }))}
            >
              <MenuItem value="Admin">{strings.gestaoUsuario.perfis.Admin}</MenuItem>
              <MenuItem value="Analista">{strings.gestaoUsuario.perfis.Analista}</MenuItem>
            </Select>
          </FormControl>

          {form.role === 'Analista' && (
            <Autocomplete
              multiple
              options={entidadeOptions}
              value={form.entidades}
              onChange={(_, val) => setForm((f) => ({ ...f, entidades: val }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={strings.gestaoUsuario.entidadesAtribuidas}
                  placeholder={strings.gestaoUsuario.unidadesPlaceholder}
                />
              )}
              renderTags={(val, getTagProps) =>
                val.map((option, index) => (
                  <Chip
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          )}

          <Divider />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setDrawerOpen(false)}
              disabled={isMutating}
            >
              {strings.gestaoUsuario.cancelar}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isMutating}
            >
              {editTarget
                ? strings.gestaoUsuario.salvarAlteracoes
                : strings.gestaoUsuario.criarUsuario
              }
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Reset password confirmation dialog */}
      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)}>
        <DialogTitle>{strings.gestaoUsuario.resetarSenha}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {strings.gestaoUsuario.confirmarResetSenha} <strong>{resetTarget?.email}</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)}>{strings.gestaoUsuario.cancelar}</Button>
          <Button
            variant="contained"
            onClick={() => resetTarget?.email && resetMut.mutate(resetTarget.email)}
            disabled={resetMut.isPending}
          >
            {strings.gestaoUsuario.confirmar}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
