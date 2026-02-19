import type React from "react"
export interface SensorData {
  airTemp: number
  waterTemp: number
  humidity: number
  ph: number
  waterLevel: number
  waterFlow: number
  ammonia: number
  nitrates: number
  dissolvedO2: number
  lightIntensity: number
}

export interface SystemControls {
  pump: boolean
  fan: boolean
  phAdjustment: boolean
  aerator: boolean
}

export interface AlertNotification {
  id: number
  type: "warning" | "success" | "info"
  severity: "low" | "medium" | "high"
  title: string
  message: string
  time: string
  action: string
}

export interface GrowthData {
  day: string
  height: number
  leaves: number
  health: number
}

export interface SensorTrend {
  time: string
  temp: number
  ph: number
  do: number
}

export interface AutomationPreset {
  name: string
  time: string
  active: boolean
}

export interface PlantDetection {
  name: string
  status: "Healthy" | "Growing" | "Monitor" | "Ready Soon"
  color: "emerald" | "amber"
}

export interface ThresholdRange {
  label: string
  min: string
  max: string
}

export type ThresholdStatus = "good" | "warning" | "critical"

export interface SensorConfig {
  icon: React.ComponentType<{ className?: string }>
  title: string
  unit: string
  min: number
  max: number
  color: string
}
