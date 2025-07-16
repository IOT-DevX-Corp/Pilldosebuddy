import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo,
  startAt,
  endAt 
} from "firebase/database"
import { database, auth, initializeAuth } from "./firebase"

// Types based on your Firebase data structure
export interface Medication {
  chamber: number
  conditions: string
  dispensed: boolean
  fromDate: string
  hour: number
  isExisting: boolean
  lastDispensed: string
  minute: number
  name: string
  pills: number
  toDate: string
}

export interface Dose {
  chamber: number
  count: number
  dispensed: boolean
  endDate: number
  lastDispensed?: string
  name: string
  startDate: number
  status: 'taken' | 'upcoming' | 'missed'
  takenAt?: number
  time: number
  conditions?: string
}

export interface Notification {
  data: {
    doseId?: string
    chamber?: number
    action?: string
    [key: string]: any
  }
  message: string
  read: boolean
  timestamp: number
  type: 'doseDispensed' | 'missedDose' | 'upcomingDose' | 'manual_dispense'
}

export interface PillDispenser {
  isOnline: boolean
  lastDispenseSuccessful: boolean
  lastDispenseTime: string
  lastSeen: string
}

export interface UserProfile {
  createdAt: number
  lastLoginAt: number
  age?: number
  name?: string
  emergencyContact?: string
}

export class FirebaseService {
  private userId: string | null = null

  async initialize() {
    const user = await initializeAuth()
    this.userId = user?.uid || null
    return this.userId
  }

  // User Management
  async createUserProfile(profileData: Partial<UserProfile>) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const userRef = ref(database, `users/${this.userId}/profile`)
    const profile = {
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      ...profileData
    }
    await set(userRef, profile)
    return profile
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.userId) return null
    
    const userRef = ref(database, `users/${this.userId}/profile`)
    const snapshot = await get(userRef)
    return snapshot.val()
  }

  async updateUserProfile(updates: Partial<UserProfile>) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const userRef = ref(database, `users/${this.userId}/profile`)
    await update(userRef, {
      ...updates,
      lastLoginAt: Date.now()
    })
  }

  // Medication Management
  async addMedication(medication: Omit<Medication, 'lastDispensed'>) {
    const medicationRef = ref(database, 'medications')
    const newMedicationRef = push(medicationRef)
    await set(newMedicationRef, {
      ...medication,
      lastDispensed: ""
    })
    return newMedicationRef.key
  }

  async getMedications(): Promise<Record<string, Medication>> {
    const medicationsRef = ref(database, 'medications')
    const snapshot = await get(medicationsRef)
    return snapshot.val() || {}
  }

  // Dose Management - handles both user doses and global medications
  async addDose(dose: Omit<Dose, 'lastDispensed'>) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const doseRef = ref(database, `users/${this.userId}/doses`)
    const newDoseRef = push(doseRef)
    await set(newDoseRef, dose)
    return newDoseRef.key
  }

  async updateDose(doseId: string, dose: Partial<Dose>) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const doseRef = ref(database, `users/${this.userId}/doses/${doseId}`)
    await update(doseRef, dose)
    return doseId
  }

  async deleteDose(doseId: string) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const doseRef = ref(database, `users/${this.userId}/doses/${doseId}`)
    await set(doseRef, null) // Setting to null effectively deletes the node
    return doseId
  }

  async getUserDoses(): Promise<Record<string, Dose>> {
    if (!this.userId) return {}
    
    const dosesRef = ref(database, `users/${this.userId}/doses`)
    const snapshot = await get(dosesRef)
    return snapshot.val() || {}
  }

  // Get all medications including both user doses and global medications
  async getAllUserMedications(): Promise<Record<string, Dose>> {
    if (!this.userId) return {}
    
    try {
      // Get user-specific doses
      const userDoses = await this.getUserDoses()
      
      // Get global medications and convert them to dose format
      const globalMedications = await this.getMedications()
      const convertedMedications: Record<string, Dose> = {}
      
      // Convert global medications to dose format
      Object.entries(globalMedications).forEach(([medicationId, medication]) => {
        // Check if this medication already exists in user doses
        const existingDose = Object.values(userDoses).find(dose => 
          dose.name.toLowerCase() === medication.name.toLowerCase() && 
          dose.chamber === medication.chamber
        )
        
        if (!existingDose) {
          // Convert medication time to timestamp
          const scheduledTime = new Date()
          scheduledTime.setHours(medication.hour, medication.minute, 0, 0)
          
          convertedMedications[medicationId] = {
            chamber: medication.chamber,
            count: medication.pills,
            dispensed: medication.dispensed,
            endDate: new Date(medication.toDate).getTime(),
            name: medication.name,
            startDate: new Date(medication.fromDate).getTime(),
            status: medication.dispensed ? 'taken' : 'upcoming',
            time: scheduledTime.getTime(),
            conditions: medication.conditions || undefined,
            lastDispensed: medication.lastDispensed || undefined
          }
        }
      })
      
      // Merge both datasets
      return { ...convertedMedications, ...userDoses }
    } catch (error) {
      console.error('Error fetching all medications:', error)
      return {}
    }
  }

  async updateDoseStatus(doseId: string, status: Dose['status'], takenAt?: number) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const doseRef = ref(database, `users/${this.userId}/doses/${doseId}`)
    const updates: Partial<Dose> = { status }
    
    if (status === 'taken' && takenAt) {
      updates.takenAt = takenAt
      updates.dispensed = true
      updates.lastDispensed = new Date().toISOString()
    }
    
    await update(doseRef, updates)
    
    // Also update the global medication if it exists
    try {
      const globalMedications = await this.getMedications()
      const globalMedication = Object.entries(globalMedications).find(([_, med]) => 
        med.name === updates.name || med.chamber === updates.chamber
      )
      
      if (globalMedication) {
        const [globalMedId] = globalMedication
        const globalMedRef = ref(database, `medications/${globalMedId}`)
        await update(globalMedRef, {
          dispensed: status === 'taken',
          lastDispensed: status === 'taken' ? new Date().toISOString() : ""
        })
      }
    } catch (error) {
      console.error('Error updating global medication:', error)
    }
  }

  async getMissedDosesInLastDays(days: number): Promise<Dose[]> {
    if (!this.userId) return []
    
    const dosesRef = ref(database, `users/${this.userId}/doses`)
    const snapshot = await get(dosesRef)
    const doses = snapshot.val() || {}
    
    const threeDaysAgo = Date.now() - (days * 24 * 60 * 60 * 1000)
    
    return Object.values(doses as Record<string, Dose>).filter((dose: Dose) => 
      dose.status === 'missed' && dose.time >= threeDaysAgo
    )
  }

  // Notification Management
  async addNotification(notification: Omit<Notification, 'timestamp'>) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const notificationRef = ref(database, `users/${this.userId}/notifications`)
    const newNotificationRef = push(notificationRef)
    await set(newNotificationRef, {
      ...notification,
      timestamp: Date.now()
    })
    return newNotificationRef.key
  }

  async getUserNotifications(): Promise<Record<string, Notification>> {
    if (!this.userId) return {}
    
    const notificationsRef = ref(database, `users/${this.userId}/notifications`)
    const snapshot = await get(notificationsRef)
    return snapshot.val() || {}
  }

  async markNotificationAsRead(notificationId: string) {
    if (!this.userId) throw new Error("User not authenticated")
    
    const notificationRef = ref(database, `users/${this.userId}/notifications/${notificationId}`)
    await update(notificationRef, { read: true })
  }

  // Pill Dispenser Status
  async getPillDispenserStatus(): Promise<PillDispenser | null> {
    const dispenserRef = ref(database, 'pillDispenser')
    const snapshot = await get(dispenserRef)
    return snapshot.val()
  }

  // Real-time listeners
  onPillDispenserStatusChange(callback: (status: PillDispenser | null) => void) {
    const dispenserRef = ref(database, 'pillDispenser')
    onValue(dispenserRef, (snapshot) => {
      callback(snapshot.val())
    })
    return () => off(dispenserRef)
  }

  onUserNotificationsChange(callback: (notifications: Record<string, Notification>) => void) {
    if (!this.userId) return () => {}
    
    const notificationsRef = ref(database, `users/${this.userId}/notifications`)
    onValue(notificationsRef, (snapshot) => {
      callback(snapshot.val() || {})
    })
    return () => off(notificationsRef)
  }

  onUserDosesChange(callback: (doses: Record<string, Dose>) => void) {
    if (!this.userId) return () => {}
    
    const dosesRef = ref(database, `users/${this.userId}/doses`)
    onValue(dosesRef, (snapshot) => {
      callback(snapshot.val() || {})
    })
    return () => off(dosesRef)
  }

  onGlobalMedicationsChange(callback: (medications: Record<string, Medication>) => void) {
    const medicationsRef = ref(database, 'medications')
    onValue(medicationsRef, (snapshot) => {
      callback(snapshot.val() || {})
    })
    return () => off(medicationsRef)
  }

  // Calculate dose delay
  calculateDoseDelay(scheduledTime: number): { minutes: number; hours: number; displayText: string } {
    const now = Date.now()
    const delayMs = now - scheduledTime
    const delayMinutes = Math.floor(delayMs / (1000 * 60))
    const delayHours = Math.floor(delayMinutes / 60)
    
    let displayText = ""
    if (delayHours > 0) {
      const remainingMinutes = delayMinutes % 60
      displayText = `${delayHours}h ${remainingMinutes}m`
    } else {
      displayText = `${delayMinutes}m`
    }
    
    return {
      minutes: delayMinutes,
      hours: delayHours,
      displayText
    }
  }
}

export const firebaseService = new FirebaseService()
