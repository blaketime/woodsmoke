import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../lib/theme'

export default function ThemeToggle() {
  const { effectiveMode, cycleMode } = useTheme()

  const Icon = effectiveMode === 'dark' ? Moon : Sun
  const label = effectiveMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="p-2.5 rounded-xl text-charcoal-light hover:text-charcoal hover:bg-black/5 dark:text-dark-text-secondary dark:hover:text-cream dark:hover:bg-white/5 transition-colors cursor-pointer"
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
