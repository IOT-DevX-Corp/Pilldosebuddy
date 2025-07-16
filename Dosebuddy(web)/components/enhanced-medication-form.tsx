"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pill, Clock, Calendar, Plus, X } from 'lucide-react'
import { firebaseService } from '@/lib/firebase-service'

interface MedicationFormProps {
  onSubmit: () => void
  onCancel: () => void
  medication?: any // Optional medication for editing
}

export default function EnhancedMedicationForm({ onSubmit, onCancel, medication }: MedicationFormProps) {
  const [formData, setFormData] = useState({
    name: medication?.name || '',
    chamber: medication?.chamber || 0,
    pills: medication?.pillCount || 1,
    hour: medication?.time ? parseInt(medication.time.split(':')[0]) : 9,
    minute: medication?.time ? parseInt(medication.time.split(':')[1]) : 0,
    fromDate: medication?.fromDate || new Date().toISOString().split('T')[0],
    toDate: medication?.toDate || '',
    conditions: medication?.conditions || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate dates
      const startDate = new Date(formData.fromDate)
      const endDate = new Date(formData.toDate)
      
      if (endDate <= startDate) {
        throw new Error('End date must be after start date')
      }

      // Calculate scheduled time for today
      const scheduledTime = new Date()
      scheduledTime.setHours(formData.hour, formData.minute, 0, 0)

      // Create dose object
      const dose = {
        chamber: formData.chamber,
        count: formData.pills,
        dispensed: false,
        endDate: endDate.getTime(),
        name: formData.name,
        startDate: startDate.getTime(),
        status: 'upcoming' as const,
        time: scheduledTime.getTime(),
        conditions: formData.conditions || undefined
      }

      if (medication) {
        // Update existing medication
        await firebaseService.updateDose(medication.id, dose)
        
        // Create notification for update
        await firebaseService.addNotification({
          type: 'doseDispensed',
          message: `Medication "${formData.name}" updated successfully`,
          data: { action: 'medication_updated' },
          read: false
        })
      } else {
        // Add new medication
        await firebaseService.addDose(dose)

        // Create notification for add
        await firebaseService.addNotification({
          type: 'doseDispensed',
          message: `New medication "${formData.name}" added successfully`,
          data: { action: 'medication_added' },
          read: false
        })
      }

      onSubmit()
    } catch (err) {
      console.error('Error adding medication:', err)
      setError(err instanceof Error ? err.message : 'Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Generate chamber options (0-7 for 8 chambers)
  const chamberOptions = Array.from({ length: 8 }, (_, i) => i)

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i)

  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45]

  // Set default end date to 30 days from start date
  const handleFromDateChange = (date: string) => {
    handleInputChange('fromDate', date)
    if (!formData.toDate) {
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 30)
      handleInputChange('toDate', endDate.toISOString().split('T')[0])
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6" />
            {medication ? 'Edit Medication' : 'Add New Medication'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Medication Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-600" />
                Medication Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Aspirin, Metformin"
                required
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Chamber and Pills Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chamber">Chamber Number</Label>
                <Select 
                  value={formData.chamber.toString()} 
                  onValueChange={(value) => handleInputChange('chamber', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chamber" />
                  </SelectTrigger>
                  <SelectContent>
                    {chamberOptions.map(chamber => (
                      <SelectItem key={chamber} value={chamber.toString()}>
                        Chamber {chamber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pills">Number of Pills</Label>
                <Input
                  id="pills"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.pills}
                  onChange={(e) => handleInputChange('pills', parseInt(e.target.value))}
                  required
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Scheduled Time
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hour" className="text-sm">Hour (24-hour format)</Label>
                  <Select 
                    value={formData.hour.toString()} 
                    onValueChange={(value) => handleInputChange('hour', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map(hour => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="minute" className="text-sm">Minute</Label>
                  <Select 
                    value={formData.minute.toString()} 
                    onValueChange={(value) => handleInputChange('minute', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Minute" />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteOptions.map(minute => (
                        <SelectItem key={minute} value={minute.toString()}>
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Selected time: {formData.hour.toString().padStart(2, '0')}:{formData.minute.toString().padStart(2, '0')}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Medication Duration
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromDate" className="text-sm">Start Date</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={formData.fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="toDate" className="text-sm">End Date</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={formData.toDate}
                    onChange={(e) => handleInputChange('toDate', e.target.value)}
                    min={formData.fromDate}
                    required
                    className="border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Special Conditions */}
            <div className="space-y-2">
              <Label htmlFor="conditions">Special Conditions (Optional)</Label>
              <Textarea
                id="conditions"
                value={formData.conditions}
                onChange={(e) => handleInputChange('conditions', e.target.value)}
                placeholder="e.g., Take with food, Monitor blood pressure, Take before bedtime"
                rows={3}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding Medication...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Medication
                  </div>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
