"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, AlertTriangle, CheckCircle, RefreshCw, X } from "lucide-react"
import type { Notification } from "@/hooks/useFirebaseData"

interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onClearAll: () => void
}

export function NotificationsPanel({ notifications, onMarkRead, onClearAll }: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "missed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "taken":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "refill":
        return <RefreshCw className="w-4 h-4 text-orange-500" />
      case "emergency":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "missed":
        return "border-red-200 bg-red-50"
      case "taken":
        return "border-green-200 bg-green-50"
      case "refill":
        return "border-orange-200 bg-orange-50"
      case "emergency":
        return "border-red-300 bg-red-100"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-2xl font-bold text-gray-800">Notifications</CardTitle>
            {unreadCount > 0 && <Badge className="bg-red-500 hover:bg-red-600 text-white">{unreadCount}</Badge>}
          </div>
          {notifications.length > 0 && (
            <Button onClick={onClearAll} size="sm" variant="outline">
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border ${getNotificationColor(notification.type)} ${!notification.read ? "ring-2 ring-blue-200" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {!notification.read && (
                  <Button size="sm" variant="ghost" onClick={() => onMarkRead(notification.id)} className="p-1 h-auto">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
