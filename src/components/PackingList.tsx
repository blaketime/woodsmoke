import { useState } from 'react'
import { Tent, Shirt, UtensilsCrossed, Compass, Package, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PackingItem, PackingCategory } from '../lib/types'

interface PackingListProps {
  items: PackingItem[]
  onToggle: (id: string) => void
}

const CATEGORY_ORDER: PackingCategory[] = [
  'shelter_sleep', 'clothing', 'cooking_food', 'safety_navigation', 'extras',
]

const CATEGORIES: Record<PackingCategory, { label: string; icon: LucideIcon }> = {
  shelter_sleep:     { label: 'Shelter & Sleep',     icon: Tent },
  clothing:          { label: 'Clothing',            icon: Shirt },
  cooking_food:      { label: 'Cooking & Food',      icon: UtensilsCrossed },
  safety_navigation: { label: 'Safety & Navigation', icon: Compass },
  extras:            { label: 'Extras',              icon: Package },
}

export default function PackingList({ items, onToggle }: PackingListProps) {
  const [collapsed, setCollapsed] = useState<Set<PackingCategory>>(new Set(CATEGORY_ORDER))

  const toggleCollapse = (cat: PackingCategory) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  // Group items by category
  const grouped = new Map<PackingCategory, PackingItem[]>()
  for (const item of items) {
    const list = grouped.get(item.category) ?? []
    list.push(item)
    grouped.set(item.category, list)
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-charcoal-light">
            {checkedCount} / {totalCount} items packed
          </span>
          <span className="text-charcoal-light font-medium">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-cream-dark overflow-hidden">
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map(cat => {
        const catItems = grouped.get(cat)
        if (!catItems || catItems.length === 0) return null

        const { label, icon: Icon } = CATEGORIES[cat]
        const isCollapsed = collapsed.has(cat)
        const catChecked = catItems.filter(i => i.checked).length

        return (
          <div key={cat}>
            <button
              type="button"
              onClick={() => toggleCollapse(cat)}
              className="w-full flex items-center gap-2 py-2 px-1 rounded-lg hover:bg-sage/5 transition-colors"
            >
              <Icon className="w-4 h-4 text-sage" />
              <span className="font-medium text-charcoal text-sm">{label}</span>
              <span className="text-xs text-charcoal-light">
                ({catChecked}/{catItems.length})
              </span>
              <ChevronDown
                className={`w-4 h-4 text-charcoal-light ml-auto transition-transform duration-200 ${
                  isCollapsed ? '-rotate-90' : ''
                }`}
              />
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-200 ${
                isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-0.5 pt-1">
                  {catItems.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-sage/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => onToggle(item.id)}
                        className="mt-0.5 w-4 h-4 rounded accent-sage flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className={`text-sm transition-all duration-200 ${
                            item.checked ? 'line-through text-charcoal-light' : 'text-charcoal'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.reason && (
                          <p className="text-xs text-charcoal-light italic mt-0.5">{item.reason}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
