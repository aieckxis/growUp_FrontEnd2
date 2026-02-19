"use client"

import { Waves, Wind, Droplets, Activity } from "lucide-react"
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
          label="Submersible Pump"
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
          label="pH Adjustment"
          icon={Droplets}
          active={controls.phAdjustment}
          onChange={(val) => onChange({ ...controls, phAdjustment: val })}
        />
        <ControlToggle
          label="Aerator"
          icon={Activity}
          active={controls.aerator}
          onChange={(val) => onChange({ ...controls, aerator: val })}
        />
      </div>
    </div>
  )
}
