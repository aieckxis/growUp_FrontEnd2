"use client"

import { Waves, Wind, Sun, Droplets } from "lucide-react"
import { ControlToggle } from "@/app/(routes)/dashboard/components/ControlToggle"
import type { SystemControls } from "@/lib/types"

interface ControlPanelProps {
  controls: SystemControls
  onChange: (controls: SystemControls) => void
}

export const ControlPanel = ({ controls, onChange }: ControlPanelProps) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4">System Controls</h3>
      <div className="space-y-3">
        <ControlToggle
          label="Dosing Pump"
          icon={Waves}
          active={controls.pump}
          onChange={(val) => onChange({ ...controls, pump: val })}
        />
        <ControlToggle
          label="DC Fan"
          icon={Wind}
          active={controls.fan}
          onChange={(val) => onChange({ ...controls, fan: val })}
        />
        <ControlToggle
          label="Grow Light"
          icon={Sun}
          active={controls.growLight}
          onChange={(val) => onChange({ ...controls, growLight: val })}
        />
        <ControlToggle
          label="Humidity Controller"
          icon={Droplets}
          active={controls.humidityController}
          onChange={(val) => onChange({ ...controls, humidityController: val })}
        />
      </div>
    </div>
  )
}