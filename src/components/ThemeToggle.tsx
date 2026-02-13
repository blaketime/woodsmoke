import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle() {
  const { mode, effectiveMode, cycleMode } = useTheme()

  const Icon = effectiveMode === 'dark' ? Moon : Sun
  const label =
    mode === 'system' ? 'Theme: System' : mode === 'light' ? 'Theme: Light' : 'Theme: Dark'

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="relative p-2.5 rounded-xl text-charcoal-light hover:text-charcoal hover:bg-black/5 dark:text-dark-text-secondary dark:hover:text-cream dark:hover:bg-white/5 transition-colors cursor-pointer"
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
      {mode === 'system' && (
        <Monitor className="absolute bottom-1 right-1 w-2 h-2 text-sage" />
      )}
    </button>
  )
}
