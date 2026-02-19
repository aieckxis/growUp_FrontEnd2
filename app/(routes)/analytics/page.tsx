"use client"

import React, { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  Fish,
  Droplets,
  Download,
  Calendar,
  Filter,
  Home,
  Camera,
  Settings,
  BarChart3,
  Clock,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* TYPES */

type SensorKey =
  | "waterTemp"
  | "ph"
  | "dissolvedO2"
  | "airTemp"
  | "lightIntensity"
  | "waterLevel"
  | "waterFlow"
  | "humidity"
  | "ammonia"
  | "airPressure"

type SensorState = Record<SensorKey, boolean>

type SensorTrendRow = { time: string } & Record<SensorKey, number>

type GrowthRow = { day: string; height: number; leaves: number; health: number }

/* MOCK DATA */

const WEEKLY_GROWTH_DATA: GrowthRow[] = [
  // Week 1 (Current Week - for context)
  { day: "W1 Mon", height: 12.5, leaves: 8, health: 92 },
  { day: "W1 Tue", height: 13.2, leaves: 9, health: 94 },
  { day: "W1 Wed", height: 14.1, leaves: 10, health: 95 },
  { day: "W1 Thu", height: 15.3, leaves: 11, health: 96 },
  { day: "W1 Fri", height: 16.8, leaves: 12, health: 97 },
  { day: "W1 Sat", height: 18.2, leaves: 13, health: 98 },
  { day: "W1 Sun", height: 19.5, leaves: 14, health: 99 },
  // Week 2 (Mock Previous Week)
  { day: "W2 Mon", height: 20.0, leaves: 15, health: 99 },
  { day: "W2 Tue", height: 20.5, leaves: 16, health: 99 },
  { day: "W2 Wed", height: 21.1, leaves: 17, health: 98 },
  { day: "W2 Thu", height: 21.6, leaves: 18, health: 97 },
  { day: "W2 Fri", height: 22.3, leaves: 19, health: 97 },
  { day: "W2 Sat", height: 23.0, leaves: 20, health: 98 },
  { day: "W2 Sun", height: 23.5, leaves: 21, health: 99 },
]

const SENSOR_TREND_DATA: SensorTrendRow[] = [
  {
    time: "00:00",
    waterTemp: 22.5,
    ph: 6.8,
    dissolvedO2: 8.2,
    airTemp: 24.0,
    lightIntensity: 0,
    waterLevel: 85,
    waterFlow: 12,
    humidity: 65,
    ammonia: 0.02,
    airPressure: 1012.5,
  },
  {
    time: "01:00",
    waterTemp: 22.3,
    ph: 6.8,
    dissolvedO2: 8.3,
    airTemp: 23.5,
    lightIntensity: 0,
    waterLevel: 84,
    waterFlow: 12,
    humidity: 67,
    ammonia: 0.02,
    airPressure: 1013.0,
  },
  {
    time: "02:00",
    waterTemp: 22.1,
    ph: 6.9,
    dissolvedO2: 8.4,
    airTemp: 23.0,
    lightIntensity: 0,
    waterLevel: 84,
    waterFlow: 12,
    humidity: 68,
    ammonia: 0.01,
    airPressure: 1013.5,
  },
  {
    time: "03:00",
    waterTemp: 22.2,
    ph: 6.9,
    dissolvedO2: 8.5,
    airTemp: 23.0,
    lightIntensity: 0,
    waterLevel: 84,
    waterFlow: 12,
    humidity: 68,
    ammonia: 0.01,
    airPressure: 1014.1,
  },
  {
    time: "04:00",
    waterTemp: 22.2,
    ph: 6.9,
    dissolvedO2: 8.5,
    airTemp: 23.0,
    lightIntensity: 0,
    waterLevel: 84,
    waterFlow: 12,
    humidity: 68,
    ammonia: 0.01,
    airPressure: 1014.1,
  },
  {
    time: "05:00",
    waterTemp: 22.3,
    ph: 6.9,
    dissolvedO2: 8.4,
    airTemp: 23.5,
    lightIntensity: 0,
    waterLevel: 83,
    waterFlow: 12,
    humidity: 67,
    ammonia: 0.02,
    airPressure: 1014.5,
  },
  {
    time: "06:00",
    waterTemp: 22.6,
    ph: 7.0,
    dissolvedO2: 8.3,
    airTemp: 24.5,
    lightIntensity: 150,
    waterLevel: 83,
    waterFlow: 13,
    humidity: 65,
    ammonia: 0.02,
    airPressure: 1015.0,
  },
  {
    time: "07:00",
    waterTemp: 22.9,
    ph: 7.0,
    dissolvedO2: 8.2,
    airTemp: 25.5,
    lightIntensity: 300,
    waterLevel: 83,
    waterFlow: 13,
    humidity: 63,
    ammonia: 0.02,
    airPressure: 1015.2,
  },
  {
    time: "08:00",
    waterTemp: 23.1,
    ph: 7.0,
    dissolvedO2: 8.1,
    airTemp: 26.0,
    lightIntensity: 450,
    waterLevel: 83,
    waterFlow: 13,
    humidity: 62,
    ammonia: 0.02,
    airPressure: 1015.3,
  },
  {
    time: "09:00",
    waterTemp: 23.5,
    ph: 7.0,
    dissolvedO2: 8.0,
    airTemp: 27.0,
    lightIntensity: 600,
    waterLevel: 82,
    waterFlow: 13,
    humidity: 60,
    ammonia: 0.02,
    airPressure: 1015.1,
  },
  {
    time: "10:00",
    waterTemp: 23.9,
    ph: 7.1,
    dissolvedO2: 7.9,
    airTemp: 28.0,
    lightIntensity: 750,
    waterLevel: 82,
    waterFlow: 13,
    humidity: 59,
    ammonia: 0.03,
    airPressure: 1014.5,
  },
  {
    time: "11:00",
    waterTemp: 24.2,
    ph: 7.1,
    dissolvedO2: 7.8,
    airTemp: 28.5,
    lightIntensity: 800,
    waterLevel: 82,
    waterFlow: 13,
    humidity: 58,
    ammonia: 0.03,
    airPressure: 1014.0,
  },
  {
    time: "12:00",
    waterTemp: 24.5,
    ph: 7.1,
    dissolvedO2: 7.8,
    airTemp: 29.0,
    lightIntensity: 850,
    waterLevel: 82,
    waterFlow: 13,
    humidity: 58,
    ammonia: 0.03,
    airPressure: 1013.8,
  },
  {
    time: "13:00",
    waterTemp: 24.8,
    ph: 7.1,
    dissolvedO2: 7.7,
    airTemp: 29.5,
    lightIntensity: 800,
    waterLevel: 81,
    waterFlow: 12,
    humidity: 57,
    ammonia: 0.03,
    airPressure: 1013.0,
  },
  {
    time: "14:00",
    waterTemp: 25.0,
    ph: 7.1,
    dissolvedO2: 7.6,
    airTemp: 29.2,
    lightIntensity: 750,
    waterLevel: 81,
    waterFlow: 12,
    humidity: 58,
    ammonia: 0.03,
    airPressure: 1012.5,
  },
  {
    time: "15:00",
    waterTemp: 24.9,
    ph: 7.0,
    dissolvedO2: 7.6,
    airTemp: 28.5,
    lightIntensity: 680,
    waterLevel: 81,
    waterFlow: 12,
    humidity: 59,
    ammonia: 0.03,
    airPressure: 1011.8,
  },
  {
    time: "16:00",
    waterTemp: 24.8,
    ph: 7.0,
    dissolvedO2: 7.6,
    airTemp: 28.0,
    lightIntensity: 620,
    waterLevel: 81,
    waterFlow: 12,
    humidity: 60,
    ammonia: 0.02,
    airPressure: 1011.0,
  },
  {
    time: "17:00",
    waterTemp: 24.5,
    ph: 7.0,
    dissolvedO2: 7.7,
    airTemp: 27.0,
    lightIntensity: 500,
    waterLevel: 81,
    waterFlow: 12,
    humidity: 62,
    ammonia: 0.02,
    airPressure: 1011.0,
  },
  {
    time: "18:00",
    waterTemp: 24.1,
    ph: 6.9,
    dissolvedO2: 7.8,
    airTemp: 26.0,
    lightIntensity: 300,
    waterLevel: 82,
    waterFlow: 12,
    humidity: 63,
    ammonia: 0.02,
    airPressure: 1011.5,
  },
  {
    time: "19:00",
    waterTemp: 23.8,
    ph: 6.9,
    dissolvedO2: 7.9,
    airTemp: 25.5,
    lightIntensity: 200,
    waterLevel: 82,
    waterFlow: 12,
    humidity: 64,
    ammonia: 0.02,
    airPressure: 1012.0,
  },
  {
    time: "20:00",
    waterTemp: 23.5,
    ph: 6.9,
    dissolvedO2: 8.0,
    airTemp: 25.0,
    lightIntensity: 120,
    waterLevel: 82,
    waterFlow: 12,
    humidity: 64,
    ammonia: 0.02,
    airPressure: 1012.2,
  },
  {
    time: "21:00",
    waterTemp: 23.2,
    ph: 6.8,
    dissolvedO2: 8.1,
    airTemp: 24.5,
    lightIntensity: 50,
    waterLevel: 83,
    waterFlow: 12,
    humidity: 65,
    ammonia: 0.02,
    airPressure: 1012.5,
  },
  {
    time: "22:00",
    waterTemp: 22.9,
    ph: 6.8,
    dissolvedO2: 8.1,
    airTemp: 24.2,
    lightIntensity: 0,
    waterLevel: 84,
    waterFlow: 12,
    humidity: 65,
    ammonia: 0.02,
    airPressure: 1012.8,
  },
  {
    time: "23:00",
    waterTemp: 22.7,
    ph: 6.8,
    dissolvedO2: 8.2,
    airTemp: 24.1,
    lightIntensity: 0,
    waterLevel: 85,
    waterFlow: 12,
    humidity: 65,
    ammonia: 0.02,
    airPressure: 1012.5,
  },
]

/* SENSOR CONFIGURATION (Global, detailed version) */
const sensorConfig: {
  key: SensorKey
  name: string
  color: string
  unit: string
  format: (val: number) => string
}[] = [
  {
    key: "waterTemp",
    name: "Water Temp (DS18B20)",
    color: "#3b82f6",
    unit: "°C",
    format: (v) => v.toFixed(1),
  },
  {
    key: "ph",
    name: "pH Level (PH4502C)",
    color: "#8b5cf6",
    unit: "",
    format: (v) => v.toFixed(1),
  },
  {
    key: "dissolvedO2",
    name: "Dissolved O₂ (DO Sensor)",
    color: "#10b981",
    unit: "mg/L",
    format: (v) => v.toFixed(1),
  },
  {
    key: "airTemp",
    name: "Air Temp (BME280)",
    color: "#f59e0b",
    unit: "°C",
    format: (v) => v.toFixed(0),
  },
  {
    key: "lightIntensity",
    name: "Light (BH1750)",
    color: "#eab308",
    unit: "lux",
    format: (v) => v.toFixed(0),
  },
  {
    key: "humidity",
    name: "Humidity (BME280)",
    color: "#14b8a6",
    unit: "%",
    format: (v) => v.toFixed(0),
  },
  {
    key: "airPressure",
    name: "Air Pressure (BME280)",
    color: "#ef4444",
    unit: "hPa",
    format: (v) => v.toFixed(1),
  },
  {
    key: "waterLevel",
    name: "Water Level (HC SR04)",
    color: "#06b6d4",
    unit: "%",
    format: (v) => v.toFixed(0),
  },
  {
    key: "waterFlow",
    name: "Flow Rate (YF-S201)",
    color: "#6366f1",
    unit: "L/min",
    format: (v) => v.toFixed(0),
  },
  {
    key: "ammonia",
    name: "Ammonia (MQ137)",
    color: "#f97316",
    unit: "ppm",
    format: (v) => v.toFixed(2),
  },
]

/* UTILITY FUNCTIONS */

const formatDate = () => {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

/* HELPER: Water Quality Calculation */
const calculateWaterQuality = (data: {
  waterTemp: number
  ph: number
  dissolvedO2: number
  ammonia: number
}): number => {
  let score = 100

  // pH check (ideal: 6.5-7.5)
  if (data.ph < 6.5 || data.ph > 7.5) score -= 20
  else if (data.ph < 6.7 || data.ph > 7.3) score -= 10

  // DO2 check (ideal: 5-8 mg/L)
  if (data.dissolvedO2 < 5 || data.dissolvedO2 > 8) score -= 20
  else if (data.dissolvedO2 < 6 || data.dissolvedO2 > 7.5) score -= 10

  // Ammonia check (ideal: < 0.5 ppm)
  if (data.ammonia > 1.0) score -= 30
  else if (data.ammonia > 0.5) score -= 15

  // Temperature check (ideal: 20-26°C)
  if (data.waterTemp < 20 || data.waterTemp > 26) score -= 15
  else if (data.waterTemp < 21 || data.waterTemp > 25) score -= 5

  return Math.max(0, Math.min(100, score))
}

/* NAVIGATION COMPONENTS (Local definitions) */

// Navbar now shows connection status
const Navbar: React.FC<{ time: string; isConnected: boolean }> = ({ time, isConnected }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900">GROWUP</span>
    <div className="flex items-center gap-2">
      {isConnected ? (
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      ) : (
        <WifiOff className="w-3 h-3 text-red-500" />
      )}
      <span className="text-xs text-gray-600">{time}</span>
    </div>
  </div>
)

const BottomNavigation = () => {
  const pathname = usePathname()
  const tabs = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "camera", label: "Camera", href: "/camera", icon: Camera },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-3">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* SENSOR READINGS TABLE */

// Accepts latestData (SensorTrendRow) and displays values.
// If latestData is missing, falls back to the first mock sample.
const SensorReadingsTable: React.FC<{ latestData?: SensorTrendRow; currentTime: Date; isConnected: boolean }> = ({
  latestData,
  currentTime,
  isConnected,
}) => {
  const displayConfig = sensorConfig
  const fallback = SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1]

  const dataForDisplay = latestData ?? fallback

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-500" />
        Live Sensor Readings
        <span className="text-xs font-normal text-gray-500 ml-auto flex items-center gap-2">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              @ {currentTime.toLocaleTimeString()}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Offline
            </span>
          )}
        </span>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {displayConfig.map((sensor) => (
          <div
            key={sensor.key}
            className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <span className="text-xs font-medium text-gray-700">{sensor.name.split("(")[0].trim()}</span>
            <span className="text-sm font-bold" style={{ color: sensor.color }}>
              {sensor.format((dataForDisplay as any)[sensor.key] ?? 0)} {sensor.unit}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {isConnected ? "Real-time data from Raspberry Pi • Updates every 5s" : "⚠️ Connection lost. Showing last known values."}
      </p>
    </div>
  )
}

/* Placeholder content component */
const PlaceholderContent: React.FC<{ title: string; subtitle: string; icon: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="p-8 text-center min-h-[70vh] flex flex-col items-center justify-center">
    {icon}
    <h2 className="text-3xl font-bold text-gray-800 mt-4 mb-2">{title}</h2>
    <p className="text-gray-500">{subtitle}</p>
  </div>
)

/* AnalyticsContent (kept for future) */
const AnalyticsContent: React.FC<any> = () => {
  return <div className="space-y-5">{/* left as-is for now */}</div>
}

/* MAIN COMPONENT */
export default function Analytics() {
  // View control
  const [view, setView] = useState("analytics")

  const [selectedSensors, setSelectedSensors] = useState<SensorState>({
    waterTemp: true,
    ph: true,
    dissolvedO2: true,
    airTemp: false,
    lightIntensity: false,
    waterLevel: false,
    waterFlow: false,
    humidity: false,
    ammonia: false,
    airPressure: false,
  } as SensorState)

  const [selectedRange, setSelectedRange] = useState("thisWeek")
  const [showGrowthFilters, setShowGrowthFilters] = useState(false)
  const [showSensorFilters, setShowSensorFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sensorExportRange, setSensorExportRange] = useState("24h")

  // Custom range dates
  const [customGrowthStartDate, setCustomGrowthStartDate] = useState(formatDate())
  const [customGrowthEndDate, setCustomGrowthEndDate] = useState(formatDate())
  const [customSensorStartDate, setCustomSensorStartDate] = useState(formatDate())
  const [customSensorEndDate, setCustomSensorEndDate] = useState(formatDate())
  const [dateWarning, setDateWarning] = useState("")

  // Live sensor storage (session-only): keep last N samples
  const MAX_SAMPLES = 200
  const [liveSensorData, setLiveSensorData] = useState<SensorTrendRow[]>([])
  // Latest reading (convenience for health metrics)
  const [latestReading, setLatestReading] = useState<SensorTrendRow | undefined>(undefined)
  const [isRaspiConnected, setIsRaspiConnected] = useState<boolean>(true)

  // Helper: days difference
  const getDaysDifference = (start: string, end: string) => {
    const oneDay = 24 * 60 * 60 * 1000
    const firstDate = new Date(start)
    const secondDate = new Date(end)
    return Math.abs(Math.round((firstDate.getTime() - secondDate.getTime()) / oneDay))
  }

  // Consolidated date handler
  const handleDateChange = (type: "growth" | "sensor", key: "start" | "end", value: string) => {
    let start: string, end: string
    if (type === "growth") {
      if (key === "start") {
        start = value
        end = customGrowthEndDate
        setCustomGrowthStartDate(value)
      } else {
        start = customGrowthStartDate
        end = value
        setCustomGrowthEndDate(value)
      }
    } else {
      if (key === "start") {
        start = value
        end = customSensorEndDate
        setCustomSensorStartDate(value)
      } else {
        start = customSensorStartDate
        end = value
        setCustomSensorEndDate(value)
      }
    }

    let currentWarning = ""
    if (new Date(start) > new Date(end)) {
      currentWarning = "Start date cannot be after the end date."
    }
    setDateWarning(currentWarning)
  }

  // Filtered growth data
  const filteredGrowthData = (() => {
    if (selectedRange === "customGrowth") {
      return WEEKLY_GROWTH_DATA.slice(3)
    }

    switch (selectedRange) {
      case "lastWeek":
        return WEEKLY_GROWTH_DATA.slice(0, 7)
      case "twoWeeks":
        return WEEKLY_GROWTH_DATA.slice(0, 14)
      case "thisWeek":
        return WEEKLY_GROWTH_DATA.slice(7, 14)
      default:
        return WEEKLY_GROWTH_DATA
    }
  })()

  const lastGrowth = filteredGrowthData[filteredGrowthData.length - 1]
  const activeCount = Object.values(selectedSensors).filter(Boolean).length

  const applyCustomDateFilter = (type: "growth" | "sensor") => {
    if (dateWarning) return
    if (type === "growth") {
      setSelectedRange("")
      setTimeout(() => setSelectedRange("customGrowth"), 0)
    } else {
      setSensorExportRange("")
      setTimeout(() => setSensorExportRange("custom"), 0)
    }
  }

  /* EXPORT: Plant Growth CSV */
  const exportGrowthDataCSV = () => {
    const mockBaseDate = new Date(new Date().setDate(new Date().getDate() - filteredGrowthData.length))

    const filename = `plant_growth_${selectedRange}_${formatDate()}.csv`
    const headers = ["Date (Mock)", "Day", "Height (cm)", "Leaves", "Health (%)"]

    const rows = filteredGrowthData.map((d: GrowthRow, index) => {
      const mockDate = new Date(mockBaseDate)
      mockDate.setDate(mockBaseDate.getDate() + index)
      const dateString = mockDate.toISOString().split("T")[0]

      return [dateString, d.day, d.height, d.leaves, d.health]
    })
    downloadCSV(filename, headers, rows)
  }

  /* EXPORT: Sensor CSV (Only Selected) */
  const exportSensorDataCSV = () => {
    const activeKeys = Object.entries(selectedSensors)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key as SensorKey)

    const filename = `sensor_data_${sensorExportRange}_${formatDate()}.csv`

    const timeHeader =
      sensorExportRange === "7d" ? "Day & Time (168 Total Readings)" : sensorExportRange === "48h" ? "Day & Time (48 Total Readings)" : "Time (24H)"

    const headers = [
      timeHeader,
      ...activeKeys.map((k) => {
        const config = sensorConfig.find((s) => s.key === k)
        return config ? `${config.name.split("(")[0].trim()} (${config.unit})` : k
      }),
    ]

    const rows = filteredSensorData.map((entry: SensorTrendRow) => [entry.time, ...activeKeys.map((key: SensorKey) => entry[key])])

    downloadCSV(filename, headers, rows)
  }

  /* EXPORT: All Data Combined */
  const exportAllData = () => {
    const filename = `complete_analytics_${formatDate()}.csv`

    const headers = ["Type", "Day/Time", "Value1", "Value2", "Value3", "Value4"]

    const growthRows = filteredGrowthData.map((d: GrowthRow) => [
      "Growth",
      d.day,
      `Height: ${d.height}cm`,
      `Leaves: ${d.leaves}`,
      `Health: ${d.health}%`,
      "",
    ])

    const sensorRows = filteredSensorData.map((d: SensorTrendRow) => [
      "Sensor",
      d.time,
      `Water: ${d.waterTemp}°C`,
      `pH: ${d.ph}`,
      `DO2: ${d.dissolvedO2}`,
      `Light: ${d.lightIntensity}lux`,
    ])
    downloadCSV(filename, headers, [...growthRows, [""], ...sensorRows])
  }

  /* Sensor Configuration (Local handlers & array for buttons) */
  const localSensorConfig: { key: SensorKey; name: string; color: string }[] = [
    { key: "waterTemp", name: "Water Temp", color: "#3b82f6" },
    { key: "ph", name: "pH Level", color: "#8b5cf6" },
    { key: "dissolvedO2", name: "Dissolved O₂", color: "#10b981" },
    { key: "airTemp", name: "Air Temp", color: "#f59e0b" },
    { key: "lightIntensity", name: "Light", color: "#eab308" },
    { key: "waterLevel", name: "Water Level", color: "#06b6d4" },
    { key: "waterFlow", name: "Flow Rate", color: "#6366f1" },
    { key: "humidity", name: "Humidity", color: "#14b8a6" },
    { key: "ammonia", name: "Ammonia", color: "#f97316" },
    { key: "airPressure", name: "Air Pressure", color: "#ef4444" },
  ]

  const toggleSensor = (key: SensorKey) => {
    setSelectedSensors((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllSensors = () => {
    const allTrue = Object.keys(selectedSensors).reduce(
      (acc, key) => ({
        ...acc,
        [key]: true,
      }),
      {} as SensorState
    )
    setSelectedSensors(allTrue)
  }

  const deselectAllSensors = () => {
    const allFalse = Object.keys(selectedSensors).reduce(
      (acc, key) => ({
        ...acc,
        [key]: false,
      }),
      {} as SensorState
    )
    setSelectedSensors(allFalse)
  }

  // Update current time locally
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  /* ---- LIVE SENSOR FETCH ----
     - Uses your Next.js API proxy at /api/sensors
     - Appends one new sample per fetch to liveSensorData
     - Keeps a rolling window of MAX_SAMPLES
     - Updates latestReading and isRaspiConnected
  */
  useEffect(() => {
    let mounted = true

    const fetchSensorData = async () => {
      try {
        const res = await fetch("/api/sensors", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()

        if (!json || json.status !== "success" || !json.data) {
          // Mark disconnected but keep previous data
          if (mounted) setIsRaspiConnected(false)
          return
        }

        const d = json.data

        const newPoint: SensorTrendRow = {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          waterTemp: d.waterTemp ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].waterTemp,
          ph: d.ph ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ph,
          dissolvedO2: d.dissolvedO2 ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].dissolvedO2,
          airTemp: d.airTemp ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].airTemp,
          lightIntensity: d.lightIntensity ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].lightIntensity,
          waterLevel: d.waterLevel ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].waterLevel,
          waterFlow: d.waterFlow ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].waterFlow,
          humidity: d.humidity ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].humidity,
          ammonia: d.ammonia ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ammonia,
          airPressure: d.airPressure ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].airPressure,
        }

        if (!mounted) return

        setIsRaspiConnected(true)
        setLatestReading(newPoint)
        setLiveSensorData((prev) => {
          const updated = [...prev, newPoint]
          // keep only last MAX_SAMPLES
          return updated.slice(-MAX_SAMPLES)
        })
      } catch (err) {
        console.error("❌ Failed to fetch sensor data:", err)
        if (mounted) setIsRaspiConnected(false)
      }
    }

    // initial fetch
    fetchSensorData()
    const interval = setInterval(fetchSensorData, 5000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // filteredSensorData used by chart and exports:
  const filteredSensorData = (() => {
    // If live data present and user asked for 24h view, use live
    if (liveSensorData.length > 0 && sensorExportRange === "24h") {
      return liveSensorData.slice(-24)
    }

    // fallback/mocked behavior similar to your original implementation
    switch (sensorExportRange) {
      case "48h": {
        const full48 = [...SENSOR_TREND_DATA, ...SENSOR_TREND_DATA]
        return full48.map((entry, idx) => ({ ...entry, time: `Day ${Math.floor(idx / 24) + 1} - ${entry.time}` }))
      }
      case "7d": {
        const full7 = Array(7).fill(SENSOR_TREND_DATA).flat()
        return full7.map((entry, idx) => ({ ...entry, time: `Day ${Math.floor(idx / 24) + 1} - ${entry.time}` }))
      }
      case "custom":
        return SENSOR_TREND_DATA.slice(12)
      case "24h":
      default:
        return SENSOR_TREND_DATA
    }
  })()

  /* RENDER */
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <Navbar time={currentTime.toLocaleTimeString()} isConnected={isRaspiConnected} />

      <div className="px-4 py-5 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your aquaponics system performance</p>
        </div>

        {/* 1. Live Sensor Readings Table */}
        <SensorReadingsTable latestData={latestReading ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1]} currentTime={currentTime} isConnected={isRaspiConnected} />

        <div className="space-y-5">
          {/* EXPORT ALL BUTTON */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Export Complete Analytics</h3>
                <p className="text-xs text-gray-600 mt-1">Download all growth and sensor data in one file</p>
              </div>
              <button
                onClick={exportAllData}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>

          {/* GROWTH CHART */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Weekly Plant Growth</h3>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGrowthFilters(!showGrowthFilters)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {showGrowthFilters ? "Hide" : "Filters"}
                </button>

                <button
                  onClick={exportGrowthDataCSV}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              </div>
            </div>

            {/* Filter Dropdown */}
            {showGrowthFilters && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Time Period
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={selectedRange}
                  onChange={(e) => setSelectedRange(e.target.value)}
                >
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="twoWeeks">Last 2 Weeks</option>
                  <option value="customGrowth">Custom Range</option>
                </select>
                {selectedRange === "customGrowth" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Select Date Range</p>

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customGrowthStartDate}
                        onChange={(e) => handleDateChange("growth", "start", e.target.value)}
                        className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="date"
                        value={customGrowthEndDate}
                        onChange={(e) => handleDateChange("growth", "end", e.target.value)}
                        className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    {dateWarning && <p className="text-xs text-red-600 font-medium mt-2">{dateWarning}</p>}

                    {/* BUTTON: Apply Filter */}
                    <button
                      onClick={() => applyCustomDateFilter("growth")}
                      className={`w-full py-1.5 mt-2 text-sm font-semibold rounded-md transition-colors ${
                        dateWarning ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                      }`}
                      disabled={!!dateWarning}
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredGrowthData}>
                  <defs>
                    <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                  />

                  <Area type="monotone" dataKey="height" stroke="#10b981" fillOpacity={1} fill="url(#colorHeight)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Growth Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600">Current Height</div>
                <div className="text-2xl font-bold text-emerald-600">{lastGrowth?.height ?? "—"}cm</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600">Weekly Growth</div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredGrowthData.length > 1 ? `+${(lastGrowth.height - filteredGrowthData[0].height).toFixed(1)}cm` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* SENSOR TRENDS */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-gray-900">24-Hour Sensor Trends</h3>

              <div className="flex gap-2"></div>
              <button
                onClick={() => setShowSensorFilters(!showSensorFilters)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium"
              >
                <Filter className="w-3.5 h-3.5" />
                {showSensorFilters ? "Hide" : "Filters"}
              </button>
              <button
                onClick={exportSensorDataCSV}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {showSensorFilters && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Time Period
                </label>

                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={sensorExportRange}
                  onChange={(e) => {
                    setSensorExportRange(e.target.value)
                    if (e.target.value !== "custom") {
                      setDateWarning("")
                    }
                  }}
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="48h">Last 48 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="custom">Custom Range</option>
                </select>

                {sensorExportRange === "custom" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Select Date Range</p>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customSensorStartDate}
                        onChange={(e) => handleDateChange("sensor", "start", e.target.value)}
                        className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="date"
                        value={customSensorEndDate}
                        onChange={(e) => handleDateChange("sensor", "end", e.target.value)}
                        className="w-1/2 p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    {dateWarning && <p className="text-xs text-red-600 font-medium mt-2">{dateWarning}</p>}
                    <button
                      onClick={() => applyCustomDateFilter("sensor")}
                      className={`w-full py-1.5 mt-2 text-sm font-semibold rounded-md transition-colors ${
                        dateWarning ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                      disabled={!!dateWarning}
                    >
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Select Buttons */}
            <div className="flex gap-2 mb-3">
              <button onClick={selectAllSensors} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">
                Select All
              </button>
              <button onClick={deselectAllSensors} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">
                Clear All
              </button>
              <span className="ml-auto text-xs text-gray-500 self-center">
                {activeCount} / {localSensorConfig.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {localSensorConfig.map((sensor) => {
                const active = selectedSensors[sensor.key]
                return (
                  <button
                    key={sensor.key}
                    onClick={() => toggleSensor(sensor.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active ? "bg-white text-gray-900 border-2 shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                    }`}
                    style={{ borderColor: active ? sensor.color : undefined }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: sensor.color }}></span>
                    {sensor.name}
                  </button>
                )
              })}
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredSensorData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                  <XAxis dataKey="time" stroke="#9ca3af" tick={{ fill: "#6b7280", fontSize: 11 }} interval={3} />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#6b7280", fontSize: 11 }} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      padding: "8px 12px",
                    }}
                  />

                  <Legend wrapperStyle={{ fontSize: "10px", paddingTop: 10 }} />

                  {localSensorConfig.map(
                    (sensor) =>
                      selectedSensors[sensor.key] && (
                        <Line
                          key={sensor.key}
                          type="monotone"
                          dataKey={sensor.key}
                          stroke={sensor.color}
                          strokeWidth={2.5}
                          dot={false}
                          name={sensor.name}
                          activeDot={{ r: 5 }}
                        />
                      )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* HEALTH METRICS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Fish className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Fish Health</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {((latestReading?.ammonia ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ammonia) < 0.5
                  ? "Excellent"
                  : (latestReading?.ammonia ?? 1) < 1.0
                  ? "Good"
                  : "Warning")}
              </div>
              <div className="text-xs text-gray-500 mt-2">Ammonia: {(latestReading?.ammonia ?? 0.02).toFixed(2)} ppm</div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full ${latestReading && latestReading.ammonia < 0.5 ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - (latestReading?.ammonia ?? 0.02)) * 100))}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Water Quality</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {calculateWaterQuality({
                  waterTemp: latestReading?.waterTemp ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].waterTemp,
                  ph: latestReading?.ph ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ph,
                  dissolvedO2: latestReading?.dissolvedO2 ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].dissolvedO2,
                  ammonia: latestReading?.ammonia ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ammonia,
                })}
                %
              </div>
              <div className="text-xs text-gray-500 mt-2">
                pH: {(latestReading?.ph ?? 6.8).toFixed(1)} • DO₂: {(latestReading?.dissolvedO2 ?? 7.8).toFixed(1)}mg/L
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${calculateWaterQuality({
                      waterTemp: latestReading?.waterTemp ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].waterTemp,
                      ph: latestReading?.ph ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ph,
                      dissolvedO2: latestReading?.dissolvedO2 ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].dissolvedO2,
                      ammonia: latestReading?.ammonia ?? SENSOR_TREND_DATA[SENSOR_TREND_DATA.length - 1].ammonia,
                    })}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
