import { useState, useEffect } from 'react'

function get() {
  if (typeof window === 'undefined') return 'mobile'
  if (window.innerWidth >= 1024) return 'desktop'
  if (window.innerWidth >= 640) return 'tablet'
  return 'mobile'
}

export function useBreakpoint() {
  const [bp, setBp] = useState(get)
  useEffect(() => {
    const handler = () => setBp(get())
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return bp
}
