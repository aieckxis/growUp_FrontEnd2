//growup/updated/app/(routes)/dashboard/page.tsx

"use client"

import React, { useState, useEffect } from "react"
import { Thermometer, Droplets, Activity, Zap, Waves, Gauge, Wind, Fish, ChevronDown, AlertTriangle, CheckCircle, Camera, Maximize2, Bell, X, Clock, Home, BarChart3, Settings, Sun, WifiOff } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// --- INTERFACES  ---
interface SystemControls { 
  pump: boolean; 
  fan: boolean; 
  phAdjustment: boolean; 
  aerator: boolean; 
  growLight: boolean; 
}

interface ThresholdState { 
  waterTemp: { min: number; max: number }; 
  ph: { min: number; max: number }; 
  dissolvedO2: { min: number; max: number }; 
  ammonia: { min: number; max: number }; 
}

interface ControlState { 
  pump: boolean; 
  fan: boolean; 
  phAdjustment: boolean; 
  aerator: boolean; 
  growLight: boolean; 
}

interface SensorCardProps { 
  icon: React.ElementType; 
  title: string; 
  value: number; 
  unit: string; 
  min: number; 
  max: number; 
  color: string; 
}

interface SensorDataState {
  waterTemp: number;
  ph: number;
  dissolvedO2: number;
  waterLevel: number;
  waterFlow: number;
  humidity: number;
  ammonia: number;
  lightIntensity: number;
  airTemp: number;
  airPressure: number;
}

interface AlertData { 
  id: number; 
  type: "warning" | "info"; 
  severity: "low" | "medium" | "high"; 
  title: string; 
  message: string; 
  time: string; 
}

interface ControlToggleProps { 
  label: string; 
  icon: React.ElementType; 
  active: boolean; 
  onChange: (val: boolean) => void; 
}

// --- INITIAL STATE & CONSTANTS ---
const INITIAL_CONTROLS_FULL: SystemControls = { 
  pump: true, 
  fan: false, 
  phAdjustment: true, 
  aerator: true, 
  growLight: true 
}

const INITIAL_THRESHOLDS: ThresholdState = { 
  waterTemp: { min: 20, max: 26 }, 
  ph: { min: 6.5, max: 7.5 }, 
  dissolvedO2: { min: 5, max: 8 }, 
  ammonia: { min: 0, max: 0.5 } 
}

const INITIAL_SENSOR_DATA: SensorDataState = {
  waterTemp: 23.2,
  ph: 6.8,
  dissolvedO2: 7.2,
  waterLevel: 85,
  waterFlow: 4.5,
  humidity: 65,
  ammonia: 0.3,
  lightIntensity: 15000,
  airTemp: 25.5,
  airPressure: 1012.0
}

const localStorageKey = 'aquaponics_settings_state';

// --- HELPER FUNCTIONS ---
const loadState = (): { controls: SystemControls, activePreset: string, thresholds: ThresholdState } => { 
  try { 
    const savedState = localStorage.getItem(localStorageKey); 
    if (savedState) return JSON.parse(savedState); 
  } catch (error) { 
    console.error('Error loading state:', error); 
  } 
  return { 
    controls: INITIAL_CONTROLS_FULL, 
    activePreset: "balanced", 
    thresholds: INITIAL_THRESHOLDS, 
  }; 
}

type ThresholdStatus = "good" | "warning" | "critical"

const getThresholdStatus = (value: number, min: number, max: number): ThresholdStatus => {
  if (value < min || value > max) return "critical"
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) return "warning"
  return "good"
}

const getStatusColor = (status: ThresholdStatus): string => {
  switch (status) {
    case "good": return "bg-emerald-500"
    case "warning": return "bg-amber-500"
    case "critical": return "bg-red-500"
    default: return "bg-gray-500"
  }
}

const calculatePercentage = (value: number, min: number, max: number) => 
  ((value - min) / (max - min)) * 100

// --- CUSTOM HOOKS ---
const useAquaponicsSettings = () => {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === localStorageKey && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const quickSaveControls = (newControls: SystemControls) => {
    setState(prevState => {
      const newState = { ...prevState, controls: newControls };
      localStorage.setItem(localStorageKey, JSON.stringify(newState));
      return newState;
    });
  }

  return { 
    controls: state.controls, 
    quickSaveControls, 
    activePreset: state.activePreset, 
    thresholds: state.thresholds 
  }
}

// --- ALERT GENERATION ---
const generateAlerts = (data: SensorDataState, thresholds: ThresholdState): AlertData[] => {
  const newAlerts: AlertData[] = []
  let alertIdCounter = 1

  const checkParam = (title: string, value: number, min: number, max: number, unit: string) => {
    if (value < min || value > max) {
      newAlerts.push({
        id: alertIdCounter++,
        type: "warning",
        severity: "high",
        title: `${title} Critical!`,
        message: `${title} (${value.toFixed(1)}${unit}) is outside critical range [${min}-${max}${unit}].`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    } else if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) {
      newAlerts.push({
        id: alertIdCounter++,
        type: "warning",
        severity: "medium",
        title: `${title} Warning`,
        message: `${title} (${value.toFixed(1)}${unit}) is approaching boundary range [${min}-${max}${unit}].`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  checkParam("Water Temp", data.waterTemp, thresholds.waterTemp.min, thresholds.waterTemp.max, "°C")
  checkParam("pH Level", data.ph, thresholds.ph.min, thresholds.ph.max, "")
  checkParam("Dissolved O₂", data.dissolvedO2, thresholds.dissolvedO2.min, thresholds.dissolvedO2.max, "mg/L")
  checkParam("Ammonia", data.ammonia, thresholds.ammonia.min, thresholds.ammonia.max, "ppm")

  if (data.waterLevel < 75) {
    newAlerts.push({
      id: alertIdCounter++,
      type: "warning",
      severity: "medium",
      title: "Water Level Low",
      message: `Water reservoir is at ${data.waterLevel.toFixed(0)}%. Consider checking auto-fill or adding water.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  if (newAlerts.length === 0) {
    newAlerts.push({
      id: alertIdCounter++,
      type: "info",
      severity: "low",
      title: "System Running Optimally",
      message: "All monitored parameters are within ideal ranges.",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    })
  }

  return newAlerts.reverse()
}

// --- UI COMPONENTS ---

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
  const pathname = usePathname() || "/dashboard"
  const tabs = [
    { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "camera", label: "Camera", href: "/camera", icon: Camera },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ]
  
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-3">
        {tabs.map(tab => {
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

const SensorCard: React.FC<SensorCardProps> = ({ icon: Icon, title, value, unit, min, max, color }) => {
  const status = getThresholdStatus(value, min, max)
  const percentage = calculatePercentage(value, min, max)
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)} animate-pulse`}></div>
      </div>
      <div className="mb-3">
        <div className="text-2xl font-bold text-gray-900">
          {value.toFixed(1)}
          <span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${getStatusColor(status)}`} 
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        ></div>
      </div>
    </div>
  )
}

const ControlToggle: React.FC<ControlToggleProps> = ({ label, icon: Icon, active, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100' : 'bg-gray-200'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
      </div>
      <span className="font-medium text-gray-900">{label}</span>
    </div>
    <button 
      onClick={() => onChange(!active)} 
      className={`w-12 h-6 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
)

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard() {
  // Hooks
  const { controls, quickSaveControls, thresholds } = useAquaponicsSettings()
  
  // State
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false)
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false)
  const [localControls, setLocalControls] = useState<ControlState>({ ...controls })
  const [sensorData, setSensorData] = useState<SensorDataState>(INITIAL_SENSOR_DATA)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [isCameraConnected, setIsCameraConnected] = useState<boolean>(false)
  const [cameraLoading, setCameraLoading] = useState<boolean>(true)
  const [isRaspiConnected, setIsRaspiConnected] = useState<boolean>(true)
  
  const LIVE_STREAM_URL = "http://192.168.210.142:8000/video_feed"

  // Calculate overall system status
  const overallSeverity = alerts.reduce((maxSeverity, alert) => {
    if (alert.severity === 'high') return 'high'
    if (alert.severity === 'medium' && maxSeverity !== 'high') return 'medium'
    return maxSeverity
  }, 'low' as AlertData['severity'])

  const getOverallStatus = (severity: AlertData['severity']) => {
    if (severity === 'high') return { color: 'bg-red-500', text: 'System Critical' }
    if (severity === 'medium') return { color: 'bg-amber-500', text: 'System Warning' }
    return { color: 'bg-emerald-500', text: 'System Healthy' }
  }

  const status = getOverallStatus(overallSeverity)

  // Sync local controls with global controls
  useEffect(() => {
    if (showControlsModal) setLocalControls({ ...controls })
  }, [showControlsModal, controls])

  useEffect(() => {
  const checkCameraConnection = () => {
    const img = new Image()
    
    img.onload = () => {
      setIsCameraConnected(true)
      setCameraLoading(false)
    }
    
    img.onerror = () => {
      setIsCameraConnected(false)
      setCameraLoading(false)
    }
    
    // Add timestamp to prevent caching
    img.src = `${LIVE_STREAM_URL}?t=${Date.now()}`
  }

  // Check immediately on mount
  checkCameraConnection()
  
  // Re-check every 10 seconds
  const cameraCheckInterval = setInterval(checkCameraConnection, 10000)

  return () => clearInterval(cameraCheckInterval)
}, [])

  // Fetch sensor data from API
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        // Use Next.js API route (internal endpoint)
        const API_URL = "/api/sensors"
        
        const response = await fetch(API_URL)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const apiResponse = await response.json()
        
        if (apiResponse.status === "success" && apiResponse.data) {
          setSensorData(apiResponse.data)
          setAlerts(generateAlerts(apiResponse.data, thresholds))
          setIsRaspiConnected(true)
          
          // Optional: log raw data for debugging
          console.log("✅ Sensor data updated:", apiResponse.data)
          if (apiResponse.rawData) {
            console.log("📡 Raw Raspberry Pi data:", apiResponse.rawData)
          }
        } else {
          console.error("API returned error:", apiResponse.message)
          setIsRaspiConnected(false)
        }

      } catch (error) {
        console.error("❌ Failed to fetch sensor data:", error)
        setIsRaspiConnected(false)
        // Dashboard continues showing last known values
      }
      
      setCurrentTime(new Date())
    }

    // Fetch immediately on mount
    fetchSensorData()
    
    // Then fetch every 3 seconds
    const interval = setInterval(fetchSensorData, 3000)

    return () => clearInterval(interval)
  }, [thresholds])

  // Handle control save
  const handleQuickControlsSave = async () => {
    try {
      const API_URL = "/api/controls"

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localControls),
      })

      if (!response.ok) {
        throw new Error(`Failed to update controls: ${response.status}`)
      }

      quickSaveControls({ ...localControls })
      alert("✅ Controls successfully saved to system.")
      setShowControlsModal(false)

    } catch (error) {
      console.error("Error saving controls:", error)
      alert("❌ Failed to connect to the system. Check Raspberry Pi connection.")
    }
  }
  // Controls Modal Component
  const ControlsModal = () => {
    const handleLocalControlChange = (key: keyof ControlState, val: boolean) => 
      setLocalControls(prev => ({ ...prev, [key]: val }))
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="w-full bg-white rounded-t-3xl p-6 max-w-md mx-auto max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Controls</h2>
            <button 
              onClick={() => setShowControlsModal(false)} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-3">
            <ControlToggle 
              label="Submersible Pump" 
              icon={Waves} 
              active={localControls.pump} 
              onChange={val => handleLocalControlChange('pump', val)} 
            />
            <ControlToggle 
              label="DC Fan" 
              icon={Wind} 
              active={localControls.fan} 
              onChange={val => handleLocalControlChange('fan', val)} 
            />
            <ControlToggle 
              label="pH Adjustment" 
              icon={Droplets} 
              active={localControls.phAdjustment} 
              onChange={val => handleLocalControlChange('phAdjustment', val)} 
            />
            <ControlToggle 
              label="Aerator" 
              icon={Activity} 
              active={localControls.aerator} 
              onChange={val => handleLocalControlChange('aerator', val)} 
            />
            <ControlToggle 
              label="Grow Light" 
              icon={Sun} 
              active={localControls.growLight} 
              onChange={val => handleLocalControlChange('growLight', val)} 
            />
          </div>
          <button 
            onClick={handleQuickControlsSave} 
            className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
          >
            Save Controls
          </button>
        </div>
      </div>
    )
  }

  // Camera Modal Component  
  const CameraModal = ({ 
    isConnected, 
    streamUrl, 
    onClose 
  }: { 
    isConnected: boolean; 
    streamUrl: string; 
    onClose: () => void 
  }) => {
    const [modalStreamError, setModalStreamError] = useState(false)
    const [modalStreamLoading, setModalStreamLoading] = useState(true)

    const handleStreamLoad = () => {
      setModalStreamLoading(false)
      setModalStreamError(false)
    }

    const handleStreamError = () => {
      setModalStreamLoading(false)
      setModalStreamError(true)
    }

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-white font-bold">Live Camera Feed</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected && !modalStreamError ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                {isConnected && !modalStreamError ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Stream Container */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative">
          {/* Loading State */}
          {modalStreamLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <div className="text-lg font-semibold">Connecting to camera...</div>
              </div>
            </div>
          )}

          {/* Live Stream */}
          {isConnected && !modalStreamError ? (
            <img
              src={streamUrl}
              alt="Live Aquaponics Camera Feed"
              className="w-full h-full object-contain"
              onLoad={handleStreamLoad}
              onError={handleStreamError}
            />
          ) : (
          /* Disconnected State */
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-orange-900/30 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <Camera className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <div className="text-2xl font-semibold mb-2">Camera Stream Unavailable</div>
              <div className="text-sm opacity-70 mb-4">
                {modalStreamError ? 'Failed to load stream' : 'Camera is offline'}
              </div>
              <div className="text-xs opacity-50 font-mono bg-black/30 px-3 py-2 rounded">
                {streamUrl}
              </div>
            </div>
          </div>
        )}

        {/* Stream Overlay Info */}
        {isConnected && !modalStreamError && !modalStreamLoading && (
          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded-lg text-white backdrop-blur-sm">
            <div className="text-sm font-semibold font-mono">
              {new Date().toLocaleTimeString()}
            </div>
            <div className="text-xs text-gray-300">
              1080p • 30fps • Live
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer with Actions */}
      <div className="p-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Close
          </button>
          <Link 
            href="/camera"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Open Full Camera App →
          </Link>
        </div>
      </div>
    </div>
  )
}

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <Navbar time={currentTime.toLocaleTimeString()} isConnected={isRaspiConnected} />
      
      <div className="space-y-5 pb-24 px-4 py-5">
        {/* System Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">GROWUP</h1>
              <p className="text-emerald-100 text-sm">Aquaponics Tower System</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentTime.toLocaleTimeString()}</div>
              <div className="text-xs text-emerald-100 flex items-center justify-end gap-1 mt-1">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xs text-emerald-100">Plants</div>
              <div className="text-xl font-bold">4</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xs text-emerald-100">Health</div>
              <div className="text-xl font-bold">94%</div>
            </div>
            <div className="bg-white/20 rounded-lg p-2">
              <div className="text-xs text-emerald-100">Uptime</div>
              <div className="text-xl font-bold">99.8%</div>
            </div>
          </div>
        </div>

        {/* System Status & Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 ${status.color} rounded-full animate-pulse`}></div>
              <div>
                <div className="font-semibold text-gray-900">{status.text}</div>
                <div className="text-xs text-gray-500">
                  {isRaspiConnected ? "All sensors operational" : "Connection lost"}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowControlsModal(true)} 
              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Controls
            </button>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div 
            className="bg-gray-900 aspect-video relative overflow-hidden group cursor-pointer" 
            onClick={() => setShowCameraModal(true)}
          >
            {/* Loading State */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <div className="text-xs">Connecting to camera...</div>
                </div>
              </div>
            )}

            {/* Connected Stream */}
            {!cameraLoading && isCameraConnected ? (
              <>
                <img
                  src={LIVE_STREAM_URL}
                  alt="Live Preview"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  style={{ filter: 'brightness(0.85)' }}
                />
                {/* Live Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/90 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-bold">LIVE</span>
                </div>
              </>
            ) : !cameraLoading && !isCameraConnected ? (
              /* Disconnected State */
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center text-white p-4">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <div className="text-sm font-semibold mb-1">Camera Offline</div>
                  <div className="text-xs text-gray-400">Check Raspberry Pi connection</div>
                </div>
              </div>
            ) : null}

            {/* Timestamp Overlay */}
            <div className="absolute bottom-3 left-3 bg-black/70 px-2.5 py-1.5 rounded-lg text-white text-xs font-mono backdrop-blur-sm">
              {currentTime.toLocaleTimeString()}
            </div>

            {/* Fullscreen Button (shows on hover) */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowCameraModal(true)
              }} 
              className="absolute bottom-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Connection Status Indicator */}
            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-lg ${
              isCameraConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
          </div>

          {/* Camera Info Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600 font-medium">
                  {isCameraConnected ? 'Live Tower Feed' : 'Camera Disconnected'}
                </span>
              </div>
              <Link 
                href="/camera" 
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                View Full →
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Alerts & Notifications
            </h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
              {alerts.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  expandedAlert === alert.id ? "bg-gray-50" : ""
                }`} 
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    alert.severity === "high" ? "bg-red-100" : 
                    alert.severity === "medium" ? "bg-amber-100" : "bg-emerald-100"
                  }`}>
                    {alert.type === "warning" ? (
                      <AlertTriangle className={`w-4 h-4 ${
                        alert.severity === "high" ? "text-red-600" : "text-amber-600"
                      }`} />
                    ) : alert.severity === "low" && alert.title.includes("Maintenance") ? (
                      <Clock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{alert.title}</div>
                    {expandedAlert === alert.id && (
                      <div className="text-xs text-gray-600 mt-2">{alert.message}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">{alert.time}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                    expandedAlert === alert.id ? "rotate-180" : ""
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Metrics */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">Critical Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            <SensorCard 
              icon={Thermometer} 
              title="Water Temp" 
              value={sensorData.waterTemp} 
              unit="°C" 
              min={20} 
              max={26} 
              color="bg-blue-500" 
            />
            <SensorCard 
              icon={Droplets} 
              title="pH Level" 
              value={sensorData.ph} 
              unit="" 
              min={6.5} 
              max={7.5} 
              color="bg-purple-500" 
            />
            <SensorCard 
              icon={Activity} 
              title="Dissolved O₂" 
              value={sensorData.dissolvedO2} 
              unit="mg/L" 
              min={5} 
              max={8} 
              color="bg-green-500" 
            />
            <SensorCard 
              icon={Fish} 
              title="Ammonia" 
              value={sensorData.ammonia} 
              unit="ppm" 
              min={0} 
              max={1} 
              color="bg-orange-500" 
            />
          </div>
        </div>

        {/* System Metrics */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">System Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            <SensorCard 
              icon={Waves} 
              title="Water Level" 
              value={Math.round(sensorData.waterLevel)} 
              unit="%" 
              min={70} 
              max={100} 
              color="bg-cyan-500" 
            />
            <SensorCard 
              icon={Gauge} 
              title="Flow Rate" 
              value={sensorData.waterFlow} 
              unit="L/min" 
              min={3} 
              max={6} 
              color="bg-indigo-500" 
            />
            <SensorCard 
              icon={Zap} 
              title="Light Level" 
              value={sensorData.lightIntensity} 
              unit="lux" 
              min={10000} 
              max={20000} 
              color="bg-yellow-500" 
            />
            <SensorCard 
              icon={Wind} 
              title="Humidity" 
              value={sensorData.humidity} 
              unit="%" 
              min={50} 
              max={80} 
              color="bg-sky-500" 
            />
            <SensorCard 
              icon={Gauge} 
              title="Air Pressure" 
              value={sensorData.airPressure} 
              unit="hPa" 
              min={990} 
              max={1030} 
              color="bg-red-500" 
            />
            <SensorCard 
              icon={Thermometer} 
              title="Air Temp" 
              value={sensorData.airTemp} 
              unit="°C" 
              min={20} 
              max={30} 
              color="bg-orange-500" 
            />
          </div>
        </div>
      </div>

      <BottomNavigation />
      {showControlsModal && <ControlsModal />}
      {showCameraModal && (
        <CameraModal
          isConnected={isCameraConnected}
          streamUrl={LIVE_STREAM_URL}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  )
}
