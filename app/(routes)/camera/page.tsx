"use client"

import { Camera, X, Download, Trash2, Home, BarChart3, Settings } from "lucide-react"
import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PLANT_DETECTIONS } from "@/lib/constants"

/* ─── TYPES ─────────────────────────────────────────────────────────────── */

interface PlantDetection {
  name: string
  status: string
  color: "emerald" | "amber"
  leafCount?: number
  height?: number
}

interface Snapshot {
  id: number
  date: string
  time: string
  url: string
}

interface CameraSettingsState {
  resolution: string
  fps: number
  brightness: number
  contrast: number
  detectionSensitivity: number
  autoFocus: boolean
  nightMode: boolean
  motionDetection: boolean
}

interface ToastProps {
  message: string
  visible: boolean
  color: "success" | "info" | "warning" | "default" | "error"
  onClose: () => void
}

/* ─── CONFIG ─────────────────────────────────────────────────────────────── */

const BASE = process.env.NEXT_PUBLIC_RASPI_API_URL ?? "http://192.168.210.142:8000"
const VIDEO_STREAM_URL = `${BASE}/video_feed`

const DEFAULT_SETTINGS: CameraSettingsState = {
  resolution: "1080p",
  fps: 30,
  brightness: 50,
  contrast: 50,
  detectionSensitivity: 75,
  autoFocus: true,
  nightMode: false,
  motionDetection: true,
}

/* ─── HELPERS ────────────────────────────────────────────────────────────── */

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts = [h, m, s].map((v) => v.toString().padStart(2, "0"))
  return h > 0 ? parts.join(":") : parts.slice(1).join(":")
}

/* ─── API LAYER ──────────────────────────────────────────────────────────── */

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`DELETE ${path} → ${res.status}`)
}

/* ─── CUSTOM HOOK ────────────────────────────────────────────────────────── */

function useCameraSettings(
  showToast: (msg: string, color: ToastProps["color"]) => void
) {
  const [settings, setSettings] = useState<CameraSettingsState>(DEFAULT_SETTINGS)
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    apiGet<{ settings: Partial<CameraSettingsState>; isRecording: boolean }>(
      "/camera/settings"
    )
      .then(({ settings: s, isRecording: r }) => {
        setSettings((prev) => ({ ...prev, ...s }))
        setIsRecording(r)
      })
      .catch(() =>
        showToast("⚠️ Could not load camera settings from Raspberry Pi.", "warning")
      )
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSettingChange = (
    key: keyof CameraSettingsState,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async (): Promise<boolean> => {
    try {
      await apiPost("/camera/settings", settings)
      setHasChanges(false)
      showToast("✅ Settings saved to Raspberry Pi!", "success")
      return true
    } catch {
      showToast("❌ Failed to save settings.", "error")
      return false
    }
  }

  const handleToggleRecord = async (shouldRecord: boolean): Promise<boolean> => {
    try {
      await apiPost("/camera/record", { action: shouldRecord ? "start" : "stop" })
      setIsRecording(shouldRecord)
      showToast(
        shouldRecord
          ? "🎥 Recording started."
          : "⏹️ Recording stopped. File is processing…",
        shouldRecord ? "info" : "success"
      )
      return true
    } catch {
      showToast("❌ Failed to toggle recording.", "error")
      return false
    }
  }

  return {
    settings,
    isRecording,
    isLoading,
    hasChanges,
    handleSettingChange,
    handleSave,
    handleToggleRecord,
  }
}

/* ─── UI COMPONENTS ──────────────────────────────────────────────────────── */

const Toast: React.FC<ToastProps> = ({ message, visible, color, onClose }) => {
  if (!visible) return null
  const palette: Record<ToastProps["color"], string> = {
    success: "bg-emerald-600",
    info: "bg-blue-600",
    warning: "bg-amber-600",
    error: "bg-red-600",
    default: "bg-gray-800",
  }
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-xl shadow-2xl z-[100] text-white ${palette[color]}`}>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

const Navbar: React.FC<{ time: string }> = ({ time }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900">GROWUP</span>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-3">
        {tabs.map(({ id, label, href, icon: Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link key={id} href={href} className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${active ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────────────── */

export default function CameraPage() {
  const [toast, setToast] = useState<{ message: string; visible: boolean; color: ToastProps["color"] }>({ message: "", visible: false, color: "info" })

  const showToast = useCallback(
    (message: string, color: ToastProps["color"] = "info") => {
      setToast({ message, visible: true, color })
      setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3000)
    },
    []
  )

  const { settings, isRecording, isLoading, hasChanges, handleSettingChange, handleSave, handleToggleRecord } = useCameraSettings(showToast)

  const [streamError, setStreamError] = useState(false)
  const [streamLoading, setStreamLoading] = useState(true)
  const imgRef = useRef<HTMLImageElement>(null)

  /* detections — starts with mock, replaced by live API if available */
  const [detections, setDetections] = useState<PlantDetection[]>(PLANT_DETECTIONS)
  const [isLiveDetection, setIsLiveDetection] = useState(false)

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [snapshotsLoading, setSnapshotsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1.0)
  const [showZoomControls, setShowZoomControls] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [recordingDuration, setRecordingDuration] = useState(0)

  /* ── fetch plant detections — fallback to mock if API fails ── */
  useEffect(() => {
    apiGet<{ detections: PlantDetection[] }>("/ai/detections")
      .then(({ detections: d }) => {
        if (d && d.length > 0) {
          setDetections(d)
          setIsLiveDetection(true)
        }
        // if empty, keep mock data
      })
      .catch(() => {
        // silently fall back to mock data already set in useState
      })
  }, [])

  useEffect(() => {
    const clockId = setInterval(() => setCurrentTime(new Date()), 1000)
    let recId: NodeJS.Timeout | null = null
    if (isRecording) {
      recId = setInterval(() => setRecordingDuration((d) => d + 1), 1000)
    } else if (recordingDuration > 0) {
      if (recordingDuration < 3) showToast("Recording too short – file discarded.", "warning")
      setRecordingDuration(0)
    }
    return () => { clearInterval(clockId); if (recId) clearInterval(recId) }
  }, [isRecording, recordingDuration, showToast])

  const handleStreamLoad = () => { setStreamLoading(false); setStreamError(false); showToast("📹 Video stream connected!", "success") }
  const handleStreamError = () => { setStreamLoading(false); setStreamError(true); showToast("⚠️ Cannot connect to camera stream. Check Raspberry Pi.", "error") }
  const handleRecord = () => handleToggleRecord(!isRecording)

  const handleSnapshot = async () => {
    showToast("📸 Capturing snapshot…", "info")
    try {
      const data = await apiPost<{ id: number; url: string }>("/camera/snapshot")
      const now = new Date()
      setSnapshots((prev) => [{ id: data.id, url: data.url, date: now.toISOString().split("T")[0], time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...prev])
      showToast("✅ Snapshot saved to gallery!", "success")
    } catch { showToast("❌ Failed to capture snapshot.", "error") }
  }

  const openGallery = async () => {
    setShowGallery(true); setSnapshotsLoading(true)
    try {
      const data = await apiGet<{ snapshots: Snapshot[] }>("/camera/snapshots")
      setSnapshots(data.snapshots)
    } catch { showToast("⚠️ Could not load gallery from Raspberry Pi.", "warning") }
    finally { setSnapshotsLoading(false) }
  }

  const handleDownload = (snapshot: Snapshot) => {
    const a = document.createElement("a")
    a.href = snapshot.url; a.download = `snapshot_${snapshot.id}_${snapshot.date}.jpg`; a.target = "_blank"; a.rel = "noopener noreferrer"
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    showToast(`⬇️ Downloading snapshot ${snapshot.date}`, "success")
  }

  const handleDelete = async () => {
    if (!selectedSnapshot) return
    try {
      await apiDelete(`/camera/snapshot/${selectedSnapshot.id}`)
      setSnapshots((prev) => prev.filter((s) => s.id !== selectedSnapshot.id))
      showToast("🗑️ Snapshot deleted.", "warning"); setSelectedSnapshot(null)
    } catch { showToast("❌ Failed to delete snapshot.", "error") }
  }

  const handleSaveSettings = async () => { const ok = await handleSave(); if (ok) setShowSettings(false) }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center max-w-md mx-auto bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">Loading camera configuration…</p>
        </div>
      </div>
    )
  }

  const totalLeaves = detections.reduce((sum, p) => sum + (p.leafCount ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <Navbar time={currentTime.toLocaleTimeString()} />

      <div className="space-y-5 pb-24 px-4 py-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 pt-2">Camera Monitor</h1>
          <p className="text-gray-500 mt-1">Real-time surveillance and health analysis for your Kale Tower.</p>
        </div>

        {/* ── LIVE VIDEO STREAM ── */}
        <div className="bg-gray-900 rounded-2xl aspect-square relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 transition-transform duration-300 ease-in-out" style={{ transform: `scale(${zoomLevel})` }}>
            {!streamError ? (
              <img ref={imgRef} src={VIDEO_STREAM_URL} alt="Live Kale Tower Feed" className="w-full h-full object-cover" onLoad={handleStreamLoad} onError={handleStreamError} />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-orange-900/30 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div className="text-lg font-semibold">Camera Stream Unavailable</div>
                  <div className="text-sm opacity-70 mt-2">Check Raspberry Pi connection</div>
                  <div className="text-xs opacity-50 mt-3 font-mono break-all">{VIDEO_STREAM_URL}</div>
                </div>
              </div>
            )}
            {streamLoading && !streamError && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
                  <div className="text-lg font-semibold">Connecting to camera…</div>
                </div>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-xl font-bold text-sm shadow-md backdrop-blur-sm z-10">
                REC {formatDuration(recordingDuration)}
              </div>
            )}
            <div className={`absolute top-4 right-4 w-4 h-4 rounded-full shadow-md z-10 ${isRecording ? "bg-red-600 animate-pulse" : streamError ? "bg-gray-500" : "bg-green-500"}`} />
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg text-white backdrop-blur-sm z-10">
              <div className="text-sm font-semibold font-mono">{currentTime.toLocaleTimeString()}</div>
              <div className="text-xs text-gray-300">{settings.resolution} • {settings.fps}fps • {isRecording ? "Recording" : streamError ? "Offline" : "Live"}</div>
            </div>
          </div>
        </div>

        {/* ── ZOOM CONTROLS ── */}
        {showZoomControls && (
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">Zoom Level: <span className="text-purple-600">{zoomLevel.toFixed(1)}x</span></h3>
            <input type="range" min="1.0" max="4.0" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))} className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
            <div className="flex justify-between text-sm text-gray-500 mt-2"><span>1× (Wide)</span><span>4× (Macro)</span></div>
          </div>
        )}

        {/* ── AI PLANT HEALTH + LEAF COUNT + HEIGHT ── */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-gray-900">
                <span className="text-emerald-500">AI</span> Plant Health Status
              </h3>
              {!isLiveDetection && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  Mock Data
                </span>
              )}
            </div>
            {detections.length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <span className="text-base">🌿</span>
                <span className="text-xs font-bold text-emerald-700">{totalLeaves} leaves total</span>
              </div>
            )}
          </div>

          {detections.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">No detections available. Ensure the AI service is running.</p>
          ) : (
            <div className="space-y-3">
              {detections.map((plant, i) => (
                <div key={i} className={`p-3 rounded-xl ${plant.color === "emerald" ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                  {/* Top row: name + status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${plant.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span className="font-medium text-gray-900 text-sm">{plant.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${plant.color === "emerald" ? "text-emerald-800 bg-emerald-200" : "text-amber-800 bg-amber-200"}`}>
                      {plant.status}
                    </span>
                  </div>
                  {/* Bottom row: leaf count + height */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                      <span className="text-xs">🌿</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {plant.leafCount !== undefined ? `${plant.leafCount} leaves` : "— leaves"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded-lg">
                      <span className="text-xs">📏</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {plant.height !== undefined ? `${plant.height} cm` : "— cm"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ACTION CENTER ── */}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-4 border-b pb-2">Action Center</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleSnapshot} disabled={streamError} className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${streamError ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-pink-100 hover:bg-pink-200 text-pink-700"}`}>📸 Snapshot</button>
            <button onClick={openGallery} className="p-4 bg-emerald-100 hover:bg-emerald-200 rounded-xl font-bold text-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">🖼️ Gallery</button>
            <button onClick={handleRecord} disabled={streamError} className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${streamError ? "bg-gray-200 text-gray-400 cursor-not-allowed" : isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-100 hover:bg-blue-200 text-blue-700"}`}>
              {isRecording ? (<span className="inline-flex items-center gap-2"><span className="animate-ping inline-block w-3 h-3 bg-white rounded-full" />STOP ({formatDuration(recordingDuration)})</span>) : "🎥 Record"}
            </button>
            <button
              onClick={() => { const next = !showZoomControls; setShowZoomControls(next); showToast(next ? "🔍 Zoom controls enabled." : "🔍 Zoom controls disabled.", "info") }}
              disabled={streamError}
              className={`p-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${streamError ? "bg-gray-200 text-gray-400 cursor-not-allowed" : showZoomControls ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-purple-100 hover:bg-purple-200 text-purple-700"}`}
            >
              🔍 Zoom ({zoomLevel.toFixed(1)}×)
            </button>
            <button onClick={() => setShowSettings(true)} className="col-span-2 p-4 bg-orange-100 hover:bg-orange-200 rounded-xl font-bold text-orange-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98]">⚙️ Settings</button>
          </div>
        </div>
      </div>

      <BottomNavigation />
      <Toast message={toast.message} visible={toast.visible} color={toast.color} onClose={() => setToast((p) => ({ ...p, visible: false }))} />

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Camera Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution</label>
                <select value={settings.resolution} onChange={(e) => handleSettingChange("resolution", e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Frame Rate (FPS)</label>
                <select value={settings.fps} onChange={(e) => handleSettingChange("fps", Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-emerald-500 focus:border-emerald-500">
                  <option value={15}>15 FPS</option>
                  <option value={30}>30 FPS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brightness: <span className="text-emerald-600 font-bold">{settings.brightness}%</span></label>
                <input type="range" min="0" max="100" value={settings.brightness} onChange={(e) => handleSettingChange("brightness", Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contrast: <span className="text-emerald-600 font-bold">{settings.contrast}%</span></label>
                <input type="range" min="0" max="100" value={settings.contrast} onChange={(e) => handleSettingChange("contrast", Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">AI Detection Sensitivity: <span className="text-emerald-600 font-bold">{settings.detectionSensitivity}%</span></label>
                <input type="range" min="0" max="100" value={settings.detectionSensitivity} onChange={(e) => handleSettingChange("detectionSensitivity", Number(e.target.value))} className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <p className="text-xs text-gray-500 mt-1">Higher sensitivity detects more plants but may increase false positives.</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Motion Detection</div>
                  <div className="text-xs text-gray-500">Alert on movement detection</div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" checked={settings.motionDetection} onChange={(e) => handleSettingChange("motionDetection", e.target.checked)} className="sr-only peer" />
                  <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              <div className="space-y-3 pt-2">
                <button onClick={handleSaveSettings} disabled={!hasChanges} className={`w-full p-4 font-bold rounded-xl transition-colors shadow-lg active:scale-[0.99] ${hasChanges ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                  {hasChanges ? "Save Changes" : "Settings Synced"}
                </button>
                <button onClick={() => setShowSettings(false)} className="w-full p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GALLERY MODAL ── */}
      {showGallery && !selectedSnapshot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Snapshot Gallery</h2>
                <p className="text-sm text-gray-500">Captured photos from the Raspberry Pi</p>
              </div>
              <button onClick={() => setShowGallery(false)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4">
              {snapshotsLoading ? (
                <div className="flex flex-col items-center py-10 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
                  <p className="text-sm">Loading snapshots…</p>
                </div>
              ) : snapshots.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">No snapshots yet. Capture one from the camera view!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id} onClick={() => setSelectedSnapshot(snapshot)} className="bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-400 transition-all cursor-pointer shadow-md">
                      <div className="aspect-square bg-gray-200 overflow-hidden">
                        <img src={snapshot.url} alt={`Snapshot ${snapshot.date}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-3 bg-white">
                        <div className="font-semibold text-gray-900 text-sm">{snapshot.date}</div>
                        <div className="text-xs text-gray-500">{snapshot.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowGallery(false)} className="w-full mt-4 p-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]">Close Gallery</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SNAPSHOT FULL VIEW ── */}
      {selectedSnapshot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full h-full max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <button onClick={() => setSelectedSnapshot(null)} className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors font-semibold">
                <span className="text-2xl">←</span> Back to Gallery
              </button>
              <button onClick={() => { setSelectedSnapshot(null); setShowGallery(false) }} className="text-white hover:text-red-500 transition-colors p-2 rounded-full">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-y-auto flex-grow min-h-0">
              <div className="aspect-square bg-gray-200 overflow-hidden">
                <img src={selectedSnapshot.url} alt={`Snapshot ${selectedSnapshot.date}`} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Snapshot — {selectedSnapshot.date}</h3>
                <p className="text-gray-500 mb-4">Captured at {selectedSnapshot.time}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleDownload(selectedSnapshot)} className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                    <Download className="w-5 h-5" /> Download
                  </button>
                  <button onClick={handleDelete} className="p-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
                    <Trash2 className="w-5 h-5" /> Delete
                  </button>
                </div>
                <button onClick={() => { setSelectedSnapshot(null); setShowGallery(false) }} className="w-full mt-4 p-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors active:scale-[0.99]">
                  Close &amp; Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}