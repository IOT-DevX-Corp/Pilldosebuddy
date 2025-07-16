"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Pill, Calendar, Users, Bell, BookOpen, Settings, Activity, LogOut } from "lucide-react"

interface SidebarItem {
  icon: React.ReactNode
  label: string
  id: string
  active?: boolean
}

interface DashboardSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const sidebarItems: SidebarItem[] = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", id: "dashboard" },
    { icon: <Pill className="w-5 h-5" />, label: "Medicine Doses", id: "medicines" },
    { icon: <Calendar className="w-5 h-5" />, label: "Schedule", id: "schedule" },
    { icon: <Activity className="w-5 h-5" />, label: "Device Control", id: "device" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", id: "notifications" },
    { icon: <Users className="w-5 h-5" />, label: "Members", id: "members" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Machine Tutorial", id: "tutorial" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", id: "settings" },
  ]

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <div className="font-semibold text-gray-800">Sung Jinwoo</div>
            <div className="text-sm text-gray-500">solo@leveling.com</div>
          </div>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-12 text-left",
                activeTab === item.id
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50",
              )}
              onClick={() => onTabChange(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="mt-8 p-4 bg-red-50 rounded-lg">
          <Button variant="ghost" className="w-full text-red-600 hover:bg-red-100 justify-start gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
