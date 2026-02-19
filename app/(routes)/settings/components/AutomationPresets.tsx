"use client"

import { Clock } from "lucide-react"
import { AUTOMATION_PRESETS } from "@/lib/constants"

export const AutomationPresets = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">Automation Presets</h3>
      <div className="space-y-3">
        {AUTOMATION_PRESETS.map((preset, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-600" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">{preset.name}</div>
                <div className="text-xs text-gray-500">{preset.time}</div>
              </div>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-all ${
                preset.active ? "bg-emerald-500" : "bg-gray-300"
              } flex items-center p-1`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  preset.active ? "translate-x-4" : "translate-x-0"
                }`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
