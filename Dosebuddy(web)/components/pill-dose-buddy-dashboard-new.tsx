"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Pill, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Wifi,
  WifiOff,
  Calendar,
  TrendingUp,
  Plus,
  Brain,
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Settings
} from 'lucide-react'
import { firebaseService, type Dose, type Notification, type PillDispenser } from '@/lib/firebase-service'
import EnhancedMedicationForm from '@/components/enhanced-medication-form'

interface DashboardNotification extends Notification {
  id: string
}

interface DashboardData {
  doses: Record<string, Dose>
  notifications: DashboardNotification[]
  dispenserStatus: PillDispenser | null
  unreadCount: number
}

interface MissedDoseAdvice {
  recommendation: 'take_now' | 'take_with_adjustment' | 'skip_dose' | 'contact_healthcare'
  reasoning: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  nextSteps: string[]
  warnings?: string[]
  timeSensitive: boolean
}

export default function PillDoseBuddyDashboard() {
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
  const [showMedicationForm, setShowMedicationForm] = useState(false)

  const handleMedicationFormSubmit = useCallback(() => {
    setShowMedicationForm(false)
  }, [])

  // Show medication form if requested
  if (showMedicationForm) {
    return (
      <EnhancedMedicationForm 
        onSubmit={handleMedicationFormSubmit}
        onCancel={() => setShowMedicationForm(false)}
      />
    )
  }

  // Initialize Firebase and set up real-time listeners
  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = []

    const initializeApp = async () => {
      try {
        await firebaseService.initialize()
        
        // Set up real-time listeners
        const updateAllMedications = async () => {
          const allMedications = await firebaseService.getAllUserMedications()
          setDashboardData(prev => ({ ...prev, doses: allMedications }))
        }

        const unsubscribeDoses = firebaseService.onUserDosesChange(async () => {
          await updateAllMedications()
        })

        const unsubscribeGlobalMedications = firebaseService.onGlobalMedicationsChange(async () => {
          await updateAllMedications()
        })
        
        const unsubscribeNotifications = firebaseService.onUserNotificationsChange((notificationsData) => {
          const notificationArray = Object.entries(notificationsData || {})
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
        
        unsubscribeFunctions = [unsubscribeDoses, unsubscribeGlobalMedications, unsubscribeNotifications, unsubscribeDispenser]
        
        // Initial load
        await updateAllMedications()
        
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to PillDoseBuddy...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-primary p-3 rounded-2xl shadow-lg">
              <Pill className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                DoseBuddy
              </h1>
              <p className="text-slate-600">AI-Powered Medication Assistant</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live Monitoring Active
            </Badge>
          </div>
        </div>

        {/* Enhanced Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* AI Assistant Status */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">AI Assistant</p>
                  <p className="text-sm text-primary font-medium">Ready to Help</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispenser Status */}
          <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
            connectionStatus.status === 'online' 
              ? 'bg-gradient-to-br from-green-50 to-green-100' 
              : 'bg-gradient-to-br from-red-50 to-red-100'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  connectionStatus.status === 'online' ? 'bg-green-200' : 'bg-red-200'
                }`}>
                  {connectionStatus.status === 'online' ? (
                    <Wifi className="h-6 w-6 text-green-700" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-red-700" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Smart Dispenser</p>
                  <p className={`text-sm font-medium capitalize ${
                    connectionStatus.status === 'online' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {connectionStatus.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-200 p-3 rounded-xl">
                  <Bell className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Notifications</p>
                  <p className="text-sm text-blue-700 font-medium">
                    {dashboardData.unreadCount} unread
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adherence Rate */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-200 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Adherence</p>
                  <p className="text-sm text-purple-700 font-medium">
                    {Math.round((takenDoses.length / (takenDoses.length + missedDoses.length + 1)) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Assistant Section */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="bg-gradient-primary p-2 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              AI Health Assistant
              <Badge className="bg-green-100 text-green-700 border-green-200 ml-auto">
                <Sparkles className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Smart Recommendations</span>
                </div>
                <p className="text-sm text-slate-600">Get personalized advice for missed doses and medication timing</p>
              </div>
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-secondary" />
                  <span className="font-semibold">Real-time Analysis</span>
                </div>
                <p className="text-sm text-slate-600">Continuous monitoring of your medication patterns and health trends</p>
              </div>
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <span className="font-semibold">Safety First</span>
                </div>
                <p className="text-sm text-slate-600">AI-powered drug interaction checks and safety warnings</p>
              </div>
            </div>
            {missedDoses.length > 0 && (
              <div className="bg-white/70 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">AI Detected {missedDoses.length} Missed Dose{missedDoses.length > 1 ? 's' : ''}</span>
                  </div>
                  <Button 
                    onClick={() => handleGetAdvice(missedDoses[0][0])}
                    className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
                    size="sm"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Get AI Advice
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Missed Doses Alert */}
        {missedDoses.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-red-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                Missed Doses Requiring Attention
                <Badge className="bg-red-100 text-red-700 border-red-200 ml-auto">
                  {missedDoses.length} pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {missedDoses.map(([doseId, dose]) => {
                const delay = firebaseService.calculateDoseDelay(dose.time)
                return (
                  <div key={doseId} className="bg-white p-6 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-primary p-3 rounded-xl">
                          <Pill className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{dose.name}</p>
                          <p className="text-sm text-slate-600">
                            Scheduled: {new Date(dose.time).toLocaleString()}
                          </p>
                          <p className="text-sm text-red-600 font-medium">
                            Missed by: {delay.displayText}
                          </p>
                          {dose.conditions && (
                            <p className="text-sm text-purple-600 mt-1">
                              Conditions: {dose.conditions}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleGetAdvice(doseId)}
                        disabled={loadingAdvice && selectedDose === doseId}
                        className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
                      >
                        {loadingAdvice && selectedDose === doseId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Brain className="w-4 h-4 mr-2" />
                            Get AI Advice
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Enhanced AI Advice Modal */}
        {advice && selectedDose && (
          <Card className={`border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 ${getUrgencyColor(advice.urgency)}`}>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-primary p-2 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                AI Medication Advice
                <Badge variant="outline" className={`${getUrgencyColor(advice.urgency)} ml-auto`}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {advice.urgency.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Recommendation:
                </h4>
                <p className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {advice.recommendation.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
              
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-secondary" />
                  Reasoning:
                </h4>
                <p className="text-slate-700">{advice.reasoning}</p>
              </div>
              
              <div className="bg-white/70 p-4 rounded-xl border border-primary/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Next Steps:
                </h4>
                <ul className="space-y-2">
                  {advice.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {advice.warnings && advice.warnings.length > 0 && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <strong className="text-amber-800">Important Warnings:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {advice.warnings.map((warning, index) => (
                        <li key={index} className="text-amber-700">{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Medical Disclaimer:</strong> This advice is generated by AI for informational purposes only. 
                  Always consult your healthcare provider before making any medication decisions.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    setAdvice(null)
                    setSelectedDose(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                {advice.recommendation === 'contact_healthcare' && (
                  <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Contact Healthcare Provider
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* All Medications */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="bg-gradient-primary p-2 rounded-xl">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                    All Medications
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                      {Object.entries(dashboardData.doses).length} total
                    </Badge>
                  </CardTitle>
                  <Button 
                    onClick={() => setShowMedicationForm(true)}
                    className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(dashboardData.doses).length > 0 ? (
                  Object.entries(dashboardData.doses).map(([doseId, dose]) => (
                    <div key={doseId} className="bg-gradient-to-r from-white to-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full shadow-sm ${
                            dose.status === 'taken' ? 'bg-green-500' : 
                            dose.status === 'missed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="bg-gradient-primary p-2 rounded-lg">
                            <Pill className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{dose.name}</p>
                            <p className="text-sm text-slate-600">
                              {new Date(dose.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {dose.conditions && (
                              <p className="text-xs text-purple-600 mt-1 bg-purple-50 px-2 py-1 rounded-full inline-block">
                                {dose.conditions}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className={
                              dose.status === 'taken' ? 'bg-green-50 text-green-700 border-green-200' :
                              dose.status === 'missed' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }
                          >
                            {dose.status === 'taken' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : dose.status === 'missed' ? (
                              <AlertTriangle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {dose.status}
                          </Badge>
                          <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Chamber {dose.chamber}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Pill className="h-12 w-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 mb-6 text-lg">No medications found</p>
                    <Button 
                      onClick={() => setShowMedicationForm(true)}
                      className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Medication
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                Recent Notifications
                {dashboardData.unreadCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    {dashboardData.unreadCount} new
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {dashboardData.notifications.length > 0 ? (
                dashboardData.notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-xl border transition-all duration-300 hover:shadow-sm cursor-pointer ${
                      notification.read 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                    onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          notification.read ? 'text-slate-600' : 'text-blue-800 font-medium'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Dispenser Details */}
        {dashboardData.dispenserStatus && (
          <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                Smart Dispenser Details
                <Badge className={`ml-auto ${
                  dashboardData.dispenserStatus.isOnline 
                    ? 'bg-green-100 text-green-700 border-green-200' 
                    : 'bg-red-100 text-red-700 border-red-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    dashboardData.dispenserStatus.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  {dashboardData.dispenserStatus.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/70 p-6 rounded-xl border border-purple-100 text-center">
                <div className="bg-gradient-to-r from-green-100 to-green-200 p-3 rounded-full w-fit mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-700" />
                </div>
                <p className="font-semibold text-slate-800 mb-1">Connection Status</p>
                <p className={`text-lg font-bold ${
                  dashboardData.dispenserStatus.isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardData.dispenserStatus.isOnline ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div className="bg-white/70 p-6 rounded-xl border border-purple-100 text-center">
                <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-3 rounded-full w-fit mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-700" />
                </div>
                <p className="font-semibold text-slate-800 mb-1">Last Dispense</p>
                <p className="text-lg font-bold text-slate-700">{dashboardData.dispenserStatus.lastDispenseTime}</p>
                <p className={`text-sm font-medium ${
                  dashboardData.dispenserStatus.lastDispenseSuccessful ? 'text-green-600' : 'text-red-600'
                }`}>
                  {dashboardData.dispenserStatus.lastDispenseSuccessful ? '✓ Successful' : '✗ Failed'}
                </p>
              </div>
              <div className="bg-white/70 p-6 rounded-xl border border-purple-100 text-center">
                <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-full w-fit mx-auto mb-3">
                  <Wifi className="h-6 w-6 text-purple-700" />
                </div>
                <p className="font-semibold text-slate-800 mb-1">Last Seen</p>
                <p className="text-lg font-bold text-slate-700">
                  {new Date(dashboardData.dispenserStatus.lastSeen).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
