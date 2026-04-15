"use client"

import { cn } from "@/lib/utils"

interface TimetableEntry {
  id: string
  course: string
  code: string
  time: string
  duration: number // in hours
  room: string
  type: "lecture" | "lab" | "tutorial"
  attendance?: "present" | "absent" | "pending"
}

interface TimetableGridProps {
  entries: TimetableEntry[]
  selectedDay: string
}

const timeSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
]

export function TimetableGrid({ entries, selectedDay }: TimetableGridProps) {
  const getTimeIndex = (time: string) => {
    return timeSlots.findIndex((slot) => slot === time)
  }

  return (
    <div className="w-full">
      {/* Time labels */}
      <div className="flex border-b border-border pb-3 mb-4">
        {timeSlots.map((time) => (
          <div
            key={time}
            className="flex-1 text-xs font-mono text-muted-foreground uppercase tracking-wider"
          >
            {time}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="relative min-h-[200px]">
        {/* Background grid lines */}
        <div className="absolute inset-0 flex">
          {timeSlots.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 border-l border-border/50 first:border-l-0",
                index % 2 === 0 && "bg-muted/30"
              )}
            />
          ))}
        </div>

        {/* Entries */}
        <div className="relative">
          {entries.map((entry) => {
            const startIndex = getTimeIndex(entry.time)
            if (startIndex === -1) return null

            const leftPercent = (startIndex / timeSlots.length) * 100
            const widthPercent = (entry.duration / timeSlots.length) * 100

            return (
              <div
                key={entry.id}
                className="absolute top-0 h-[180px] p-1"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <div className="h-full rounded-md border border-border bg-card p-3 flex flex-col justify-between hover:border-highlight/50 hover:bg-muted/50 transition-colors cursor-pointer group relative overflow-hidden">
                  {/* Attendance indicator strip */}
                  {entry.attendance && (
                    <div
                      className={cn(
                        "absolute top-0 left-0 w-full h-1",
                        entry.attendance === "present" && "bg-green-500",
                        entry.attendance === "absent" && "bg-destructive",
                        entry.attendance === "pending" && "bg-amber-500"
                      )}
                    />
                  )}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm text-foreground leading-tight group-hover:text-highlight transition-colors">
                        {entry.course}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {entry.attendance && (
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              entry.attendance === "present" && "bg-green-500",
                              entry.attendance === "absent" && "bg-destructive",
                              entry.attendance === "pending" && "bg-amber-500"
                            )}
                            title={entry.attendance === "present" ? "Present" : entry.attendance === "absent" ? "Absent" : "Pending"}
                          />
                        )}
                        <span
                          className={cn(
                            "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 border rounded",
                            entry.type === "lecture" &&
                              "text-foreground border-border",
                            entry.type === "lab" && "text-highlight border-highlight/50",
                            entry.type === "tutorial" &&
                              "text-muted-foreground border-muted"
                          )}
                        >
                          {entry.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {entry.code}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      {entry.time} • {entry.duration}h
                    </p>
                    <p className="text-[11px] text-foreground font-medium">
                      {entry.room}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
