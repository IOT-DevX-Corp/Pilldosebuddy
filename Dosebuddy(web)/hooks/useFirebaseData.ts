"use client"

import { useState, useEffect, useCallback } from 'react'
import { firebaseService, type Dose, type Notification, type PillDispenser, type UserProfile } from '@/lib/firebase-service'

interface UseFirebaseDataReturn {
  doses: Record<string, Dose>
  notifications: Array<Notification & { id: string }>
  dispenserStatus: PillDispenser | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  unreadNotifications: number
  // Actions
  markNotificationAsRead: (id: string) => Promise<void>
  updateDoseStatus: (doseId: string, status: Dose['status'], takenAt?: number) => Promise<void>
  addNotification: (notification: Omit<Notification, 'timestamp'>) => Promise<void>
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  getMissedDosesInLastDays: (days: number) => Promise<Dose[]>
}

export function useFirebaseData(): UseFirebaseDataReturn {
  const [doses, setDoses] = useState<Record<string, Dose>>({})
  const [notifications, setNotifications] = useState<Array<Notification & { id: string }>>([])
  const [dispenserStatus, setDispenserStatus] = useState<PillDispenser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadNotifications = notifications.filter(n => !n.read).length

  // Initialize Firebase and set up real-time listeners
  useEffect(() => {
    let unsubscribeFunctions: (() => void)[] = []

    const initializeApp = async () => {
      try {
        setLoading(true)
        setError(null)
        
        await firebaseService.initialize()
        
        // Load initial user profile
        const profile = await firebaseService.getUserProfile()
        setUserProfile(profile)
        
        // Set up real-time listeners
        const updateAllMedications = async () => {
          const allMedications = await firebaseService.getAllUserMedications()
          setDoses(allMedications)
        }

        const unsubscribeDoses = firebaseService.onUserDosesChange(async (dosesData) => {
          await updateAllMedications()
        })

        const unsubscribeGlobalMedications = firebaseService.onGlobalMedicationsChange(async (medicationsData) => {
          await updateAllMedications()
        })
        
        // Initial load
        await updateAllMedications()
        
        const unsubscribeNotifications = firebaseService.onUserNotificationsChange((notificationsData) => {
          const notificationArray = Object.entries(notificationsData || {})
            .map(([id, notification]) => ({ id, ...notification }))
            .sort((a, b) => b.timestamp - a.timestamp)
          
          setNotifications(notificationArray)
        })
        
        const unsubscribeDispenser = firebaseService.onPillDispenserStatusChange((status) => {
          setDispenserStatus(status)
        })
        
        unsubscribeFunctions = [unsubscribeDoses, unsubscribeGlobalMedications, unsubscribeNotifications, unsubscribeDispenser]
        
      } catch (err) {
        console.error('Error initializing Firebase:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize Firebase')
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Actions
  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await firebaseService.markNotificationAsRead(id)
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }, [])

  const updateDoseStatus = useCallback(async (doseId: string, status: Dose['status'], takenAt?: number) => {
    try {
      await firebaseService.updateDoseStatus(doseId, status, takenAt)
    } catch (err) {
      console.error('Error updating dose status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update dose status')
    }
  }, [])

  const addNotification = useCallback(async (notification: Omit<Notification, 'timestamp'>) => {
    try {
      await firebaseService.addNotification(notification)
    } catch (err) {
      console.error('Error adding notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to add notification')
    }
  }, [])

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      await firebaseService.updateUserProfile(updates)
      const updatedProfile = await firebaseService.getUserProfile()
      setUserProfile(updatedProfile)
    } catch (err) {
      console.error('Error updating user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user profile')
    }
  }, [])

  const getMissedDosesInLastDays = useCallback(async (days: number) => {
    try {
      return await firebaseService.getMissedDosesInLastDays(days)
    } catch (err) {
      console.error('Error getting missed doses:', err)
      setError(err instanceof Error ? err.message : 'Failed to get missed doses')
      return []
    }
  }, [])

  return {
    doses,
    notifications,
    dispenserStatus,
    userProfile,
    loading,
    error,
    unreadNotifications,
    markNotificationAsRead,
    updateDoseStatus,
    addNotification,
    updateUserProfile,
    getMissedDosesInLastDays
  }
}

// Hook for managing missed dose advice
export function useMissedDoseAdvice() {
  const [advice, setAdvice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAdvice = useCallback(async (doseId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/missed-dose-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doseId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get advice')
      }
      
      if (data.success) {
        setAdvice(data)
      } else {
        throw new Error(data.error || 'Failed to get advice')
      }
    } catch (err) {
      console.error('Error fetching advice:', err)
      setError(err instanceof Error ? err.message : 'Failed to get advice')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearAdvice = useCallback(() => {
    setAdvice(null)
    setError(null)
  }, [])

  return {
    advice,
    loading,
    error,
    getAdvice,
    clearAdvice
  }
}

// Hook for dispenser management
export function useDispenserControl() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dispensePill = useCallback(async (chamber: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/dispenser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'dispense', chamber }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispense pill')
      }
      
      return data
    } catch (err) {
      console.error('Error dispensing pill:', err)
      setError(err instanceof Error ? err.message : 'Failed to dispense pill')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    dispensePill
  }
}
