import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { WeatherDateRange } from '../lib/types'

interface DateRangePickerProps {
  onDateRangeChange: (range: WeatherDateRange | null) => void
  dateRange: WeatherDateRange | null
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDisplay(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function DateRangePicker({ onDateRangeChange, dateRange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [selectingEnd, setSelectingEnd] = useState(false)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const todayStr = toISO(new Date())
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  const maxStr = toISO(maxDate)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  function handleDayClick(iso: string) {
    if (iso < todayStr || iso > maxStr) return

    if (!selectingEnd || !dateRange) {
      // Picking start date
      onDateRangeChange({ startDate: iso, endDate: iso })
      setSelectingEnd(true)
    } else {
      // Picking end date
      if (iso < dateRange.startDate) {
        // Clicked before start — restart with this as new start
        onDateRangeChange({ startDate: iso, endDate: iso })
        setSelectingEnd(true)
      } else {
        onDateRangeChange({ startDate: dateRange.startDate, endDate: iso })
        setSelectingEnd(false)
        setOpen(false)
      }
    }
  }

  function getDayState(iso: string) {
    const disabled = iso < todayStr || iso > maxStr
    const start = dateRange?.startDate
    const end = selectingEnd && hoverDate && dateRange
      ? (hoverDate >= dateRange.startDate ? hoverDate : dateRange.startDate)
      : dateRange?.endDate
    const hasRange = start && end && start !== end
    const isStart = iso === start
    const isEnd = iso === end
    const inRange = hasRange && iso > start && iso < end

    return { disabled, isStart: isStart && hasRange, isEnd: isEnd && hasRange, isSingle: isStart && !hasRange, inRange }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
  })

  const dayCells: (string | null)[] = []
  for (let i = 0; i < firstDay; i++) dayCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    dayCells.push(iso)
  }

  const hasRange = dateRange && dateRange.startDate !== dateRange.endDate

  return (
    <div className="relative mb-4" ref={ref}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setOpen(!open)
            if (!open && dateRange) {
              const d = new Date(dateRange.startDate + 'T00:00:00')
              setViewYear(d.getFullYear())
              setViewMonth(d.getMonth())
            }
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cream-dark bg-white text-sm text-charcoal hover:border-sage/50 transition-colors"
        >
          <CalendarDays className="w-4 h-4 text-charcoal-light" />
          {hasRange ? (
            <span>
              {formatDisplay(dateRange.startDate)} — {formatDisplay(dateRange.endDate)}
            </span>
          ) : (
            <span className="text-charcoal-light">Select trip dates</span>
          )}
        </button>
        {dateRange && (
          <button
            onClick={() => {
              onDateRangeChange(null)
              setSelectingEnd(false)
              setOpen(false)
            }}
            className="flex items-center gap-1 text-xs text-charcoal-light hover:text-charcoal transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 z-20 bg-white rounded-2xl shadow-lg border border-cream-dark p-4 sm:w-[320px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-cream-dark text-charcoal-light hover:text-charcoal transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-charcoal">{monthLabel}</span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-cream-dark text-charcoal-light hover:text-charcoal transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hint */}
          <p className="text-[11px] text-charcoal-light text-center mb-2">
            {selectingEnd && dateRange ? 'Select end date' : 'Select start date'}
          </p>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-[10px] font-medium text-charcoal-light text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0">
            {dayCells.map((iso, i) => {
              if (!iso) {
                return <div key={`empty-${i}`} className="h-9" />
              }
              const day = new Date(iso + 'T00:00:00').getDate()
              const { disabled, isStart, isEnd, isSingle, inRange } = getDayState(iso)

              // Outer wrapper: carries the range band background
              let wrapperBg = ''
              if (isStart) wrapperBg = 'bg-gradient-to-r from-transparent from-50% to-sage/15 to-50%'
              else if (isEnd) wrapperBg = 'bg-gradient-to-l from-transparent from-50% to-sage/15 to-50%'
              else if (inRange) wrapperBg = 'bg-sage/15'

              // Inner circle: the actual clickable day
              let circleCls = 'text-charcoal hover:bg-cream-dark cursor-pointer'
              if (disabled) circleCls = 'text-charcoal/20 cursor-default'
              else if (isStart || isEnd || isSingle) circleCls = 'bg-sage text-white font-medium rounded-full'
              else if (inRange) circleCls = 'text-charcoal hover:bg-sage/25 cursor-pointer'
              else if (iso === todayStr) circleCls = 'font-semibold text-rust hover:bg-cream-dark cursor-pointer'

              return (
                <div key={iso} className={`h-9 flex items-center justify-center ${wrapperBg}`}>
                  <button
                    onClick={() => handleDayClick(iso)}
                    onMouseEnter={() => selectingEnd && setHoverDate(iso)}
                    onMouseLeave={() => setHoverDate(null)}
                    disabled={disabled}
                    className={`h-8 w-8 text-xs flex items-center justify-center transition-colors rounded-full ${circleCls}`}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
