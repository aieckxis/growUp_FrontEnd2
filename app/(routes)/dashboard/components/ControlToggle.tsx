"use client"

import type { LucideIcon } from "lucide-react"

interface ControlToggleProps {
  label: string
  icon: LucideIcon
  active: boolean
  onChange: (value: boolean) => void
}

export const ControlToggle = ({ label, icon: Icon, active, onChange }: ControlToggleProps) => (
  <button
    onClick={() => onChange(!active)}
    className={`flex items-center justify-between w-full p-4 rounded-xl transition-all ${
      active ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50 border border-gray-200"
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${active ? "bg-emerald-500" : "bg-gray-400"}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="font-semibold text-gray-900">{label}</span>
    </div>
    <div
      className={`w-12 h-6 rounded-full transition-all ${
        active ? "bg-emerald-500" : "bg-gray-300"
      } flex items-center p-1`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full transition-transform ${active ? "translate-x-6" : "translate-x-0"}`}
      ></div>
    </div>
  </button>
)
