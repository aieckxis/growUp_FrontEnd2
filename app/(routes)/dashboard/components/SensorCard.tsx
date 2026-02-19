"use client"

import { getThresholdStatus, calculatePercentage, getStatusColor } from "@/lib/sensor-utils"
import type { LucideIcon } from "lucide-react"

interface SensorCardProps {
  icon: LucideIcon
  title: string
  value: number
  unit: string
  min: number
  max: number
  color: string
}

export const SensorCard = ({ icon: Icon, title, value, unit, min, max, color }: SensorCardProps) => {
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
          {value}
          <span className="text-xs text-gray-500 ml-1 font-normal">{unit}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Range: {min}-{max}
          {unit}
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
