import { NextRequest, NextResponse } from 'next/server'
import { firebaseService } from '@/lib/firebase-service'

export async function GET(request: NextRequest) {
  try {
    await firebaseService.initialize()
    
    const dispenserStatus = await firebaseService.getPillDispenserStatus()
    
    if (!dispenserStatus) {
      return NextResponse.json({
        success: false,
        error: 'Dispenser status not found'
      }, { status: 404 })
    }
    
    // Calculate time since last seen
    const lastSeenTime = new Date(dispenserStatus.lastSeen)
    const now = new Date()
    const timeDiff = now.getTime() - lastSeenTime.getTime()
    const minutesSinceLastSeen = Math.floor(timeDiff / (1000 * 60))
    
    // Determine connection quality
    let connectionStatus = 'online'
    if (minutesSinceLastSeen > 5) {
      connectionStatus = 'poor'
    }
    if (minutesSinceLastSeen > 15) {
      connectionStatus = 'offline'
    }
    
    return NextResponse.json({
      success: true,
      dispenser: {
        ...dispenserStatus,
        connectionStatus,
        minutesSinceLastSeen,
        lastSeenFormatted: lastSeenTime.toLocaleString()
      }
    })
    
  } catch (error) {
    console.error('Error fetching dispenser status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, chamber } = await request.json()
    
    if (action === 'dispense' && chamber !== undefined) {
      await firebaseService.initialize()
      
      // Add a notification for dispense request
      await firebaseService.addNotification({
        type: 'doseDispensed',
        message: `Manual dispense requested for chamber ${chamber}`,
        data: { chamber, action: 'manual_dispense' },
        read: false
      })
      
      return NextResponse.json({
        success: true,
        message: `Dispense request sent for chamber ${chamber}`
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action or missing chamber' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error sending dispenser command:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
