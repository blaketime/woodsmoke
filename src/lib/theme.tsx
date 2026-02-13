import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemeMode = 'system' | 'light' | 'dark'
type EffectiveTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  effectiveMode: EffectiveTheme
  setMode: (mode: ThemeMode) => void
  cycleMode: () => void
}

const STORAGE_KEY = 'woodsmoke:theme'
const CYCLE_ORDER: ThemeMode[] = ['system', 'light', 'dark']

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveEffective(mode: ThemeMode): EffectiveTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    return 'system'
  })
  const [effectiveMode, setEffectiveMode] = useState<EffectiveTheme>(() => resolveEffective(mode))

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(STORAGE_KEY, newMode)
  }

  const cycleMode = () => {
    const idx = CYCLE_ORDER.indexOf(mode)
    setMode(CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length])
  }

  useEffect(() => {
    const update = () => setEffectiveMode(resolveEffective(mode))
    update()

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
  }, [mode])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveMode === 'dark')
  }, [effectiveMode])

  return (
    <ThemeContext value={{ mode, effectiveMode, setMode, cycleMode }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
