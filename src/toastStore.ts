import { create } from 'zustand'

interface ToastState {
  message: string | null
  tone: 'success' | 'error'
  id: number
  show: (message: string, tone?: 'success' | 'error') => void
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'success',
  id: 0,
  show: (message, tone = 'success') => {
    if (timer) clearTimeout(timer)
    set((s) => ({ message, tone, id: s.id + 1 }))
    timer = setTimeout(() => set({ message: null }), 2800)
  },
}))
