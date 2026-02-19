import type { ThresholdStatus } from "./types"

export const getThresholdStatus = (value: number, min: number, max: number): ThresholdStatus => {
  if (value < min || value > max) return "critical"
  if (value < min + (max - min) * 0.1 || value > max - (max - min) * 0.1) return "warning"
  return "good"
}

export const getStatusColor = (status: ThresholdStatus): string => {
  switch (status) {
    case "good":
      return "bg-emerald-500"
    case "warning":
      return "bg-amber-500"
    case "critical":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export const calculatePercentage = (value: number, min: number, max: number): number => {
  return ((value - min) / (max - min)) * 100
}

export const formatSensorValue = (value: number, decimals = 1): number => {
  return Number.parseFloat(value.toFixed(decimals))
}
