export const SENSOR_UPDATE_INTERVAL = 3000 // 3 seconds

export const SENSOR_RANGES = {
  airTemp: { min: 18, max: 24 },
  waterTemp: { min: 20, max: 25 },
  ph: { min: 6.5, max: 7.5 },
  dissolvedO2: { min: 6.5, max: 8.0 },
  lightIntensity: { min: 300, max: 600 },
  waterLevel: { min: 70, max: 100 },
  waterFlow: { min: 0.8, max: 1.5 },
  nitrates: { min: 5, max: 150 },
  humidity: { min: 50, max: 80 },
  ammonia: { min: 0, max: 0.05 },
}

export const ALERT_THRESHOLD_DEFAULTS = [
  { label: "Air Temp (°C)", min: 18, max: 24 },
  { label: "Water Temp (°C)", min: 20, max: 25 },
  { label: "pH Level", min: 6.5, max: 7.5 },
  { label: "Dissolved O₂ (mg/L)", min: 6.5, max: 8.0 },
  { label: "Light Intensity (lux)", min: 300, max: 600 },
  { label: "Water Level (%)", min: 70, max: 100 },
  { label: "Water Flow (L/min)", min: 0.8, max: 1.5 },
  { label: "Nitrates (mg/L)", min: 5, max: 150 },
  { label: "Humidity (%)", min: 50, max: 80 },
  { label: "Ammonia (mg/L)", min: 0, max: 0.05 },
]

export const AUTOMATION_PRESETS = [
  { name: "Morning Boost", time: "06:00 AM", active: true },
  { name: "Evening Cycle", time: "06:00 PM", active: true },
  { name: "Night Mode", time: "10:00 PM", active: false },
]

export const PLANT_DETECTIONS = [
  { name: "Kale Plant #1", status: "Healthy" as const, color: "emerald" as const },
  { name: "Kale Plant #2", status: "Growing" as const, color: "emerald" as const },
  { name: "Kale Plant #3", status: "Monitor" as const, color: "amber" as const },
  { name: "Kale Plant #4", status: "Ready Soon" as const, color: "emerald" as const },
]

export const WEEKLY_GROWTH_DATA = [
  { day: "Mon", height: 12.5, leaves: 6, health: 85 },
  { day: "Tue", height: 13.2, leaves: 7, health: 87 },
  { day: "Wed", height: 14.1, leaves: 8, health: 89 },
  { day: "Thu", height: 14.8, leaves: 9, health: 91 },
  { day: "Fri", height: 15.6, leaves: 10, health: 92 },
  { day: "Sat", height: 16.2, leaves: 11, health: 93 },
  { day: "Sun", height: 17.1, leaves: 12, health: 94 },
]

export const SENSOR_TREND_DATA = [
  {
    time: "00:00",
    airTemp: 22.1,
    waterTemp: 21.0,
    ph: 6.7,
    dissolvedO2: 7.0,
    lightIntensity: 350,
    waterLevel: 85,
    waterFlow: 1.2,
    nitrates: 12,
    humidity: 65,
    ammonia: 0.01,
  },
  {
    time: "04:00",
    airTemp: 21.8,
    waterTemp: 21.2,
    ph: 6.8,
    dissolvedO2: 7.2,
    lightIntensity: 300,
    waterLevel: 84,
    waterFlow: 1.1,
    nitrates: 13,
    humidity: 64,
    ammonia: 0.01,
  },
  {
    time: "08:00",
    airTemp: 22.5,
    waterTemp: 22.0,
    ph: 6.9,
    dissolvedO2: 7.1,
    lightIntensity: 400,
    waterLevel: 86,
    waterFlow: 1.3,
    nitrates: 14,
    humidity: 66,
    ammonia: 0.02,
  },
  {
    time: "12:00",
    airTemp: 23.2,
    waterTemp: 22.5,
    ph: 6.8,
    dissolvedO2: 6.9,
    lightIntensity: 500,
    waterLevel: 87,
    waterFlow: 1.4,
    nitrates: 15,
    humidity: 67,
    ammonia: 0.02,
  },
  {
    time: "16:00",
    airTemp: 22.8,
    waterTemp: 22.3,
    ph: 6.7,
    dissolvedO2: 7.3,
    lightIntensity: 450,
    waterLevel: 85,
    waterFlow: 1.2,
    nitrates: 13,
    humidity: 66,
    ammonia: 0.01,
  },
  {
    time: "20:00",
    airTemp: 22.3,
    waterTemp: 22.1,
    ph: 6.8,
    dissolvedO2: 7.2,
    lightIntensity: 350,
    waterLevel: 84,
    waterFlow: 1.1,
    nitrates: 12,
    humidity: 65,
    ammonia: 0.01,
  },
]

export const INITIAL_SENSOR_DATA = {
  airTemp: 26.5,
  waterTemp: 22.3,
  humidity: 68,
  ph: 6.8,
  waterLevel: 85,
  waterFlow: 1.2,
  ammonia: 0.02,
  nitrates: 5.2,
  dissolvedO2: 7.1,
  lightIntensity: 450,
}

export const INITIAL_CONTROLS = {
  pump: true,
  fan: true,
  phAdjustment: false,
  aerator: true,
}

export const ALERTS_DATA = [
  {
    id: 1,
    type: "warning" as const,
    severity: "medium" as const,
    title: "pH Level Alert",
    message: "pH slightly elevated (6.8). Recommend monitoring.",
    time: "2 min ago",
    action: "Monitor",
  },
  {
    id: 2,
    type: "success" as const,
    severity: "low" as const,
    title: "System Optimal",
    message: "Water flow rate and temperature within ideal range.",
    time: "5 min ago",
    action: "Dismiss",
  },
  {
    id: 3,
    type: "info" as const,
    severity: "low" as const,
    title: "Maintenance Due",
    message: "Filter cleaning recommended in 3 days.",
    time: "1 hour ago",
    action: "Schedule",
  },
]