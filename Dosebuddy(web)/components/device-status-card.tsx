"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Wifi, WifiOff, Battery, Thermometer, Droplets, Pill, Clock } from "lucide-react"
import type { DeviceStatus } from "@/hooks/useFirebaseData"

interface DeviceStatusCardProps {
  status: DeviceStatus
  onDispenseNow: () => void
  onTestAlert: () => void
}

export function DeviceStatusCard({ status, onDispenseNow, onTestAlert }: DeviceStatusCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-800">DoseBuddy Device</CardTitle>
          <Badge
            variant={status.online ? "default" : "destructive"}
            className={`${status.online ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
          >
            {status.online ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {status.online ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Battery className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Battery</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{status.battery}%</div>
            <Progress value={status.battery} className="mt-2" />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Pills Left</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{status.pillsRemaining}</div>
            <div className="text-xs text-gray-500 mt-1">Refill needed soon</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Temperature</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{status.temperature}°C</div>
            <div className="text-xs text-gray-500 mt-1">Optimal range</div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-600">Humidity</span>
            </div>
            <div className="text-2xl font-bold text-cyan-600">{status.humidity}%</div>
            <div className="text-xs text-gray-500 mt-1">Good condition</div>
          </div>
        </div>

        {/* Last Dispense */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Last Dispense</span>
          </div>
          <div className="text-lg font-semibold text-purple-600">
            {new Date(status.lastDispenseTime).toLocaleString()}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onDispenseNow}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!status.online}
          >
            <Pill className="w-4 h-4 mr-2" />
            Dispense Now
          </Button>
          <Button
            onClick={onTestAlert}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
            disabled={!status.online}
          >
            Test Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
