import { NextRequest, NextResponse } from 'next/server'
import { firebaseService } from '@/lib/firebase-service'

export async function GET(request: NextRequest) {
  try {
    await firebaseService.initialize()
    
    const notifications = await firebaseService.getUserNotifications()
    
    // Sort notifications by timestamp (newest first)
    const sortedNotifications = Object.entries(notifications)
      .map(([id, notification]) => ({ id, ...notification }))
      .sort((a, b) => b.timestamp - a.timestamp)
    
    return NextResponse.json({
      success: true,
      notifications: sortedNotifications,
      unreadCount: sortedNotifications.filter(n => !n.read).length
    })
    
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notificationId, markAsRead } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }
    
    await firebaseService.initialize()
    
    if (markAsRead) {
      await firebaseService.markNotificationAsRead(notificationId)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, message, data } = await request.json()
    
    await firebaseService.initialize()
    
    const notificationId = await firebaseService.addNotification({
      type,
      message,
      data: data || {},
      read: false
    })
    
    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification created successfully'
    })
    
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
