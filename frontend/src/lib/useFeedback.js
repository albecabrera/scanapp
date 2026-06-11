import { useState, useCallback, useRef } from 'react'

const DURATIONS = {
  success: 700,  // glow animation: 620ms + buffer
  error:   500,  // shake: 440ms + buffer
}

/**
 * Máquina de estados para micro-interacciones de feedback.
 * Prioridad: error(4) > loading(3) > success(2) > idle(1)
 * Estados mutuamente excluyentes: success ↔ error, success ↔ loading.
 */
export function useFeedback() {
  const [state, setState] = useState('idle')
  const timerRef = useRef(null)

  // key cambia para re-triggerear animación CSS aunque el estado sea igual
  const [animKey, setAnimKey] = useState(0)

  const triggerSuccess = useCallback(() => {
    clearTimeout(timerRef.current)
    setState('success')
    setAnimKey(k => k + 1)
    timerRef.current = setTimeout(() => setState('idle'), DURATIONS.success)
  }, [])

  // persistent=true → border error queda hasta que el usuario corrija
  const triggerError = useCallback((persistent = false) => {
    clearTimeout(timerRef.current)
    setState('error')
    setAnimKey(k => k + 1)
    if (!persistent) {
      timerRef.current = setTimeout(() => setState('idle'), DURATIONS.error)
    }
  }, [])

  const setLoading = useCallback((isLoading) => {
    if (isLoading) {
      clearTimeout(timerRef.current)
      setState('loading')
    } else {
      setState('idle')
    }
  }, [])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setState('idle')
  }, [])

  const CLASS = {
    success: 'ss-feedback-success',
    error:   'ss-feedback-error',
    loading: 'ss-feedback-loading',
    idle:    '',
  }

  // Estilo inline adicional para error persistente (border no se puede hacer solo con clase)
  const persistentErrorStyle = state === 'error'
    ? { transition: 'box-shadow 170ms var(--ease-snappy), outline 170ms var(--ease-snappy)' }
    : {}

  return {
    feedbackState: state,
    feedbackClass: CLASS[state],
    feedbackKey: animKey,  // para key= en el elemento animado
    persistentErrorStyle,
    triggerSuccess,
    triggerError,
    setLoading,
    reset,
    isLoading: state === 'loading',
    isError:   state === 'error',
    isSuccess: state === 'success',
  }
}
