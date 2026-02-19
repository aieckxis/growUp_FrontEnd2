"use client"

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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/* TYPES & INITIAL STATES */

interface SensorDataState {
  waterTemp: number;
  ph: number;
  dissolvedO2: number;
  ammonia: number;
  airTemp: number;
  waterFlow: number;
  airHumidity: number;
  lightIntensity: number;
}

interface AlertData {
  id: number;
  type: "warning" | "error" | "info";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  time: string;
}

interface SystemControls { pump: boolean; fan: boolean; phAdjustment: boolean; aerator: boolean; growLight: boolean; }

interface ThresholdState {
  waterTemp: { min: number; max: number };
  ph: { min: number; max: number };
  dissolvedO2: { min: number; max: number };
  ammonia: { min: number; max: number };
  airTemp: { min: number; max: number };
  waterFlow: { min: number; max: number }; // For Submersible Pump
  airHumidity: { min: number; max: number }; // For DC Fan (relative humidity)
  lightIntensity: { min: number; max: number }; // For Grow Light
}
interface ControlToggleProps { label: string; description: string; icon: React.ElementType; active: boolean; onChange: (val: boolean) => void; }
interface PresetCardProps { title: string; description: string; icon: React.ElementType; active: boolean; onActivate: () => void; }
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
const INITIAL_CONTROLS_FULL: SystemControls = { pump: true, fan: false, phAdjustment: true, aerator: true, growLight: true, }

const INITIAL_THRESHOLDS: ThresholdState = {
  waterTemp: { min: 22, max: 26 },
  ph: { min: 6.5, max: 7.5 },
  dissolvedO2: { min: 5, max: 8 },
  ammonia: { min: 0, max: 0.5 },
  airTemp: { min: 22, max: 28 },
  waterFlow: { min: 8, max: 12 },
  airHumidity: { min: 50, max: 70 },
  lightIntensity: { min: 500, max: 1500 },
}

const localStorageKey = 'aquaponics_settings_state';

// --- DYNAMIC ALERT SYSTEM ---

// Convert time to human-readable
const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hrs ago`
}

// Generate alerts based on live sensor values
const generateAlerts = (
  sensor: SensorDataState,
  // Kailangan nating i-include ang lahat ng bagong threshold keys dito
  thresholds: ThresholdState & {
    waterFlow?: { min: number; max: number };
    airHumidity?: { min: number; max: number };
    lightIntensity?: { min: number; max: number };
  }
): AlertData[] => {
  const now = new Date()
  const alerts: AlertData[] = []
  let alertId = 10; // Start ID from 10, following existing IDs 1-9

  // --- Water Temperature (EXISTING) ---
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

  // --- pH Level (EXISTING) ---
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

  // --- Dissolved Oxygen (EXISTING) ---
  if (sensor.dissolvedO2 < thresholds.dissolvedO2.min) {
    alerts.push({
      id: 5, type: "warning", severity: "high", title: "Dissolved Oxygen Low",
      message: `DO is ${sensor.dissolvedO2} mg/L. Aeration required immediately.`, time: timeAgo(now),
    })
  }
  if (sensor.dissolvedO2 > thresholds.dissolvedO2.max) {
    alerts.push({
      id: 6, type: "info", severity: "low", title: "Dissolved Oxygen Slightly High",
      message: `DO is ${sensor.dissolvedO2} mg/L, slightly above optimal.`, time: timeAgo(now),
    })
  }

  // --- Ammonia (EXISTING) ---
  if (sensor.ammonia > thresholds.ammonia.max) {
    alerts.push({
      id: 7, type: "warning", severity: "high", title: "Ammonia Level High",
      message: `Ammonia at ${sensor.ammonia} ppm. Toxic levels detected.`, time: timeAgo(now),
    })
  }

  // --- Water Flow Rate (EXISTING) ---
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

  // --- 🌟 NEW ALERT LOGIC ADDITIONS 🌟 ---

  // --- Air Temperature ---
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

  // --- Air Humidity (DC Fan Control) ---
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

  // --- Light Intensity (Grow Light Control) ---
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

  // Return only alerts that triggered
  return alerts
}
/**
 * Checks overall system status based on generated alerts.
 * If alert list is empty, the system is running optimally.
 */
const checkSystemStatus = (alerts: AlertData[]): 'Optimal' | 'Alerts Active' => {
  if (alerts.length === 0) {
    return 'Optimal';
  }
  return 'Alerts Active';
};
/**
 * Synchronously loads state from localStorage.
 */
const loadState = (): { controls: SystemControls, activePreset: string, thresholds: ThresholdState } => {
  try {
    const savedState = localStorage.getItem(localStorageKey);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        controls: parsedState.controls || INITIAL_CONTROLS_FULL,
        activePreset: parsedState.activePreset || "balanced",
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
  return { controls: INITIAL_CONTROLS_FULL, activePreset: "balanced", thresholds: INITIAL_THRESHOLDS, };
};

/**
 * Synchronously saves state to localStorage.
 */
const saveState = (state: { controls: SystemControls, activePreset: string, thresholds: ThresholdState }) => {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state:', error);
    // Re-throw or handle error for Promise rejection if necessary
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

  // --- Unified Setter Functions (Sets changes flag) ---
  const setControls = (newControls: SystemControls) => {
    setState(prevState => ({ ...prevState, controls: newControls }));
    setHasChanges(true);
  };

  const setPreset = (newPreset: string) => {
    setState(prevState => ({ ...prevState, activePreset: newPreset }));
    setHasChanges(true);
  };

  const setThresholds = (newThresholds: ThresholdState) => {
    setState(prevState => ({ ...prevState, thresholds: newThresholds }));
    setHasChanges(true);
  };

  // 🌟 MODIFIED FOR INP FIX 🌟
  // We wrap the synchronous save operation in setTimeout(..., 0) to ensure it runs
  // in the next event loop, allowing the UI to update and preventing main thread blocking.
  const handleSave = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          saveState(state);
          setHasChanges(false);
          console.log('Settings saved to localStorage (deferred):', state);
          resolve(true);
        } catch (error) {
          console.error('Deferred save failed:', error);
          resolve(false);
        }
      }, 0); // Defer to the next event loop cycle
    });
  };

  return {
    controls: state.controls,
    activePreset: state.activePreset,
    thresholds: state.thresholds,
    setControls,
    setPreset,
    setThresholds,
    handleSave, // Now returns a Promise
    hasChanges,
    setHasChanges,
  };
};

/* COMPONENTS (Navbar, Nav, Toggles, Cards, Input) */

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

const ControlToggle: React.FC<ControlToggleProps> = ({ label, description, icon: Icon, active, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div className="flex items-center gap-3 flex-1">
      <div className={`p-2 rounded-lg ${active ? 'bg-emerald-100' : 'bg-gray-200'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
    <button
      onClick={() => onChange(!active)}
      className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
)

const PresetCard: React.FC<PresetCardProps> = ({ title, description, icon: Icon, active, onActivate }) => (
  <button
    onClick={onActivate}
    className={`relative w-full p-4 rounded-xl border-2 transition-all text-left ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
  >
    <div className="flex flex-col items-center justify-center gap-2 h-full text-center">
      <div className={`p-2 rounded-lg flex-shrink-0 ${active ? 'bg-emerald-100' : 'bg-gray-100'}`}>
        <Icon className={`w-6 h-6 ${active ? 'text-emerald-600' : 'text-gray-600'}`} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-900">{title}</div>
        <div className="text-[10px] text-gray-500 mt-1">{description}</div>
      </div>
      {active && <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />}
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
    setControls,
    setPreset,
    setThresholds,
    handleSave,
    hasChanges,
  } = useAquaponicsSettings();

  const mockSensorData: SensorDataState = {
    waterTemp: 24.0,
    ph: 7.0,
    dissolvedO2: 6.5,
    ammonia: 0.1,
    airTemp: 25.0,
    waterFlow: 10.0,
    airHumidity: 60.0,
    lightIntensity: 1000.0,
  };

  const currentAlerts = generateAlerts(mockSensorData, thresholds);
  // Ang variable na 'systemStatus' ay hindi na ginagamit sa JSX, pero kailangan pa rin ito para sa 'currentAlerts' logic.
  const systemStatus = checkSystemStatus(currentAlerts);

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleControlChange = (key: keyof SystemControls, val: boolean) => {
    setControls({ ...controls, [key]: val })
  }

  const handlePresetChange = (preset: string) => {
    setPreset(preset)

    let newControls: SystemControls = controls;
    let newThresholds: ThresholdState = thresholds;

    switch (preset) {
      case "balanced":
        newControls = { pump: true, fan: false, phAdjustment: true, aerator: true, growLight: true }
        newThresholds = {
          waterTemp: { min: 22.0, max: 26.0 },
          ph: { min: 6.5, max: 7.5 },
          dissolvedO2: { min: 5.5, max: 8.0 },
          ammonia: { min: 0.0, max: 0.2 },
          airTemp: { min: 22.0, max: 28.0 },
          waterFlow: { min: 8.0, max: 12.0 },
          airHumidity: { min: 50.0, max: 70.0 },
          lightIntensity: { min: 800.0, max: 1500.0 }
        }
        break

      case "highGrowth":
        newControls = { pump: true, fan: true, phAdjustment: true, aerator: true, growLight: true }
        newThresholds = {
          waterTemp: { min: 23.5, max: 25.0 },
          ph: { min: 6.0, max: 7.0 },
          dissolvedO2: { min: 6.0, max: 8.5 },
          ammonia: { min: 0.0, max: 0.1 },
          airTemp: { min: 24.0, max: 26.0 },
          waterFlow: { min: 10.0, max: 15.0 },
          airHumidity: { min: 60.0, max: 80.0 },
          lightIntensity: { min: 1800.0, max: 2500.0 }
        }
        break

      case "ecoMode":
        newControls = { pump: true, fan: false, phAdjustment: false, aerator: false, growLight: false }
        newThresholds = {
          waterTemp: { min: 21.0, max: 27.0 },
          ph: { min: 6.0, max: 8.0 },
          dissolvedO2: { min: 5.0, max: 8.0 },
          ammonia: { min: 0.0, max: 0.5 },
          airTemp: { min: 20.0, max: 30.0 },
          waterFlow: { min: 5.0, max: 10.0 },
          airHumidity: { min: 40.0, max: 70.0 },
          lightIntensity: { min: 300.0, max: 800.0 }
        }
        break

      case "maintenance":
        newControls = { pump: false, fan: true, phAdjustment: false, aerator: false, growLight: false }
        newThresholds = {
          waterTemp: { min: 22.0, max: 26.0 },
          ph: { min: 6.5, max: 7.5 },
          dissolvedO2: { min: 5.5, max: 8.0 },
          ammonia: { min: 0.0, max: 0.2 },
          airTemp: { min: 22.0, max: 28.0 },
          waterFlow: { min: 0.0, max: 1.0 },
          airHumidity: { min: 40.0, max: 80.0 },
          lightIntensity: { min: 0.0, max: 100.0 }
        }
        break
      default:
        newControls = controls;
        newThresholds = thresholds;
    }

    setControls(newControls);
    setThresholds(newThresholds);
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

          {/* 1. Automation Presets */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Automation Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              <PresetCard title="Balanced Mode" description="Optimal standard settings" icon={Activity} active={activePreset === "balanced"} onActivate={() => handlePresetChange("balanced")} />
              <PresetCard title="High Growth Mode" description="Max resources for fast growth" icon={Zap} active={activePreset === "highGrowth"} onActivate={() => handlePresetChange("highGrowth")} />
              <PresetCard title="Eco Mode" description="Energy saving & reduced power" icon={Sun} active={activePreset === "ecoMode"} onActivate={() => handlePresetChange("ecoMode")} />
              <PresetCard title="Maintenance Mode" description="System shutdown for servicing" icon={AlertTriangle} active={activePreset === "maintenance"} onActivate={() => handlePresetChange("maintenance")} />
            </div>
          </div>

          {/* 2. Control Panel */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">System Controls</h3>
            <div className="space-y-3">
              <ControlToggle label="Submersible Pump" description="Main water circulation" icon={Waves} active={controls.pump} onChange={(val) => handleControlChange('pump', val)} />
              <ControlToggle label="DC Fan" description="Air circulation & cooling" icon={Wind} active={controls.fan} onChange={(val) => handleControlChange('fan', val)} />
              <ControlToggle label="pH Adjustment" description="Automatic pH balancing" icon={Droplets} active={controls.phAdjustment} onChange={(val) => handleControlChange('phAdjustment', val)} />
              <ControlToggle label="Aerator" description="Oxygen circulation" icon={Activity} active={controls.aerator} onChange={(val) => handleControlChange('aerator', val)} />
              <ControlToggle label="Grow Light" description="LED lighting system" icon={Sun} active={controls.growLight} onChange={(val) => handleControlChange('growLight', val)} />
            </div>
          </div>

          {/* Alert Thresholds */}
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
                label="Dissolved Oxygen"
                unit="mg/L"
                icon={Activity}
                minValue={thresholds.dissolvedO2.min}
                maxValue={thresholds.dissolvedO2.max}
                minLimit={5}
                maxLimit={10}
                onMinChange={(val) => handleThresholdChange('dissolvedO2', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('dissolvedO2', 'max', val)}
              />
              <ThresholdRangeInput
                label="Ammonia Level"
                unit="ppm"
                icon={AlertTriangle}
                minValue={thresholds.ammonia.min}
                maxValue={thresholds.ammonia.max}
                minLimit={0.01}
                maxLimit={2}
                onMinChange={(val) => handleThresholdChange('ammonia', 'min', val)}
                onMaxChange={(val) => handleThresholdChange('ammonia', 'max', val)}
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
            </div>
          </div>

          {/* System Info */}
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