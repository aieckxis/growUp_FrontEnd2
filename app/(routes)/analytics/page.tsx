"use client"

import React, { useState, useEffect } from "react"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend,
} from "recharts"
import {
  Fish, Droplets, Download, Calendar, Filter,
  Home, Camera, Settings, BarChart3, Clock, WifiOff,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* --- TYPES --- */

type SensorKey =
  | "waterTemp" | "ph" | "airTemp" | "lightIntensity"
  | "waterFlow" | "humidity" | "airPressure"

type SensorState = Record<SensorKey, boolean>
type SensorTrendRow = { time: string } & Record<SensorKey, number>
type GrowthRow = { day: string; height: number; leaves: number; health: number }

/* --- CONFIG --- */

const RASPI_API_BASE_URL = process.env.NEXT_PUBLIC_RASPI_API_URL || "http://192.168.210.142:8000"

/* --- SENSOR CONFIGURATION --- */

const sensorConfig: {
  key: SensorKey; name: string; color: string; unit: string; format: (val: number) => string
}[] = [
  { key: "waterTemp",      name: "Water Temp (DS18B20)",  color: "#3b82f6", unit: "°C",    format: (v) => v.toFixed(1) },
  { key: "ph",             name: "pH Level (PH4502C)",    color: "#8b5cf6", unit: "",       format: (v) => v.toFixed(1) },
  { key: "airTemp",        name: "Air Temp (BME280)",     color: "#f59e0b", unit: "°C",    format: (v) => v.toFixed(0) },
  { key: "lightIntensity", name: "Light (BH1750)",        color: "#eab308", unit: "lux",   format: (v) => v.toFixed(0) },
  { key: "humidity",       name: "Humidity (BME280)",     color: "#14b8a6", unit: "%",     format: (v) => v.toFixed(0) },
  { key: "airPressure",    name: "Air Pressure (BME280)", color: "#ef4444", unit: "hPa",   format: (v) => v.toFixed(1) },
  { key: "waterFlow",      name: "Flow Rate (YF-S201)",   color: "#6366f1", unit: "L/min", format: (v) => v.toFixed(0) },
]

/* --- API FUNCTIONS --- */

const fetchSensorHistoryAPI = async (range: string): Promise<SensorTrendRow[]> => {
  try {
    const res = await fetch(`${RASPI_API_BASE_URL}/analytics/sensors?range=${range}`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.data ?? []
  } catch (error) {
    console.error("❌ Failed to fetch sensor history:", error)
    return []
  }
}

const fetchGrowthHistoryAPI = async (range: string): Promise<GrowthRow[]> => {
  try {
    const res = await fetch(`${RASPI_API_BASE_URL}/analytics/growth?range=${range}`, {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "true" },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return json.data ?? []
  } catch (error) {
    console.error("❌ Failed to fetch growth history:", error)
    return []
  }
}

const fetchLatestSensorAPI = async (): Promise<SensorTrendRow | undefined> => {
  try {
    const res = await fetch("/api/sensors", { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (json.status !== "success" || !json.data) return undefined
    const d = json.data
    return {
      time:           new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      waterTemp:      d.waterTemp      ?? 0,
      ph:             d.ph             ?? 0,
      airTemp:        d.airTemp        ?? 0,
      lightIntensity: d.lightIntensity ?? 0,
      waterFlow:      d.waterFlow      ?? 0,
      humidity:       d.humidity       ?? 0,
      airPressure:    d.airPressure    ?? 0,
    }
  } catch (error) {
    console.error("❌ Failed to fetch latest sensor:", error)
    return undefined
  }
}

/* --- UTILITY FUNCTIONS --- */

const formatDate = () => new Date().toISOString().split("T")[0]

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

const calculateWaterQuality = (data: { waterTemp: number; ph: number }): number => {
  let score = 100
  if (data.ph < 6.5 || data.ph > 7.5) score -= 20
  else if (data.ph < 6.7 || data.ph > 7.3) score -= 10
  if (data.waterTemp < 20 || data.waterTemp > 26) score -= 15
  else if (data.waterTemp < 21 || data.waterTemp > 25) score -= 5
  return Math.max(0, Math.min(100, score))
}

/* --- NAVIGATION COMPONENTS --- */

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
    { id: "dashboard", label: "Home",      href: "/dashboard", icon: Home },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "camera",    label: "Camera",    href: "/camera",    icon: Camera },
    { id: "settings",  label: "Settings",  href: "/settings",  icon: Settings },
  ]
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-3">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link key={tab.id} href={tab.href} className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* --- LIVE SENSOR READINGS TABLE --- */

const SensorReadingsTable: React.FC<{ latestData?: SensorTrendRow; currentTime: Date; isConnected: boolean }> = ({
  latestData, currentTime, isConnected,
}) => (
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

    {!latestData ? (
      <div className="text-center py-6 text-gray-400 text-sm">
        No sensor data. Check Raspberry Pi connection.
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-3">
        {sensorConfig.map((sensor) => (
          <div key={sensor.key} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <span className="text-xs font-medium text-gray-700">{sensor.name.split("(")[0].trim()}</span>
            <span className="text-sm font-bold" style={{ color: sensor.color }}>
              {sensor.format((latestData as any)[sensor.key] ?? 0)} {sensor.unit}
            </span>
          </div>
        ))}
      </div>
    )}

    <p className="text-xs text-gray-500 mt-3 text-center">
      {isConnected ? "Real-time data from Raspberry Pi • Updates every 5s" : "⚠️ Connection lost. Showing last known values."}
    </p>
  </div>
)

/* --- MAIN COMPONENT --- */

export default function Analytics() {
  const [selectedSensors, setSelectedSensors] = useState<SensorState>({
    waterTemp: true, ph: true, airTemp: false, lightIntensity: false,
    waterFlow: false, humidity: false, airPressure: false,
  })

  const [selectedRange, setSelectedRange]         = useState("thisWeek")
  const [sensorExportRange, setSensorExportRange] = useState("24h")
  const [showGrowthFilters, setShowGrowthFilters] = useState(false)
  const [showSensorFilters, setShowSensorFilters] = useState(false)
  const [currentTime, setCurrentTime]             = useState(new Date())
  const [dateWarning, setDateWarning]             = useState("")

  const [customGrowthStartDate, setCustomGrowthStartDate] = useState(formatDate())
  const [customGrowthEndDate, setCustomGrowthEndDate]     = useState(formatDate())
  const [customSensorStartDate, setCustomSensorStartDate] = useState(formatDate())
  const [customSensorEndDate, setCustomSensorEndDate]     = useState(formatDate())

  const [growthData, setGrowthData]             = useState<GrowthRow[]>([])
  const [growthLoading, setGrowthLoading]       = useState(true)
  const [sensorHistory, setSensorHistory]       = useState<SensorTrendRow[]>([])
  const [sensorLoading, setSensorLoading]       = useState(true)
  const [latestReading, setLatestReading]       = useState<SensorTrendRow | undefined>(undefined)
  const [isRaspiConnected, setIsRaspiConnected] = useState(true)

  const MAX_SAMPLES = 200
  const [liveSensorData, setLiveSensorData] = useState<SensorTrendRow[]>([])

  const activeCount = Object.values(selectedSensors).filter(Boolean).length

  const localSensorConfig: { key: SensorKey; name: string; color: string }[] = [
    { key: "waterTemp",      name: "Water Temp",   color: "#3b82f6" },
    { key: "ph",             name: "pH Level",     color: "#8b5cf6" },
    { key: "airTemp",        name: "Air Temp",     color: "#f59e0b" },
    { key: "lightIntensity", name: "Light",        color: "#eab308" },
    { key: "waterFlow",      name: "Flow Rate",    color: "#6366f1" },
    { key: "humidity",       name: "Humidity",     color: "#14b8a6" },
    { key: "airPressure",    name: "Air Pressure", color: "#ef4444" },
  ]

  useEffect(() => {
    const load = async () => {
      setGrowthLoading(true)
      const data = await fetchGrowthHistoryAPI(selectedRange)
      setGrowthData(data)
      setGrowthLoading(false)
    }
    load()
  }, [selectedRange])

  useEffect(() => {
    const load = async () => {
      setSensorLoading(true)
      const data = await fetchSensorHistoryAPI(sensorExportRange)
      setSensorHistory(data)
      setSensorLoading(false)
    }
    load()
  }, [sensorExportRange])

  useEffect(() => {
    let mounted = true
    const poll = async () => {
      const reading = await fetchLatestSensorAPI()
      if (!mounted) return
      if (reading) {
        setIsRaspiConnected(true)
        setLatestReading(reading)
        setLiveSensorData((prev) => [...prev, reading].slice(-MAX_SAMPLES))
      } else {
        setIsRaspiConnected(false)
      }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDateChange = (type: "growth" | "sensor", key: "start" | "end", value: string) => {
    let start: string, end: string
    if (type === "growth") {
      if (key === "start") { start = value; end = customGrowthEndDate; setCustomGrowthStartDate(value) }
      else { start = customGrowthStartDate; end = value; setCustomGrowthEndDate(value) }
    } else {
      if (key === "start") { start = value; end = customSensorEndDate; setCustomSensorStartDate(value) }
      else { start = customSensorStartDate; end = value; setCustomSensorEndDate(value) }
    }
    setDateWarning(new Date(start) > new Date(end) ? "Start date cannot be after the end date." : "")
  }

  const applyCustomDateFilter = (type: "growth" | "sensor") => {
    if (dateWarning) return
    if (type === "growth") { setSelectedRange(""); setTimeout(() => setSelectedRange("customGrowth"), 0) }
    else { setSensorExportRange(""); setTimeout(() => setSensorExportRange("custom"), 0) }
  }

  const chartSensorData = sensorExportRange === "24h" && liveSensorData.length > 0
    ? liveSensorData.slice(-24)
    : sensorHistory

  const lastGrowth = growthData[growthData.length - 1]

  const toggleSensor = (key: SensorKey) => setSelectedSensors((prev) => ({ ...prev, [key]: !prev[key] }))
  const selectAllSensors = () => setSelectedSensors(Object.keys(selectedSensors).reduce((acc, key) => ({ ...acc, [key]: true }), {} as SensorState))
  const deselectAllSensors = () => setSelectedSensors(Object.keys(selectedSensors).reduce((acc, key) => ({ ...acc, [key]: false }), {} as SensorState))

  const exportGrowthDataCSV = () => {
    if (growthData.length === 0) return
    downloadCSV(
      `plant_growth_${selectedRange}_${formatDate()}.csv`,
      ["Day", "Height (cm)", "Leaves", "Health (%)"],
      growthData.map((d) => [d.day, d.height, d.leaves, d.health])
    )
  }

  const exportSensorDataCSV = () => {
    if (chartSensorData.length === 0) return
    const activeKeys = Object.entries(selectedSensors).filter(([_, v]) => v).map(([k]) => k as SensorKey)
    downloadCSV(
      `sensor_data_${sensorExportRange}_${formatDate()}.csv`,
      ["Time", ...activeKeys.map((k) => { const c = sensorConfig.find((s) => s.key === k); return c ? `${c.name.split("(")[0].trim()} (${c.unit})` : k })],
      chartSensorData.map((entry) => [entry.time, ...activeKeys.map((key) => entry[key])])
    )
  }

  const exportAllData = () => {
    const headers = ["Type", "Day/Time", "Value1", "Value2", "Value3"]
    const growthRows = growthData.map((d) => ["Growth", d.day, `Height: ${d.height}cm`, `Leaves: ${d.leaves}`, `Health: ${d.health}%`])
    const sensorRows = chartSensorData.map((d) => ["Sensor", d.time, `Water: ${d.waterTemp}°C`, `pH: ${d.ph}`, `Light: ${d.lightIntensity}lux`])
    downloadCSV(`complete_analytics_${formatDate()}.csv`, headers, [...growthRows, [""], ...sensorRows])
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <Navbar time={currentTime.toLocaleTimeString()} isConnected={isRaspiConnected} />

      <div className="px-4 py-5 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your aquaponics system performance</p>
        </div>

        {/* 1. Live Sensor Readings Table */}
        <SensorReadingsTable latestData={latestReading} currentTime={currentTime} isConnected={isRaspiConnected} />

        <div className="space-y-5 mt-5">

          {/* EXPORT ALL */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Export Complete Analytics</h3>
                <p className="text-xs text-gray-600 mt-1">Download all growth and sensor data in one file</p>
              </div>
              <button onClick={exportAllData} disabled={growthData.length === 0 && chartSensorData.length === 0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors">
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
                <button onClick={() => setShowGrowthFilters(!showGrowthFilters)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium">
                  <Filter className="w-3.5 h-3.5" />{showGrowthFilters ? "Hide" : "Filters"}
                </button>
                <button onClick={exportGrowthDataCSV} disabled={growthData.length === 0} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              </div>
            </div>

            {showGrowthFilters && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />Time Period
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)}>
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="twoWeeks">Last 2 Weeks</option>
                  <option value="customGrowth">Custom Range</option>
                </select>
                {selectedRange === "customGrowth" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Select Date Range</p>
                    <div className="flex gap-2">
                      <input type="date" value={customGrowthStartDate} onChange={(e) => handleDateChange("growth", "start", e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-md text-sm" />
                      <input type="date" value={customGrowthEndDate} onChange={(e) => handleDateChange("growth", "end", e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    {dateWarning && <p className="text-xs text-red-600 font-medium mt-2">{dateWarning}</p>}
                    <button onClick={() => applyCustomDateFilter("growth")} disabled={!!dateWarning} className={`w-full py-1.5 mt-2 text-sm font-semibold rounded-md transition-colors ${dateWarning ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            {growthLoading ? (
              <div className="flex items-center justify-center h-56 gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                <span className="text-sm">Loading growth data from Raspberry Pi...</span>
              </div>
            ) : growthData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
                No growth data available. Check Raspberry Pi connection.
              </div>
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <defs>
                        <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", padding: "8px 12px" }} />
                      <Area type="monotone" dataKey="height" stroke="#10b981" fillOpacity={1} fill="url(#colorHeight)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600">Current Height</div>
                    <div className="text-2xl font-bold text-emerald-600">{lastGrowth?.height ?? "—"}cm</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600">Weekly Growth</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {growthData.length > 1 ? `+${(lastGrowth.height - growthData[0].height).toFixed(1)}cm` : "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SENSOR TRENDS */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-gray-900">Sensor Trends</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowSensorFilters(!showSensorFilters)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium">
                  <Filter className="w-3.5 h-3.5" />{showSensorFilters ? "Hide" : "Filters"}
                </button>
                <button onClick={exportSensorDataCSV} disabled={chartSensorData.length === 0} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium">
                  <Download className="w-3.5 h-3.5" />Export
                </button>
              </div>
            </div>

            {showSensorFilters && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />Time Period
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={sensorExportRange} onChange={(e) => { setSensorExportRange(e.target.value); if (e.target.value !== "custom") setDateWarning("") }}>
                  <option value="24h">Last 24 Hours</option>
                  <option value="48h">Last 48 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                {sensorExportRange === "custom" && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Select Date Range</p>
                    <div className="flex gap-2">
                      <input type="date" value={customSensorStartDate} onChange={(e) => handleDateChange("sensor", "start", e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-md text-sm" />
                      <input type="date" value={customSensorEndDate} onChange={(e) => handleDateChange("sensor", "end", e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-md text-sm" />
                    </div>
                    {dateWarning && <p className="text-xs text-red-600 font-medium mt-2">{dateWarning}</p>}
                    <button onClick={() => applyCustomDateFilter("sensor")} disabled={!!dateWarning} className={`w-full py-1.5 mt-2 text-sm font-semibold rounded-md transition-colors ${dateWarning ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 text-white"}`}>
                      Apply Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <button onClick={selectAllSensors} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">Select All</button>
              <button onClick={deselectAllSensors} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">Clear All</button>
              <span className="ml-auto text-xs text-gray-500 self-center">{activeCount} / {localSensorConfig.length} selected</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {localSensorConfig.map((sensor) => {
                const active = selectedSensors[sensor.key]
                return (
                  <button key={sensor.key} onClick={() => toggleSensor(sensor.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? "bg-white text-gray-900 border-2 shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"}`} style={{ borderColor: active ? sensor.color : undefined }}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: sensor.color }}></span>
                    {sensor.name}
                  </button>
                )
              })}
            </div>

            {sensorLoading ? (
              <div className="flex items-center justify-center h-72 gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-sm">Loading sensor history...</span>
              </div>
            ) : chartSensorData.length === 0 ? (
              <div className="flex items-center justify-center h-72 text-gray-400 text-sm">
                No sensor history available. Check Raspberry Pi connection.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSensorData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#9ca3af" tick={{ fill: "#6b7280", fontSize: 11 }} interval={3} />
                    <YAxis stroke="#9ca3af" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px", padding: "8px 12px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px", paddingTop: 10 }} />
                    {localSensorConfig.map((sensor) =>
                      selectedSensors[sensor.key] && (
                        <Line key={sensor.key} type="monotone" dataKey={sensor.key} stroke={sensor.color} strokeWidth={2.5} dot={false} name={sensor.name} activeDot={{ r: 5 }} />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* HEALTH METRICS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Fish className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Fish Health</span>
              </div>
              {!latestReading ? (
                <div className="text-sm text-gray-400">No data</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-emerald-600">
                    {latestReading.ph >= 6.5 && latestReading.ph <= 7.5 ? "Excellent" : "Good"}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    pH: {latestReading.ph.toFixed(1)} • Temp: {latestReading.waterTemp.toFixed(1)}°C
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${calculateWaterQuality({ waterTemp: latestReading.waterTemp, ph: latestReading.ph })}%` }}></div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Water Quality</span>
              </div>
              {!latestReading ? (
                <div className="text-sm text-gray-400">No data</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-emerald-600">
                    {calculateWaterQuality({ waterTemp: latestReading.waterTemp, ph: latestReading.ph })}%
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    pH: {latestReading.ph.toFixed(1)} • Temp: {latestReading.waterTemp.toFixed(1)}°C
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${calculateWaterQuality({ waterTemp: latestReading.waterTemp, ph: latestReading.ph })}%` }}></div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}