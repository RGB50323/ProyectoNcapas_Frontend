'use client'

import { useState, useCallback } from 'react'
import { Toast } from '@/components/Toast'

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  id: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const show = useCallback((message: string, type: ToastState['type'] = 'info') => {
    const id = Date.now()
    setToasts([{ message, type, id }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </>
  ), [toasts, remove])

  return { show, ToastContainer }
}