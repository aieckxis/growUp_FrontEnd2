"use client"

import { controlDevice, mapControlToComponent, setSystemMode } from "@/lib/api/device-control"
import { useState, useEffect } from "react"
import {
  Waves,
  Wind,
  Droplets,
  Activity,
  Zap,
  Sun,
  Bell,
  Thermometer,
  AlertTriangle,
  Home,
  Camera,
  Settings,
  BarChart3,
  CheckCircle,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* TYPES & INITIAL STATES */

interface SensorDataState {
  waterTemp: number;
  ph: number;
  airTemp: number;
  waterFlow: number;
  airHumidity: number;
  lightIntensity: number;
  waterLevel: number;
  airPressure: number;
}

interface AlertData {
  id: number;
  type: "warning" | "error" | "info";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  time: string;
}

interface SystemControls { pump: boolean; fan: boolean; growLight: boolean; humidityController: boolean; }

type ControlMode = 'AUTOMATIC' | 'MANUAL';

interface ThresholdState {
  waterTemp: { min: number; max: number };
  ph: { min: number; max: number };
  airTemp: { min: number; max: number };
  waterFlow: { min: number; max: number };
  airHumidity: { min: number; max: number };
  lightIntensity: { min: number; max: number };
  waterLevel: { min: number; max: number };
  airPressure: { min: number; max: number };
}
interface ControlToggleProps { 
  label: string; 
  description: string; 
  icon: React.ElementType; 
  active: boolean; 
  onChange: (val: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}
interface PresetCardProps { title: string; description: string; icon: React.ElementType; active: boolean; onActivate: () => void; disabled?: boolean; }
interface ThresholdRangeInputProps {
  label: string;
  unit: string;
  icon: React.ElementType;
  minValue: number;
  maxValue: number;
  minLimit: number;
  maxLimit: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
}

/* --- Custom Hook Logic (Unified with localStorage for sync) --- */
const INITIAL_CONTROLS_FULL: SystemControls = { pump: true, fan: false, growLight: true, humidityController: false }

const INITIAL_THRESHOLDS: ThresholdState = {
  waterTemp: { min: 22, max: 26 },
  ph: { min: 6.5, max: 7.5 },
  airTemp: { min: 22, max: 28 },
  waterFlow: { min: 8, max: 12 },
  airHumidity: { min: 50, max: 70 },
  lightIntensity: { min: 500, max: 1500 },
  waterLevel: { min: 70, max: 100 },
  airPressure: { min: 1000, max: 1025 },
}

const localStorageKey = 'aquaponics_settings_state';

// --- DYNAMIC ALERT SYSTEM ---

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hrs ago`
}

const generateAlerts = (
  sensor: SensorDataState,
  thresholds: ThresholdState & {
    waterFlow?: { min: number; max: number };
    airHumidity?: { min: number; max: number };
    lightIntensity?: { min: number; max: number };
  }
): AlertData[] => {
  const now = new Date()
  const alerts: AlertData[] = []
  let alertId = 10;

  if (sensor.waterTemp < thresholds.waterTemp.min) {
    alerts.push({
      id: 1, type: "warning", severity: "medium", title: "Water Temperature Low",
      message: `Current water temperature is ${sensor.waterTemp}°C, below optimal range.`, time: timeAgo(now),
    })
  }
  if (sensor.waterTemp > thresholds.waterTemp.max) {
    alerts.push({
      id: 2, type: "warning", severity: "medium", title: "Water Temperature High",
      message: `Water temperature is ${sensor.waterTemp}°C, above optimal range.`, time: timeAgo(now),
    })
  }

  if (sensor.ph < thresholds.ph.min) {
    alerts.push({
      id: 3, type: "warning", severity: "medium", title: "pH Level Low",
      message: `Current pH is ${sensor.ph}. Below optimal for plants & bacteria.`, time: timeAgo(now),
    })
  }
  if (sensor.ph > thresholds.ph.max) {
    alerts.push({
      id: 4, type: "warning", severity: "medium", title: "pH Level High",
      message: `Current pH is ${sensor.ph}. Above safe range.`, time: timeAgo(now),
    })
  }

  if (thresholds.waterFlow && sensor.waterFlow !== undefined) {
    if (sensor.waterFlow < thresholds.waterFlow.min) {
      alerts.push({
        id: 8, type: "error", severity: "critical", title: "PUMP ERROR: Water Flow Low",
        message: `Current water flow is ${sensor.waterFlow} L/min, potentially indicating a pump malfunction or blockage.`, time: timeAgo(now),
      })
    }
    if (sensor.waterFlow > thresholds.waterFlow.max) {
      alerts.push({
        id: 9, type: "warning", severity: "medium", title: "Water Flow High",
        message: `Current water flow is ${sensor.waterFlow} L/min, check for possible pipe breaches or sensor error.`, time: timeAgo(now),
      })
    }
  }

  if (sensor.airTemp < thresholds.airTemp.min) {
    alerts.push({
      id: alertId++, type: "warning", severity: "low", title: "Air Temperature Low",
      message: `Air temperature is ${sensor.airTemp}°C. May stunt plant growth.`, time: timeAgo(now),
    })
  }
  if (sensor.airTemp > thresholds.airTemp.max) {
    alerts.push({
      id: alertId++, type: "warning", severity: "medium", title: "Air Temperature High",
      message: `Air temperature is ${sensor.airTemp}°C. Check DC Fan operation.`, time: timeAgo(now),
    })
  }

  if (thresholds.airHumidity && sensor.airHumidity !== undefined) {
    if (sensor.airHumidity > thresholds.airHumidity.max) {
      alerts.push({
        id: alertId++, type: "warning", severity: "low", title: "Air Humidity High",
        message: `Humidity is ${sensor.airHumidity}%. High risk of mold/fungus. Fan may be required.`, time: timeAgo(now),
      })
    }
    if (sensor.airHumidity < thresholds.airHumidity.min) {
      alerts.push({
        id: alertId++, type: "warning", severity: "low", title: "Air Humidity Low",
        message: `Humidity is ${sensor.airHumidity}%. Risk of plant dehydration.`, time: timeAgo(now),
      })
    }
  }

  if (thresholds.lightIntensity && sensor.lightIntensity !== undefined) {
    if (sensor.lightIntensity < thresholds.lightIntensity.min) {
      alerts.push({
        id: alertId++, type: "warning", severity: "medium", title: "Low Light Intensity",
        message: `Light intensity is ${sensor.lightIntensity} Lux. Below target for optimal growth.`, time: timeAgo(now),
      })
    }
    if (sensor.lightIntensity > thresholds.lightIntensity.max) {
      alerts.push({
        id: alertId++, type: "info", severity: "low", title: "High Light Intensity",
        message: `Light intensity is ${sensor.lightIntensity} Lux. Check light schedule or cooling.`, time: timeAgo(now),
      })
    }
  }

  if (thresholds.waterLevel && sensor.waterLevel !== undefined) {
    if (sensor.waterLevel < thresholds.waterLevel.min) {
      alerts.push({
        id: alertId++, type: "warning", severity: "medium", title: "Water Level Low",
        message: `Water level is ${sensor.waterLevel}%. Check reservoir.`, time: timeAgo(now),
      })
    }
    if (sensor.waterLevel > thresholds.waterLevel.max) {
      alerts.push({
        id: alertId++, type: "warning", severity: "medium", title: "Water Level High",
        message: `Water level is ${sensor.waterLevel}%. Check overflow or sensor calibration.`, time: timeAgo(now),
      })
    }
  }

  if (thresholds.airPressure && sensor.airPressure !== undefined) {
    if (sensor.airPressure < thresholds.airPressure.min) {
      alerts.push({
        id: alertId++, type: "warning", severity: "low", title: "Air Pressure Low",
        message: `Air pressure is ${sensor.airPressure} hPa. Below optimal range.`, time: timeAgo(now),
      })
    }
    if (sensor.airPressure > thresholds.airPressure.max) {
      alerts.push({
        id: alertId++, type: "warning", severity: "low", title: "Air Pressure High",
        message: `Air pressure is ${sensor.airPressure} hPa. Above optimal range.`, time: timeAgo(now),
      })
    }
  }

  return alerts
}

const checkSystemStatus = (alerts: AlertData[]): 'Optimal' | 'Alerts Active' => {
  if (alerts.length === 0) {
    return 'Optimal';
  }
  return 'Alerts Active';
};
/**
 * Synchronously loads state from localStorage.
 */
const loadState = (): { 
  controls: SystemControls, 
  activePreset: string, 
  thresholds: ThresholdState,
  controlMode: ControlMode 
} => {
  try {
    const savedState = localStorage.getItem(localStorageKey);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        controls: parsedState.controls || INITIAL_CONTROLS_FULL,
        activePreset: parsedState.activePreset || "balanced",
        controlMode: parsedState.controlMode || 'AUTOMATIC',
        thresholds: {
          ...INITIAL_THRESHOLDS,
          ...parsedState.thresholds,
          airTemp: parsedState.thresholds?.airTemp || INITIAL_THRESHOLDS.airTemp
        }
      };
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return { 
    controls: INITIAL_CONTROLS_FULL, 
    activePreset: "balanced", 
    controlMode: 'AUTOMATIC',
    thresholds: INITIAL_THRESHOLDS 
  };
};

/**
 * Synchronously saves state to localStorage.
 */
const saveState = (state: { 
  controls: SystemControls, 
  activePreset: string, 
  thresholds: ThresholdState,
  controlMode: ControlMode 
}) => {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
};

const useAquaponicsSettings = () => {
  const [state, setState] = useState(loadState);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === localStorageKey && e.newValue) {
        const newState = JSON.parse(e.newValue);
        setState(newState);
        setHasChanges(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setControls = (newControls: SystemControls) => {
    setState(prevState => ({ ...prevState, controls: newControls }));
    setHasChanges(true);
  };

  const setThresholds = (newThresholds: ThresholdState) => {
    setState(prevState => ({ ...prevState, thresholds: newThresholds }))
    setHasChanges(true)
  }

  const setControlMode = (newMode: ControlMode) => {
    setState(prevState => ({ ...prevState, controlMode: newMode }))
    setHasChanges(true)
  }

  const setPreset = (newPreset: string) => {
    setState(prevState => ({ ...prevState, activePreset: newPreset }))
    setHasChanges(true)
  }

  const handleSave = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          saveState(state)
          setHasChanges(false)
          console.log('Settings saved to localStorage (deferred):', state)
          resolve(true)
        } catch (error) {
          console.error('Deferred save failed:', error)
          resolve(false)
        }
      }, 0)
    });
  };

  return {
    controls: state.controls,
    activePreset: state.activePreset,
    thresholds: state.thresholds,
    controlMode: state.controlMode,
    setControls,
    setThresholds,
    setControlMode,
    setPreset,
    handleSave,
    hasChanges,
    setHasChanges,
  };
};

/* COMPONENTS */

const Navbar: React.FC<{ time: string }> = ({ time }) => (
  <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
    <span className="font-bold text-gray-900">GROWUP</span>
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-gray-600">{time}</span>
    </div>
  </div>
)

const BottomNavigation = () => {
  const pathname = usePathname() || "/settings"
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
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700"
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

const ControlToggle: React.FC<ControlToggleProps> = ({ label, description, icon: Icon, active, onChange, loading = false, disabled = false }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl ${disabled ? 'bg-gray-100 opacity-60' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-3 flex-1">
      <div className={`p-2 rounded-lg ${disabled ? 'bg-gray-200' : active ? 'bg-emerald-100' : 'bg-gray-200'}`}>
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-emerald-600 rounded-full animate-spin"></div>
        ) : (
          <Icon className={`w-5 h-5 ${disabled ? 'text-gray-400' : active ? 'text-emerald-600' : 'text-gray-400'}`} />
        )}
      </div>
      <div className="flex-1">
        <div className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
    <button
      onClick={() => !loading && !disabled && onChange(!active)}
      disabled={loading || disabled}
      className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
        disabled ? 'bg-gray-300 cursor-not-allowed' :
        active ? 'bg-emerald-500' : 'bg-gray-300'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
)

const PresetCard: React.FC<PresetCardProps> = ({ title, description, icon: Icon, active, onActivate, disabled = false }) => (
  <button
    onClick={disabled ? undefined : onActivate}
    disabled={disabled}
    className={`relative w-full p-4 rounded-xl border-2 transition-all text-left ${
      disabled 
        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
        : active 
          ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className="flex flex-col items-center justify-center gap-2 h-full text-center">
      <div className={`p-2 rounded-lg flex-shrink-0 ${active && !disabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${active && !disabled ? 'text-emerald-600' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-900">{title}</div>
        <div className="text-[10px] text-gray-500 mt-1">{description}</div>
      </div>
      {active && !disabled && <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />}
    </div>
  </button>
)

const ThresholdRangeInput: React.FC<ThresholdRangeInputProps> = ({
  label,
  unit,
  icon: Icon,
  minValue,
  maxValue,
  minLimit,
  maxLimit,
  onMinChange,
  onMaxChange
}) => (
  <div className="p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-600" />
      <span className="font-medium text-gray-900 text-sm">{label}</span>
      {unit && <span className="text-xs text-gray-500 ml-auto">({unit})</span>}
    </div>

    <div className="flex items-center gap-3">
      <div className="flex-1">
        <span className="text-xs text-gray-500">Min</span>
        <input
          type="number"
          value={minValue}
          onChange={(e) => onMinChange(Number(e.target.value))}
          min={minLimit}
          max={maxLimit}
          step="0.1"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <span className="text-gray-400 font-medium mt-5">—</span>

      <div className="flex-1">
        <span className="text-xs text-gray-500">Max</span>
        <input
          type="number"
          value={maxValue}
          onChange={(e) => onMaxChange(Number(e.target.value))}
          min={minLimit}
          max={maxLimit}
          step="0.1"
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
    </div>

    <div className="flex justify-between text-xs text-gray-500 mt-3">
      <span>Min Limit: {minLimit}</span>
      <span>Max Limit: {maxLimit}</span>
    </div>
  </div>
)

/* MAIN SETTINGS COMPONENT */

export default function SettingsPage() {
  const {
    controls,
    activePreset,
    thresholds,
    controlMode,
    setControls,
    setThresholds,
    setControlMode,
    setPreset,
    handleSave,
    hasChanges,
  } = useAquaponicsSettings();

  const mockSensorData: SensorDataState = {
    waterTemp: 24.0,
    ph: 7.0,
    airTemp: 25.0,
    waterFlow: 10.0,
    airHumidity: 60.0,
    lightIntensity: 1000.0,
    waterLevel: 85.0,
    airPressure: 1013.0,
  };

  const currentAlerts = generateAlerts(mockSensorData, thresholds);
  const systemStatus = checkSystemStatus(currentAlerts);

  const [currentTime, setCurrentTime] = useState(new Date())
  const [controlLoadingStates, setControlLoadingStates] = useState<Record<string, boolean>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [presetWarning, setPresetWarning] = useState<string | null>(null)
  const [modeChanging, setModeChanging] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Enhanced control change handler with API integration and mode switch
  const handleControlChange = async (key: keyof SystemControls, val: boolean) => {
    const previousState = controls[key]
    const previousMode = controlMode
    
    // Switch to MANUAL mode when user manually changes a control
    if (controlMode === 'AUTOMATIC') {
      setControlMode('MANUAL')
      console.log('🔄 Switched to MANUAL mode due to user control change')
      
      // Send mode change to backend
      try {
        const modeResponse = await setSystemMode('MANUAL')
        if (!modeResponse.success) {
          console.error('⚠️ Failed to set MANUAL mode on backend:', modeResponse.error)
        }
      } catch (error) {
        console.error('⚠️ Failed to set MANUAL mode on backend:', error)
      }
    }
    
    // Optimistically update UI
    setControls({ ...controls, [key]: val })
    
    // Set loading state
    setControlLoadingStates(prev => ({ ...prev, [key]: true }))
    setErrorMessage(null)

    try {
      // Map control key to backend component name
      const component = mapControlToComponent(key)
      
      // Send API request to backend (deviceId = 1)
      const response = await controlDevice(1, component, val)

      if (!response.success) {
        throw new Error(response.error || 'Failed to control device')
      }

      // Success - keep the new state
      console.log(`✅ ${key} ${val ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      // Revert to previous state on error
      console.error(`❌ Failed to control ${key}:`, error)
      setControls({ ...controls, [key]: previousState })
      setControlMode(previousMode)
      setErrorMessage(error instanceof Error ? error.message : `Failed to control ${key}`)
    } finally {
      // Clear loading state
      setControlLoadingStates(prev => ({ ...prev, [key]: false }))
    }
  }

  // Helper function to get preset configuration
  const getPresetConfig = (preset: string): { controls: SystemControls; thresholds: ThresholdState } => {
    switch (preset) {
      case "balanced":
        return {
          controls: { pump: true, fan: false, growLight: true, humidityController: false },
          thresholds: {
            waterTemp: { min: 22.0, max: 26.0 },
            ph: { min: 6.5, max: 7.5 },
            airTemp: { min: 22.0, max: 28.0 },
            waterFlow: { min: 8.0, max: 12.0 },
            airHumidity: { min: 50.0, max: 70.0 },
            lightIntensity: { min: 800.0, max: 1500.0 },
            waterLevel: { min: 70.0, max: 100.0 },
            airPressure: { min: 1000.0, max: 1025.0 },
          }
        }

      case "highGrowth":
        return {
          controls: { pump: true, fan: true, growLight: true, humidityController: true },
          thresholds: {
            waterTemp: { min: 23.5, max: 25.0 },
            ph: { min: 6.0, max: 7.0 },
            airTemp: { min: 24.0, max: 26.0 },
            waterFlow: { min: 10.0, max: 15.0 },
            airHumidity: { min: 60.0, max: 80.0 },
            lightIntensity: { min: 1800.0, max: 2500.0 },
            waterLevel: { min: 70.0, max: 100.0 },
            airPressure: { min: 1010.0, max: 1020.0 },
          }
        }

      case "ecoMode":
        return {
          controls: { pump: true, fan: false, growLight: false, humidityController: false },
          thresholds: {
            waterTemp: { min: 21.0, max: 27.0 },
            ph: { min: 6.0, max: 8.0 },
            airTemp: { min: 20.0, max: 30.0 },
            waterFlow: { min: 5.0, max: 10.0 },
            airHumidity: { min: 40.0, max: 70.0 },
            lightIntensity: { min: 300.0, max: 800.0 },
            waterLevel: { min: 0.0, max: 100.0 },
            airPressure: { min: 990.0, max: 1030.0 },
          }
        }

      case "maintenance":
        return {
          controls: { pump: false, fan: true, growLight: false, humidityController: false },
          thresholds: {
            waterTemp: { min: 22.0, max: 26.0 },
            ph: { min: 6.5, max: 7.5 },
            airTemp: { min: 22.0, max: 28.0 },
            waterFlow: { min: 0.0, max: 1.0 },
            airHumidity: { min: 40.0, max: 80.0 },
            lightIntensity: { min: 0.0, max: 100.0 },
            waterLevel: { min: 0.0, max: 100.0 },
            airPressure: { min: 990.0, max: 1030.0 },
          }
        }

      default:
        return { controls, thresholds }
    }
  }

  // Helper function to apply preset controls to backend
  const applyPresetControls = async (presetControls: SystemControls) => {
    console.log('📤 Sending preset controls to backend...')
    const errors: string[] = []

    for (const [key, value] of Object.entries(presetControls)) {
      try {
        const component = mapControlToComponent(key)
        await controlDevice(1, component, value)
        console.log(`✅ Preset control ${key} → ${value}`)
      } catch (error) {
        console.error(`❌ Failed to apply preset control ${key}:`, error)
        errors.push(key)
      }
    }

    if (errors.length > 0) {
      setErrorMessage(`Failed to apply controls: ${errors.join(', ')}`)
    }
  }

  const handlePresetChange = async (preset: string) => {
    // Check if in MANUAL mode
    if (controlMode === 'MANUAL') {
      setPresetWarning('You are in MANUAL mode. Switch to AUTOMATIC mode to use presets.')
      return
    }

    setPreset(preset)
    setPresetWarning(null)

    const presetConfig = getPresetConfig(preset)
    
    setControls(presetConfig.controls)
    setThresholds(presetConfig.thresholds)

    // Apply preset controls to backend
    await applyPresetControls(presetConfig.controls)
  }

  const handleSaveChanges = async () => {
    const success = await handleSave();

    if (success) {
      alert('Settings saved successfully and synced!');
    } else {
      alert('Failed to save settings. Please try again.');
    }
  }

  const handleThresholdChange = (key: keyof ThresholdState, type: 'min' | 'max', val: number) => {
    setThresholds({
      ...thresholds,
      [key]: {
        ...thresholds[key],
        [type]: val,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      <Navbar time={currentTime.toLocaleTimeString()} />

      <div className="px-4 py-5 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your aquaponics system</p>
        </div>

        <div className="space-y-5">

          {/* Control Mode Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${controlMode === 'AUTOMATIC' ? 'bg-blue-500' : 'bg-orange-500'} animate-pulse`}></div>
                <h3 className="font-bold text-gray-900">
                  Control Mode: <span className={controlMode === 'AUTOMATIC' ? 'text-blue-600' : 'text-orange-600'}>
                    {controlMode}
                  </span>
                </h3>
              </div>
              <button
                onClick={async () => {
                  const newMode = controlMode === 'AUTOMATIC' ? 'MANUAL' : 'AUTOMATIC'
                  const previousMode = controlMode
                  
                  setModeChanging(true)
                  setControlMode(newMode)
                  setPresetWarning(null)
                  setErrorMessage(null)
                  console.log(`🔄 Switching to ${newMode} mode...`)
                  
                  try {
                    // Send mode change to backend
                    const response = await setSystemMode(newMode)
                    
                    if (!response.success) {
                      throw new Error(response.error || 'Failed to change system mode')
                    }
                    
                    console.log(`✅ Successfully switched to ${newMode} mode`)
                    
                    // If switching to AUTOMATIC, apply the current preset
                    if (newMode === 'AUTOMATIC') {
                      console.log(`🤖 Applying "${activePreset}" preset controls...`)
                      const presetConfig = getPresetConfig(activePreset)
                      setControls(presetConfig.controls)
                      setThresholds(presetConfig.thresholds)
                      await applyPresetControls(presetConfig.controls)
                    }
                  } catch (error) {
                    // Revert on error
                    console.error(`❌ Failed to switch mode:`, error)
                    setControlMode(previousMode)
                    setErrorMessage(error instanceof Error ? error.message : 'Failed to change system mode')
                  } finally {
                    setModeChanging(false)
                  }
                }}
                disabled={modeChanging}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  modeChanging 
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : controlMode === 'AUTOMATIC' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {modeChanging ? 'Switching...' : `Switch to ${controlMode === 'AUTOMATIC' ? 'Manual' : 'Automatic'}`}
              </button>
            </div>
            <p className="text-xs text-gray-600">
              {controlMode === 'AUTOMATIC' 
                ? `🤖 AUTOMATIC mode: Use presets to control the system. Manual controls are disabled.`
                : '✋ MANUAL mode: You have full control. Use toggles below to control devices individually.'}
            </p>
          </div>

          {/* 1. Automation Presets */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Automation Presets</h3>
              {controlMode === 'MANUAL' && (
                <span className="text-xs text-orange-600 font-semibold">⚠️ Disabled in Manual Mode</span>
              )}
            </div>
            
            {/* Preset Warning */}
            {presetWarning && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-orange-700">{presetWarning}</p>
                </div>
                <button
                  onClick={() => setPresetWarning(null)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <PresetCard title="Balanced Mode" description="Optimal standard settings" icon={Activity} active={activePreset === "balanced"} onActivate={() => handlePresetChange("balanced")} disabled={controlMode === 'MANUAL'} />
              <PresetCard title="High Growth Mode" description="Max resources for fast growth" icon={Zap} active={activePreset === "highGrowth"} onActivate={() => handlePresetChange("highGrowth")} disabled={controlMode === 'MANUAL'} />
              <PresetCard title="Eco Mode" description="Energy saving & reduced power" icon={Sun} active={activePreset === "ecoMode"} onActivate={() => handlePresetChange("ecoMode")} disabled={controlMode === 'MANUAL'} />
              <PresetCard title="Maintenance Mode" description="System shutdown for servicing" icon={AlertTriangle} active={activePreset === "maintenance"} onActivate={() => handlePresetChange("maintenance")} disabled={controlMode === 'MANUAL'} />
            </div>
          </div>

          {/* 2. Control Panel */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">System Controls</h3>
              {controlMode === 'AUTOMATIC' && (
                <span className="text-xs text-blue-600 font-semibold">⚠️ Disabled in Automatic Mode</span>
              )}
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Control Error</p>
                  <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Warning for AUTOMATIC mode */}
            {controlMode === 'AUTOMATIC' && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-blue-700">Manual controls are disabled. Use presets above or switch to MANUAL mode for individual control.</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <ControlToggle 
                label="Dosing Pump" 
                description="Main water circulation" 
                icon={Waves} 
                active={controls.pump} 
                onChange={(val) => handleControlChange('pump', val)}
                loading={controlLoadingStates.pump}
                disabled={controlMode === 'AUTOMATIC'}
              />
              <ControlToggle 
                label="DC Fan" 
                description="Air circulation & cooling" 
                icon={Wind} 
                active={controls.fan} 
                onChange={(val) => handleControlChange('fan', val)}
                loading={controlLoadingStates.fan}
                disabled={controlMode === 'AUTOMATIC'}
              />
              <ControlToggle 
                label="Grow Light" 
                description="LED lighting system" 
                icon={Sun} 
                active={controls.growLight} 
                onChange={(val) => handleControlChange('growLight', val)}
                loading={controlLoadingStates.growLight}
                disabled={controlMode === 'AUTOMATIC'}
              />
              <ControlToggle 
                label="Humidity Controller" 
                description="Automatic humidity management" 
                icon={Droplets} 
                active={controls.humidityController} 
                onChange={(val) => handleControlChange('humidityController', val)}
                loading={controlLoadingStates.humidityController}
                disabled={controlMode === 'AUTOMATIC'}
              />
            </div>
          </div>

          {/* 2. Alert Thresholds */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Alert Thresholds</h3>
            </div>
            <div className="space-y-3">
              <ThresholdRangeInput
                label="Water Temperature"
                unit="°C"
                icon={Thermometer}
                minValue={thresholds.waterTemp.min}
                maxValue={thresholds.waterTemp.max}
                minLimit={18}
                maxLimit={30}
                onMinChange={(val) => handleThresholdChange('waterTemp', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('waterTemp', 'max', val)}
              />
              <ThresholdRangeInput
                label="Air Temperature"
                unit="°C"
                icon={Wind}
                minValue={thresholds.airTemp.min}
                maxValue={thresholds.airTemp.max}
                minLimit={15}
                maxLimit={35}
                onMinChange={(val) => handleThresholdChange('airTemp', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('airTemp', 'max', val)}
              />
              <ThresholdRangeInput
                label="pH Level"
                unit=""
                icon={Droplets}
                minValue={thresholds.ph.min}
                maxValue={thresholds.ph.max}
                minLimit={6.0}
                maxLimit={8.0}
                onMinChange={(val) => handleThresholdChange('ph', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('ph', 'max', val)}
              />
              <ThresholdRangeInput
                label="Water Flow Rate"
                unit="L/min"
                icon={Waves}
                minValue={thresholds.waterFlow.min}
                maxValue={thresholds.waterFlow.max}
                minLimit={1}
                maxLimit={20}
                onMinChange={(val) => handleThresholdChange('waterFlow', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('waterFlow', 'max', val)}
              />
              <ThresholdRangeInput
                label="Air Humidity"
                unit="%"
                icon={Droplets}
                minValue={thresholds.airHumidity.min}
                maxValue={thresholds.airHumidity.max}
                minLimit={30}
                maxLimit={90}
                onMinChange={(val) => handleThresholdChange('airHumidity', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('airHumidity', 'max', val)}
              />
              <ThresholdRangeInput
                label="Grow Light Intensity"
                unit="Lux"
                icon={Sun}
                minValue={thresholds.lightIntensity.min}
                maxValue={thresholds.lightIntensity.max}
                minLimit={100}
                maxLimit={3000}
                onMinChange={(val) => handleThresholdChange('lightIntensity', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('lightIntensity', 'max', val)}
              />
              <ThresholdRangeInput
                label="Water Level"
                unit="%"
                icon={Waves}
                minValue={thresholds.waterLevel.min}
                maxValue={thresholds.waterLevel.max}
                minLimit={0}
                maxLimit={100}
                onMinChange={(val) => handleThresholdChange('waterLevel', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('waterLevel', 'max', val)}
              />
              <ThresholdRangeInput
                label="Air Pressure"
                unit="hPa"
                icon={Activity}
                minValue={thresholds.airPressure.min}
                maxValue={thresholds.airPressure.max}
                minLimit={980}
                maxLimit={1040}
                onMinChange={(val) => handleThresholdChange('airPressure', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('airPressure', 'max', val)}
              />
            </div>
          </div>

          {/* 3. System Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Firmware Version</span>
                <span className="font-semibold text-gray-900">v2.1.3</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">Last Update</span>
                <span className="font-semibold text-gray-900">2 days ago</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-100">
                <span className="text-gray-600">System Uptime</span>
                <span className="font-semibold text-gray-900">7d 14h 32m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-semibold text-gray-900">2.1GB / 32GB</span>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all ${hasChanges
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {hasChanges ? 'Save All Changes' : 'No Changes to Save'}
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}