"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface WeekSelectorProps {
  currentWeek: Date
  onPrevious: () => void
  onNext: () => void
}

export function WeekSelector({
  currentWeek,
  onPrevious,
  onNext,
}: WeekSelectorProps) {
  const getWeekRange = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)

    const end = new Date(start)
    end.setDate(start.getDate() + 4)

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const isCurrentWeek = () => {
    const now = new Date()
    const startOfWeek = new Date(currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return now >= startOfWeek && now <= endOfWeek
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevious}
        className="h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-accent hover:border-highlight/50 transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>

      <div className="px-3 py-1.5 rounded-md bg-muted min-w-[160px] text-center">
        <span className="text-sm font-medium text-foreground">
          {getWeekRange(currentWeek)}
        </span>
        {isCurrentWeek() && (
          <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-highlight">
            Current
          </span>
        )}
      </div>

      <button
        onClick={onNext}
        className="h-8 w-8 rounded-md border border-border bg-card flex items-center justify-center hover:bg-accent hover:border-highlight/50 transition-colors"
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>
    </div>
  )
}
