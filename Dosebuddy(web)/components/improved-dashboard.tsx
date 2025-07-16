"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bell, 
  Pill, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Settings,
  Home,
  Database,
  ChevronRight
} from 'lucide-react'
import { firebaseService, type Dose, type Notification, type PillDispenser } from '@/lib/firebase-service'

interface MissedDoseAdvice {
  recommendation: 'take_now' | 'take_with_adjustment' | 'skip_dose' | 'contact_healthcare'
  reasoning: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  nextSteps: string[]
  warnings?: string[]
  timeSensitive: boolean
}

interface DashboardData {
  doses: Record<string, Dose>
  notifications: Array<Notification & { id: string }>
  dispenserStatus: PillDispenser | null
  unreadCount: number
}

interface NewMedicationForm {
  name: string
  chamber: number
  conditions: string
  hour: number
  minute: number
  pills: number
  fromDate: string
  toDate: string
}

export default function ImprovedPillDoseBuddyDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    doses: {},
    notifications: [],
    dispenserStatus: null,
    unreadCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedDose, setSelectedDose] = useState<string | null>(null)
  const [advice, setAdvice] = useState<MissedDoseAdvice | null>(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'medications' | 'add-medication'>('dashboard')
  const [showMedicationForm, setShowMedicationForm] = useState(false)
  const [newMedication, setNewMedication] = useState<NewMedicationForm>({
    name: '',
    chamber: 0,
    conditions: '',
    hour: 9,
    minute: 0,
    pills: 1,
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  // Initialize Firebase and set up real-time listeners
  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = []

    const initializeApp = async () => {
      try {
        await firebaseService.initialize()
        
        // Set up real-time listeners
        const unsubscribeDoses = firebaseService.onUserDosesChange((doses) => {
          setDashboardData(prev => ({ ...prev, doses }))
        })
        
        const unsubscribeNotifications = firebaseService.onUserNotificationsChange((notifications) => {
          const notificationArray = Object.entries(notifications)
            .map(([id, notification]) => ({ id, ...notification }))
            .sort((a, b) => b.timestamp - a.timestamp)
          
          const unreadCount = notificationArray.filter(n => !n.read).length
          
          setDashboardData(prev => ({ 
            ...prev, 
            notifications: notificationArray,
            unreadCount 
          }))
        })
        
        const unsubscribeDispenser = firebaseService.onPillDispenserStatusChange((dispenserStatus) => {
          setDashboardData(prev => ({ ...prev, dispenserStatus }))
        })
        
        unsubscribeFunctions = [unsubscribeDoses, unsubscribeNotifications, unsubscribeDispenser]
        setLoading(false)
        
      } catch (error) {
        console.error('Error initializing app:', error)
        setLoading(false)
      }
    }

    initializeApp()

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  const handleGetAdvice = useCallback(async (doseId: string) => {
    setLoadingAdvice(true)
    setSelectedDose(doseId)
    
    try {
      const response = await fetch('/api/missed-dose-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doseId }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAdvice(data.advice)
      } else {
        console.error('Error getting advice:', data.error)
      }
    } catch (error) {
      console.error('Error fetching advice:', error)
    } finally {
      setLoadingAdvice(false)
    }
  }, [])

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, markAsRead: true }),
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const handleAddMedication = async () => {
    try {
      const fromDateTime = new Date(`${newMedication.fromDate}T${String(newMedication.hour).padStart(2, '0')}:${String(newMedication.minute).padStart(2, '0')}:00`)
      const toDateTime = new Date(`${newMedication.toDate}T23:59:59`)
      
      const medication = {
        chamber: newMedication.chamber,
        conditions: newMedication.conditions,
        dispensed: false,
        fromDate: fromDateTime.toISOString(),
        hour: newMedication.hour,
        isExisting: true,
        lastDispensed: "",
        minute: newMedication.minute,
        name: newMedication.name,
        pills: newMedication.pills,
        toDate: toDateTime.toISOString()
      }

      await firebaseService.addMedication(medication)
      
      // Create a dose for the user
      const dose = {
        chamber: newMedication.chamber,
        count: newMedication.pills,
        dispensed: false,
        endDate: toDateTime.getTime(),
        name: newMedication.name,
        startDate: fromDateTime.getTime(),
        status: 'upcoming' as const,
        time: fromDateTime.getTime(),
        conditions: newMedication.conditions
      }

      await firebaseService.addDose(dose)
      
      // Reset form and close
      setNewMedication({
        name: '',
        chamber: 0,
        conditions: '',
        hour: 9,
        minute: 0,
        pills: 1,
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      setShowMedicationForm(false)
      setCurrentView('dashboard')
      
      // Add success notification
      await firebaseService.addNotification({
        type: 'doseDispensed',
        message: `New medication ${newMedication.name} added successfully`,
        data: {},
        read: false
      })
      
    } catch (error) {
      console.error('Error adding medication:', error)
    }
  }

  const getConnectionStatus = () => {
    if (!dashboardData.dispenserStatus) return { status: 'unknown', color: 'gray' }
    
    const lastSeen = new Date(dashboardData.dispenserStatus.lastSeen)
    const now = new Date()
    const timeDiff = now.getTime() - lastSeen.getTime()
    const minutesAgo = Math.floor(timeDiff / (1000 * 60))
    
    if (minutesAgo <= 5) return { status: 'online', color: 'green' }
    if (minutesAgo <= 15) return { status: 'poor', color: 'yellow' }
    return { status: 'offline', color: 'red' }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Connecting to PillDoseBuddy</h3>
          <p className="text-blue-600">Initializing your smart medication system...</p>
        </div>
      </div>
    )
  }

  const connectionStatus = getConnectionStatus()
  const upcomingDoses = Object.entries(dashboardData.doses)
    .filter(([_, dose]) => dose.status === 'upcoming')
    .slice(0, 5)
  
  const missedDoses = Object.entries(dashboardData.doses)
    .filter(([_, dose]) => dose.status === 'missed')
  
  const takenDoses = Object.entries(dashboardData.doses)
    .filter(([_, dose]) => dose.status === 'taken')

  const renderMedicationForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add New Medication</h2>
        <Button
          variant="outline"
          onClick={() => setShowMedicationForm(false)}
        >
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Medication Name</Label>
              <Input
                id="name"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Aspirin, Metformin"
              />
            </div>
            
            <div>
              <Label htmlFor="chamber">Chamber Number</Label>
              <Input
                id="chamber"
                type="number"
                min="0"
                max="4"
                value={newMedication.chamber}
                onChange={(e) => setNewMedication(prev => ({ ...prev, chamber: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="pills">Number of Pills</Label>
              <Input
                id="pills"
                type="number"
                min="1"
                value={newMedication.pills}
                onChange={(e) => setNewMedication(prev => ({ ...prev, pills: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="hour">Hour (24-hour format)</Label>
              <Input
                id="hour"
                type="number"
                min="0"
                max="23"
                value={newMedication.hour}
                onChange={(e) => setNewMedication(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="minute">Minute</Label>
              <Input
                id="minute"
                type="number"
                min="0"
                max="59"
                value={newMedication.minute}
                onChange={(e) => setNewMedication(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="fromDate">Start Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={newMedication.fromDate}
                onChange={(e) => setNewMedication(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="toDate">End Date</Label>
              <Input
                id="toDate"
                type="date"
                value={newMedication.toDate}
                onChange={(e) => setNewMedication(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="conditions">Special Conditions</Label>
            <Textarea
              id="conditions"
              value={newMedication.conditions}
              onChange={(e) => setNewMedication(prev => ({ ...prev, conditions: e.target.value }))}
              placeholder="e.g., Take with food, Take on empty stomach"
            />
          </div>
          
          <Button 
            onClick={handleAddMedication}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!newMedication.name.trim()}
          >
            Add Medication
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PillDoseBuddy</h1>
                <p className="text-gray-600">Smart Medication Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            
            <Button
              variant={currentView === 'medications' ? 'default' : 'outline'}
              onClick={() => setCurrentView('medications')}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Medications
            </Button>
            
            <Button
              onClick={() => setShowMedicationForm(true)}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </div>
        </div>

        {/* Show form if requested */}
        {showMedicationForm && renderMedicationForm()}

        {!showMedicationForm && (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Dispenser Status */}
              <Card className={`border-2 ${connectionStatus.status === 'online' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {connectionStatus.status === 'online' ? (
                      <Wifi className="h-8 w-8 text-green-600" />
                    ) : (
                      <WifiOff className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">Dispenser</p>
                      <p className={`text-sm capitalize text-${connectionStatus.color}-600 font-medium`}>
                        {connectionStatus.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Medications */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Pill className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-lg">Total Doses</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Object.keys(dashboardData.doses).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Missed Doses */}
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="font-semibold text-lg">Missed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {missedDoses.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-semibold text-lg">Alerts</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardData.unreadCount}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Missed Doses Alert */}
                {missedDoses.length > 0 && (
                  <Card className="border-red-300 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Missed Doses Requiring Attention
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {missedDoses.map(([doseId, dose]) => {
                        const delay = firebaseService.calculateDoseDelay(dose.time)
                        return (
                          <div key={doseId} className="bg-white p-4 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                  <Pill className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-lg">{dose.name}</p>
                                  <p className="text-sm text-gray-600">
                                    Scheduled: {new Date(dose.time).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-red-600 font-medium">
                                    Missed by: {delay.displayText}
                                  </p>
                                  {dose.conditions && (
                                    <p className="text-sm text-purple-600">
                                      Conditions: {dose.conditions}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleGetAdvice(doseId)}
                                disabled={loadingAdvice && selectedDose === doseId}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {loadingAdvice && selectedDose === doseId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  'Get AI Advice'
                                )}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upcoming Doses */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Upcoming Doses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingDoses.length > 0 ? (
                        upcomingDoses.map(([doseId, dose]) => (
                          <div key={doseId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{dose.name}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(dose.time).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">Chamber {dose.chamber}</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No upcoming doses</p>
                          <Button
                            variant="outline"
                            onClick={() => setShowMedicationForm(true)}
                            className="mt-2"
                          >
                            Add Medication
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        Recent Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                      {dashboardData.notifications.length > 0 ? (
                        dashboardData.notifications.slice(0, 10).map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                            }`}
                            onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-blue-800 font-medium'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No notifications</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {currentView === 'medications' && (
              <Card>
                <CardHeader>
                  <CardTitle>All Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dashboardData.doses).length > 0 ? (
                      Object.entries(dashboardData.doses).map(([doseId, dose]) => (
                        <div key={doseId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                dose.status === 'taken' ? 'bg-green-100' :
                                dose.status === 'missed' ? 'bg-red-100' : 'bg-blue-100'
                              }`}>
                                <Pill className={`h-6 w-6 ${
                                  dose.status === 'taken' ? 'text-green-600' :
                                  dose.status === 'missed' ? 'text-red-600' : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{dose.name}</h3>
                                <p className="text-sm text-gray-600">
                                  Chamber {dose.chamber} • {dose.count} pill(s)
                                </p>
                                <p className="text-sm text-gray-600">
                                  Scheduled: {new Date(dose.time).toLocaleString()}
                                </p>
                                {dose.conditions && (
                                  <p className="text-sm text-purple-600">Conditions: {dose.conditions}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={
                              dose.status === 'taken' ? 'default' :
                              dose.status === 'missed' ? 'destructive' : 'secondary'
                            }>
                              {dose.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
                        <p className="text-gray-500 mb-4">Get started by adding your first medication</p>
                        <Button
                          onClick={() => setShowMedicationForm(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add Medication
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Advice Modal */}
            {advice && selectedDose && (
              <Card className={`border-2 ${getUrgencyColor(advice.urgency)} fixed inset-4 z-50 overflow-auto`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    AI Medication Advice
                    <Badge variant="outline" className={getUrgencyColor(advice.urgency)}>
                      {advice.urgency.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Recommendation:</h4>
                    <p className="text-lg font-semibold">
                      {advice.recommendation.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Reasoning:</h4>
                    <p>{advice.reasoning}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Next Steps:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {advice.nextSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {advice.warnings && advice.warnings.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Warnings:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {advice.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription>
                      <strong>Disclaimer:</strong> This advice is generated by AI. Always consult your healthcare provider before taking action.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => {
                        setAdvice(null)
                        setSelectedDose(null)
                      }}
                      variant="outline"
                    >
                      Close
                    </Button>
                    {advice.recommendation === 'contact_healthcare' && (
                      <Button className="bg-red-600 hover:bg-red-700">
                        Contact Healthcare Provider
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dispenser Status */}
            {dashboardData.dispenserStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Dispenser Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="font-medium text-gray-700">Connection</p>
                    <p className={`text-2xl font-bold ${dashboardData.dispenserStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.dispenserStatus.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="font-medium text-gray-700">Last Dispense</p>
                    <p className="text-lg font-semibold">{dashboardData.dispenserStatus.lastDispenseTime}</p>
                    <p className={`text-sm ${dashboardData.dispenserStatus.lastDispenseSuccessful ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.dispenserStatus.lastDispenseSuccessful ? 'Successful' : 'Failed'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="font-medium text-gray-700">Last Seen</p>
                    <p className="text-lg font-semibold">{new Date(dashboardData.dispenserStatus.lastSeen).toLocaleTimeString()}</p>
                    <p className="text-xs text-gray-500">{new Date(dashboardData.dispenserStatus.lastSeen).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
