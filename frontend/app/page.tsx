"use client"

import { useState } from "react"
import { CalendarDays, BookOpen, Clock, TrendingUp, RefreshCw } from "lucide-react"
import { DaySelector } from "@/components/day-selector"
import { TimetableGrid } from "@/components/timetable-grid"
import { AttendanceCard } from "@/components/attendance-card"
import { StatsCard } from "@/components/stats-card"
import { ThemeToggle } from "@/components/theme-toggle"
import { WeekSelector } from "@/components/week-selector"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

const timetableData: Record<string, typeof mondaySchedule> = {
  Mon: [
    {
      id: "1",
      course: "Data Structures & Algorithms",
      code: "CS201",
      time: "09:00",
      duration: 2,
      room: "Room 301",
      type: "lecture" as const,
      attendance: "present" as const,
    },
    {
      id: "2",
      course: "Database Management Systems",
      code: "CS301",
      time: "14:00",
      duration: 2,
      room: "Lab 102",
      type: "lab" as const,
      attendance: "present" as const,
    },
  ],
  Tue: [
    {
      id: "3",
      course: "Operating Systems",
      code: "CS302",
      time: "10:00",
      duration: 1,
      room: "Room 405",
      type: "lecture" as const,
      attendance: "absent" as const,
    },
    {
      id: "4",
      course: "Computer Networks",
      code: "CS303",
      time: "13:00",
      duration: 2,
      room: "Room 201",
      type: "tutorial" as const,
      attendance: "present" as const,
    },
  ],
  Wed: [
    {
      id: "5",
      course: "Data Structures & Algorithms",
      code: "CS201",
      time: "08:00",
      duration: 2,
      room: "Lab 103",
      type: "lab" as const,
      attendance: "present" as const,
    },
    {
      id: "6",
      course: "Software Engineering",
      code: "CS304",
      time: "14:00",
      duration: 1,
      room: "Room 302",
      type: "lecture" as const,
      attendance: "present" as const,
    },
  ],
  Thu: [
    {
      id: "7",
      course: "Operating Systems",
      code: "CS302",
      time: "09:00",
      duration: 2,
      room: "Lab 101",
      type: "lab" as const,
      attendance: "pending" as const,
    },
    {
      id: "8",
      course: "Database Management Systems",
      code: "CS301",
      time: "15:00",
      duration: 1,
      room: "Room 403",
      type: "tutorial" as const,
      attendance: "pending" as const,
    },
  ],
  Fri: [
    {
      id: "9",
      course: "Computer Networks",
      code: "CS303",
      time: "10:00",
      duration: 2,
      room: "Room 201",
      type: "lecture" as const,
      attendance: "pending" as const,
    },
    {
      id: "10",
      course: "Software Engineering",
      code: "CS304",
      time: "14:00",
      duration: 2,
      room: "Lab 104",
      type: "lab" as const,
      attendance: "pending" as const,
    },
  ],
}

const mondaySchedule = timetableData.Mon

const attendanceData = [
  {
    course: "Data Structures & Algorithms",
    code: "CS201",
    attended: 22,
    total: 26,
    percentage: 85,
  },
  {
    course: "Database Management Systems",
    code: "CS301",
    attended: 18,
    total: 24,
    percentage: 75,
  },
  {
    course: "Operating Systems",
    code: "CS302",
    attended: 14,
    total: 22,
    percentage: 64,
  },
  {
    course: "Computer Networks",
    code: "CS303",
    attended: 19,
    total: 20,
    percentage: 95,
  },
  {
    course: "Software Engineering",
    code: "CS304",
    attended: 15,
    total: 18,
    percentage: 83,
  },
]

export default function AttendancePortal() {
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const overallAttendance = Math.round(
    attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) /
      attendanceData.length
  )

  const totalClasses = attendanceData.reduce((acc, curr) => acc + curr.total, 0)
  const attendedClasses = attendanceData.reduce(
    (acc, curr) => acc + curr.attended,
    0
  )

  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 7)
      return newDate
    })
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Attendance Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {todayDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center">
                <span className="text-xs font-medium text-highlight-light">
                  JD
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              label="Overall Attendance"
              value={`${overallAttendance}%`}
              sublabel="Across all courses"
              highlight
            />
            <StatsCard
              label="Classes Attended"
              value={attendedClasses}
              sublabel={`of ${totalClasses} total`}
            />
            <StatsCard
              label="Active Courses"
              value={attendanceData.length}
              sublabel="This semester"
            />
            <StatsCard
              label="Classes Today"
              value={timetableData[selectedDay]?.length || 0}
              sublabel="Scheduled"
            />
          </div>
        </section>

        {/* Timetable Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-highlight flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-highlight-light" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">
                    Weekly Timetable
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your class schedule
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-highlight transition-colors px-3 py-1.5 rounded-md border border-border hover:border-highlight/50">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <WeekSelector
                currentWeek={currentWeek}
                onPrevious={goToPreviousWeek}
                onNext={goToNextWeek}
              />
            </div>
            <div className="flex justify-center sm:justify-start">
              <DaySelector
                days={days}
                selectedDay={selectedDay}
                onSelect={setSelectedDay}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            {timetableData[selectedDay]?.length > 0 ? (
              <TimetableGrid
                entries={timetableData[selectedDay]}
                selectedDay={selectedDay}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No classes scheduled for {selectedDay}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Attendance Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-highlight flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-highlight-light" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  Course Attendance
                </h2>
                <p className="text-xs text-muted-foreground">
                  Track your progress
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-highlight transition-colors px-3 py-1.5 rounded-md border border-border hover:border-highlight/50">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attendanceData.map((course) => (
              <AttendanceCard key={course.code} {...course} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p className="font-mono uppercase tracking-wider">
              Attendance Portal <span className="text-highlight">•</span> Spring 2026
            </p>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-highlight" />
              <span>Last synced: Today, 09:15 AM</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
