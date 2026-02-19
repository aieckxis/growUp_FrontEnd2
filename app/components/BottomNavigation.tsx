"use client"

import type React from "react"

import { Home, Camera, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavTab {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: NavTab[] = [
  { id: "dashboard", label: "Home", href: "/dashboard", icon: Home },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { id: "camera", label: "Camera", href: "/camera", icon: Camera },
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
]

export const BottomNavigation = () => {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg">
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
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
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