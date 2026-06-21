import { useState, useEffect, useCallback } from 'react'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Fab from '@mui/material/Fab'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import RepeatIcon from '@mui/icons-material/Repeat'
import EventIcon from '@mui/icons-material/Event'
import { EventSignal, SidePipeSound, SOUND_LABELS } from './types'

const API_BASE = ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message)
  }
  return res.json()
}

const SOUNDS: SidePipeSound[] = ['zarei', 'tanfu', 'souin', 'wakare', 'genmon_sougei']

function App() {
  const [events, setEvents] = useState<EventSignal[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventSignal | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' })

  const [formTime, setFormTime] = useState('08:00')
  const [formSound, setFormSound] = useState<SidePipeSound>('zarei')
  const [formAnnouncement, setFormAnnouncement] = useState('')
  const [formRecurring, setFormRecurring] = useState(true)
  const [formDate, setFormDate] = useState('')

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: EventSignal[] }>('/api/events')
      setEvents(res.data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setSnackbar({ open: true, message: `読み込み失敗: ${msg}`, severity: 'error' })
    }
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  const resetForm = () => {
    setFormTime('08:00')
    setFormSound('zarei')
    setFormAnnouncement('')
    setFormRecurring(true)
    setFormDate('')
  }

  const openAddDialog = () => {
    setEditingEvent(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (event: EventSignal) => {
    setEditingEvent(event)
    setFormTime(event.time)
    setFormSound(event.sound)
    setFormAnnouncement(event.announcement)
    setFormRecurring(event.recurring)
    setFormDate(event.date || '')
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingEvent(null)
    resetForm()
  }

  const handleSave = async () => {
    if (!formAnnouncement.trim()) {
      setSnackbar({ open: true, message: '号令を入力してください', severity: 'error' })
      return
    }

    const body = {
      time: formTime,
      sound: formSound,
      announcement: formAnnouncement.trim(),
      recurring: formRecurring,
      date: formRecurring ? undefined : formDate,
    }

    try {
      if (editingEvent) {
        await apiFetch(`/api/events/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
        setSnackbar({ open: true, message: 'イベントを更新しました', severity: 'success' })
      } else {
        await apiFetch('/api/events', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        setSnackbar({ open: true, message: 'イベントを追加しました', severity: 'success' })
      }
      closeDialog()
      await loadEvents()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setSnackbar({ open: true, message: `${editingEvent ? '更新' : '追加'}失敗: ${msg}`, severity: 'error' })
    }
  }

  const handleToggle = async (event: EventSignal) => {
    try {
      await apiFetch(`/api/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !event.enabled }),
      })
      await loadEvents()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setSnackbar({ open: true, message: `更新失敗: ${msg}`, severity: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/events/${id}`, { method: 'DELETE' })
      await loadEvents()
      setSnackbar({ open: true, message: 'イベントを削除しました', severity: 'success' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setSnackbar({ open: true, message: `削除失敗: ${msg}`, severity: 'error' })
    }
  }

  const isEditing = editingEvent !== null

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        イベント時報
      </Typography>

      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            イベントが登録されていません
          </Typography>
        </Paper>
      ) : (
        <List>
          {events.map((event) => (
            <ListItem
              key={event.id}
              component={Paper}
              sx={{ mb: 1, opacity: event.enabled ? 1 : 0.5, cursor: 'pointer' }}
              onClick={() => openEditDialog(event)}
            >
              <Switch
                checked={event.enabled}
                onChange={() => handleToggle(event)}
                onClick={(e) => e.stopPropagation()}
                size="small"
                sx={{ mr: 1 }}
              />
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="body1" fontWeight="bold">{event.time}</Typography>
                    <Chip label={SOUND_LABELS[event.sound]} size="small" color="primary" variant="outlined" />
                    {event.recurring ? (
                      <Chip icon={<RepeatIcon />} label="毎日" size="small" color="info" variant="outlined" />
                    ) : (
                      <Chip icon={<EventIcon />} label={event.date || '単発'} size="small" color="warning" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={event.announcement}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleDelete(event.id) }} size="small">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={openAddDialog}
      >
        <AddIcon />
      </Fab>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
        <DialogTitle>{isEditing ? 'イベント編集' : 'イベント追加'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="時刻"
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="音源"
            select
            value={formSound}
            onChange={(e) => setFormSound(e.target.value as SidePipeSound)}
            fullWidth
          >
            {SOUNDS.map((s) => (
              <MenuItem key={s} value={s}>{SOUND_LABELS[s]}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="号令"
            placeholder="例: 出港用意 5分前"
            value={formAnnouncement}
            onChange={(e) => setFormAnnouncement(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox checked={formRecurring} onChange={(e) => setFormRecurring(e.target.checked)} />
            }
            label="毎日繰り返す"
          />
          {!formRecurring && (
            <TextField
              label="日付"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">{isEditing ? '保存' : '追加'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default App
