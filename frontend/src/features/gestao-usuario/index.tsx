import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip,
  IconButton, Tooltip, Drawer, TextField, Select, MenuItem,
  FormControl, InputLabel, Autocomplete, Alert, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Snackbar, Divider, useTheme, alpha,
} from '@mui/material'
import EditIcon        from '@mui/icons-material/Edit'
import LockResetIcon   from '@mui/icons-material/LockReset'
import AddIcon         from '@mui/icons-material/Add'
import CloseIcon       from '@mui/icons-material/Close'
import CameraAltIcon   from '@mui/icons-material/CameraAlt'
import PeopleIcon      from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  listAllUsers, createUser, updateUserProfile,
  resetUserPassword, uploadUserPhoto,
  type CreateUserPayload,
} from '../../services/authService'
import { fetchDistinctEntidades } from '../../services/processoContrato'
import { useUserRole }  from '../../hooks/useUserRole'
import { strings }      from '../../i18n/strings.pt-BR'
import type { AppUser, UserRole } from '../../types/auth.types'

// ── Form state ────────────────────────────────────────────────────────────────

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
  nome: '', email: '', senha: '', role: 'Analista',
  entidades: [], photoFile: null, photoPreview: null,
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

// ── Entidades cell ────────────────────────────────────────────────────────────

function EntidadesCell({ entidades, isDark, primary, borderColor }: {
  entidades: string[]
  isDark: boolean
  primary: string
  borderColor: string
}) {
  const MAX = 3
  if (entidades.length === 0)
    return <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>—</Typography>
  const visible = entidades.slice(0, MAX)
  const extra   = entidades.length - MAX
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((e) => (
        <Chip
          key={e}
          label={e}
          size="small"
          sx={{
            fontSize: '0.68rem',
            height: 20,
            bgcolor: alpha(primary, isDark ? 0.12 : 0.07),
            color: primary,
            border: `1px solid ${alpha(primary, isDark ? 0.28 : 0.2)}`,
            fontWeight: 600,
          }}
        />
      ))}
      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size="small"
          sx={{
            fontSize: '0.68rem',
            height: 20,
            bgcolor: alpha('#ffffff', isDark ? 0.06 : 0.0),
            border: `1px solid ${borderColor}`,
            color: 'text.secondary',
          }}
        />
      )}
    </Box>
  )
}

// ── Section label inside drawer ───────────────────────────────────────────────

function DrawerSection({ label }: { label: string }) {
  return (
    <Typography
      sx={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'text.disabled',
        mt: 0.5,
        mb: -0.5,
      }}
    >
      {label}
    </Typography>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GestaoUsuario() {
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'
  const primary = theme.palette.primary.main

  const borderColor  = isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.09)
  const headerBg     = isDark ? alpha('#ffffff', 0.05) : alpha('#000000', 0.025)
  const rowHoverBg   = isDark ? alpha(primary, 0.09)   : alpha(primary, 0.04)
  const drawerBg     = isDark ? '#111318' : '#ffffff'

  const { isAdmin, loading: roleLoading } = useUserRole()
  const qc = useQueryClient()

  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [editTarget,  setEditTarget]  = useState<AppUser | null>(null)
  const [form,        setForm]        = useState<FormState>(defaultForm)
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null)
  const [snack,       setSnack]       = useState<string | null>(null)
  const [formError,   setFormError]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Queries ───────────────────────────────────────────────────────────────

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

  // ── Mutations ─────────────────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openCreate() {
    setEditTarget(null)
    setForm(defaultForm)
    setFormError(null)
    setDrawerOpen(true)
  }

  function openEdit(user: AppUser) {
    setEditTarget(user)
    setForm({
      nome: user.nome, email: user.email, senha: '',
      role: user.role, entidades: user.entidades,
      photoFile: null, photoPreview: user.photo_url,
    })
    setFormError(null)
    setDrawerOpen(true)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((f) => ({ ...f, photoFile: file, photoPreview: URL.createObjectURL(file) }))
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
        email: form.email, password: form.senha, nome: form.nome,
        role: form.role, entidades: form.entidades, photoFile: form.photoFile,
      })
    }
  }

  const isMutating = createMut.isPending || updateMut.isPending

  // ── Access guard ──────────────────────────────────────────────────────────

  if (roleLoading) return null

  if (!isAdmin) {
    return (
      <Box sx={{ px: 1.5, py: 1.5 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{strings.errors.semAcesso}</Alert>
      </Box>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const userCount = (users ?? []).length

  return (
    <Box sx={{ px: 1.5, py: 1.5 }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: alpha(primary, isDark ? 0.18 : 0.10),
              border: `1px solid ${alpha(primary, isDark ? 0.32 : 0.20)}`,
              boxShadow: isDark ? `0 0 16px ${alpha(primary, 0.22)}` : 'none',
            }}
          >
            <PeopleIcon sx={{ fontSize: 20, color: primary }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
              {strings.gestaoUsuario.title}
            </Typography>
            {!isLoading && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {userCount} {userCount === 1 ? 'usuário' : 'usuários'} cadastrados
              </Typography>
            )}
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            borderRadius: '12px',
            fontWeight: 700,
            px: 2.5,
            textTransform: 'none',
            fontSize: '0.85rem',
          }}
        >
          {strings.gestaoUsuario.novoUsuario}
        </Button>
      </Box>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {strings.errors.carregamentoFalhou}
        </Alert>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <TableContainer
        sx={{
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? `0 4px 24px ${alpha('#000', 0.3)}`
            : `0 2px 12px ${alpha('#000', 0.06)}`,
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              {['', strings.gestaoUsuario.colNome, strings.gestaoUsuario.colEmail,
                strings.gestaoUsuario.colPerfil, strings.gestaoUsuario.colUnidades,
                strings.gestaoUsuario.colAcoes,
              ].map((label, i) => (
                <TableCell
                  key={i}
                  align={i === 5 ? 'right' : 'left'}
                  sx={{
                    bgcolor: headerBg,
                    borderBottom: `1px solid ${borderColor}`,
                    py: 1.25,
                    width: i === 0 ? 52 : undefined,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton variant="circular" width={36} height={36} /></TableCell>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : (users ?? []).length === 0
              ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled' }}>
                        {strings.gestaoUsuario.nenhumUsuario}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              : (users ?? []).map((u, idx) => (
                  <TableRow
                    key={u.id}
                    sx={{
                      bgcolor: idx % 2 === 1
                        ? (isDark ? alpha('#ffffff', 0.015) : alpha('#000', 0.008))
                        : 'transparent',
                      '&:hover': { bgcolor: rowHoverBg },
                      '&:last-child td': { border: 0 },
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    {/* Avatar */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      <Avatar
                        src={u.photo_url ?? undefined}
                        sx={{
                          width: 36, height: 36,
                          fontSize: '0.78rem', fontWeight: 700,
                          bgcolor: primary,
                          boxShadow: `0 0 0 2px ${alpha(primary, isDark ? 0.35 : 0.22)}`,
                        }}
                      >
                        {getInitials(u.nome)}
                      </Avatar>
                    </TableCell>

                    {/* Nome */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.primary' }}>
                        {u.nome}
                      </Typography>
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        {u.email || '—'}
                      </Typography>
                    </TableCell>

                    {/* Role chip */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      <Chip
                        label={strings.gestaoUsuario.perfis[u.role]}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          height: 22,
                          bgcolor: u.role === 'Admin'
                            ? alpha(primary, isDark ? 0.20 : 0.12)
                            : alpha('#ffffff', isDark ? 0.06 : 0.0),
                          color: u.role === 'Admin' ? primary : 'text.secondary',
                          border: `1px solid ${u.role === 'Admin'
                            ? alpha(primary, isDark ? 0.38 : 0.28)
                            : borderColor}`,
                        }}
                      />
                    </TableCell>

                    {/* Entidades */}
                    <TableCell sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      {u.role === 'Admin'
                        ? (
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontStyle: 'italic' }}>
                              Todas
                            </Typography>
                          )
                        : (
                            <EntidadesCell
                              entidades={u.entidades}
                              isDark={isDark}
                              primary={primary}
                              borderColor={borderColor}
                            />
                          )
                      }
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ borderBottom: `1px solid ${borderColor}`, py: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
                        <Tooltip title={strings.gestaoUsuario.editarUsuario}>
                          <IconButton
                            size="small"
                            onClick={() => openEdit(u)}
                            sx={{
                              border: `1px solid ${borderColor}`,
                              borderRadius: '8px',
                              color: 'text.secondary',
                              '&:hover': {
                                color: primary,
                                borderColor: alpha(primary, 0.4),
                                bgcolor: alpha(primary, 0.08),
                              },
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        {u.email && (
                          <Tooltip title={strings.gestaoUsuario.resetarSenha}>
                            <IconButton
                              size="small"
                              onClick={() => setResetTarget(u)}
                              sx={{
                                border: `1px solid ${borderColor}`,
                                borderRadius: '8px',
                                color: 'text.secondary',
                                '&:hover': {
                                  color: '#f57c00',
                                  borderColor: alpha('#f57c00', 0.4),
                                  bgcolor: alpha('#f57c00', 0.08),
                                },
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <LockResetIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Create / Edit Drawer ─────────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => !isMutating && setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 500,
            bgcolor: drawerBg,
            backgroundImage: 'none',
            borderLeft: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Drawer header */}
        <Box
          sx={{
            px: 3, py: 2.5,
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark
              ? `linear-gradient(135deg, ${alpha(primary, 0.10)} 0%, transparent 60%)`
              : `linear-gradient(135deg, ${alpha(primary, 0.05)} 0%, transparent 60%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 4, height: 20, borderRadius: 2, bgcolor: primary, flexShrink: 0,
                boxShadow: isDark ? `0 0 10px ${alpha(primary, 0.7)}` : 'none',
              }}
            />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary' }}>
              {editTarget ? strings.gestaoUsuario.editarUsuario : strings.gestaoUsuario.criarUsuario}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => !isMutating && setDrawerOpen(false)}
            sx={{
              color: 'text.disabled',
              '&:hover': { color: 'text.primary', bgcolor: alpha('#ffffff', isDark ? 0.06 : 0.0) },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Drawer body — scrollable */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{formError}</Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Photo upload */}
            <DrawerSection label="Foto de Perfil" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'relative',
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover .cam-overlay': { opacity: 1 },
                }}
              >
                <Avatar
                  src={form.photoPreview ?? undefined}
                  sx={{
                    width: 72, height: 72,
                    bgcolor: primary, fontSize: '1.3rem', fontWeight: 700,
                    boxShadow: `0 0 0 3px ${alpha(primary, isDark ? 0.4 : 0.25)}`,
                  }}
                >
                  {form.nome ? getInitials(form.nome) : '?'}
                </Avatar>
                <Box
                  className="cam-overlay"
                  sx={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    bgcolor: alpha('#000', 0.55),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.18s ease',
                  }}
                >
                  <CameraAltIcon sx={{ fontSize: 22, color: '#fff' }} />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  {form.photoFile ? form.photoFile.name : 'Nenhuma foto selecionada'}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
                  Clique na imagem para carregar. JPG, PNG ou GIF (máx. 2 MB)
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
              />
            </Box>

            <Divider sx={{ borderColor }} />

            {/* Informações básicas */}
            <DrawerSection label="Informações Básicas" />

            <TextField
              label={strings.gestaoUsuario.nome}
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
                <TextField
                  label={strings.auth.senha}
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  required
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </>
            )}

            <Divider sx={{ borderColor }} />

            {/* Acesso */}
            <DrawerSection label="Acesso e Permissões" />

            <FormControl fullWidth size="small">
              <InputLabel>{strings.gestaoUsuario.perfil}</InputLabel>
              <Select
                value={form.role}
                label={strings.gestaoUsuario.perfil}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  role: e.target.value as UserRole,
                  entidades: e.target.value === 'Admin' ? [] : f.entidades,
                }))}
                sx={{ borderRadius: '10px' }}
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
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={strings.gestaoUsuario.entidadesAtribuidas}
                    placeholder={strings.gestaoUsuario.unidadesPlaceholder}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                )}
                renderTags={(val, getTagProps) =>
                  val.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index })
                    return (
                      <Chip
                        key={key}
                        {...tagProps}
                        label={option}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 22,
                          bgcolor: alpha(primary, isDark ? 0.18 : 0.10),
                          color: primary,
                          border: `1px solid ${alpha(primary, isDark ? 0.32 : 0.22)}`,
                          fontWeight: 600,
                          '& .MuiChip-deleteIcon': { color: primary, opacity: 0.7 },
                        }}
                      />
                    )
                  })
                }
              />
            )}
          </Box>
        </Box>

        {/* Drawer footer — pinned */}
        <Box
          sx={{
            px: 3, py: 2,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            gap: 1.5,
            justifyContent: 'flex-end',
            bgcolor: isDark ? alpha('#ffffff', 0.02) : alpha('#000', 0.01),
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setDrawerOpen(false)}
            disabled={isMutating}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {strings.gestaoUsuario.cancelar}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isMutating}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            {isMutating
              ? 'Salvando…'
              : editTarget
                ? strings.gestaoUsuario.salvarAlteracoes
                : strings.gestaoUsuario.criarUsuario
            }
          </Button>
        </Box>
      </Drawer>

      {/* ── Reset password dialog ────────────────────────────────────────────── */}
      <Dialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: drawerBg,
            backgroundImage: 'none',
            border: `1px solid ${borderColor}`,
            minWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>
          {strings.gestaoUsuario.resetarSenha}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {strings.gestaoUsuario.confirmarResetSenha}{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {resetTarget?.email}
            </Box>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setResetTarget(null)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {strings.gestaoUsuario.cancelar}
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => resetTarget?.email && resetMut.mutate(resetTarget.email)}
            disabled={resetMut.isPending}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            {resetMut.isPending ? 'Enviando…' : strings.gestaoUsuario.confirmar}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Success snackbar ─────────────────────────────────────────────────── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity="success"
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: isDark
              ? `0 8px 32px ${alpha('#000', 0.5)}`
              : `0 4px 20px ${alpha('#000', 0.15)}`,
          }}
        >
          {snack}
        </Alert>
      </Snackbar>

    </Box>
  )
}
