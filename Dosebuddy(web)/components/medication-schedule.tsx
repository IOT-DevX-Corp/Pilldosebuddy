"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Pill, CheckCircle, AlertCircle, Plus } from "lucide-react"
import type { Medication } from "@/hooks/useFirebaseData"

interface MedicationScheduleProps {
  medications: Medication[]
  onAddMedication: () => void
  onMarkTaken: (id: string) => void
}

export function MedicationSchedule({ medications, onAddMedication, onMarkTaken }: MedicationScheduleProps) {
  const today = new Date().toDateString()
  const currentTime = new Date()

  const getStatusColor = (medication: Medication) => {
    const medicationTime = new Date(`${today} ${medication.time}`)
    const timeDiff = currentTime.getTime() - medicationTime.getTime()

    if (medication.taken) return "green"
    if (timeDiff > 0) return "red" // Overdue
    if (timeDiff > -30 * 60 * 1000) return "yellow" // Due soon (30 min)
    return "gray" // Scheduled
  }

  const getStatusText = (medication: Medication) => {
    const medicationTime = new Date(`${today} ${medication.time}`)
    const timeDiff = currentTime.getTime() - medicationTime.getTime()

    if (medication.taken) return "Taken"
    if (timeDiff > 0) return "Overdue"
    if (timeDiff > -30 * 60 * 1000) return "Due Soon"
    return "Scheduled"
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-teal-100 border-none shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-gray-800">Today's Schedule</CardTitle>
          <Button onClick={onAddMedication} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {medications.length === 0 ? (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No medications scheduled for today</p>
            <Button onClick={onAddMedication} className="mt-4 bg-green-600 hover:bg-green-700">
              Add Your First Medication
            </Button>
          </div>
        ) : (
          medications.map((medication) => {
            const statusColor = getStatusColor(medication)
            const statusText = getStatusText(medication)

            return (
              <div
                key={medication.id}
                className="bg-white p-4 rounded-xl shadow-sm border-l-4"
                style={{
                  borderLeftColor:
                    statusColor === "green"
                      ? "#10b981"
                      : statusColor === "red"
                        ? "#ef4444"
                        : statusColor === "yellow"
                          ? "#f59e0b"
                          : "#6b7280",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Pill className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{medication.name}</h3>
                        <p className="text-sm text-gray-600">{medication.dosage}</p>
                      </div>
                    </div>

                    {medication.conditions && (
                      <p className="text-xs text-gray-500 mb-2">Condition: {medication.conditions}</p>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{medication.time}</span>
                      </div>
                      <Badge
                        variant={
                          statusColor === "green" ? "default" : statusColor === "red" ? "destructive" : "secondary"
                        }
                        className={
                          statusColor === "green"
                            ? "bg-green-500 hover:bg-green-600"
                            : statusColor === "red"
                              ? "bg-red-500 hover:bg-red-600"
                              : statusColor === "yellow"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-gray-500 hover:bg-gray-600"
                        }
                      >
                        {statusColor === "green" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : statusColor === "red" ? (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {statusText}
                      </Badge>
                    </div>
                  </div>

                  {!medication.taken && (
                    <Button
                      size="sm"
                      onClick={() => onMarkTaken(medication.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Taken
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
