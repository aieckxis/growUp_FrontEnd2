"use client"

interface NavbarProps {
  title?: string
  showConnection?: boolean
}

export const Navbar = ({ title = "GROWUP", showConnection = true }: NavbarProps) => {
  return (
    <div className="bg-white px-4 py-2.5 flex items-center justify-between text-sm border-b border-gray-100 sticky top-0 z-40">
      <span className="font-bold text-gray-900">{title}</span>
      {showConnection && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Connected</span>
        </div>
      )}
    </div>
  )
}
