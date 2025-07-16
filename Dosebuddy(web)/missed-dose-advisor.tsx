"use client"

import { useState } from "react"
import { AlertTriangle, Clock, Pill, User, FileText, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface MissedDoseData {
  medicineName: string
  scheduledTime: string
  missedBy: string
  conditions?: string[]
  userAge?: number
  requiresFood?: boolean
  medicationType?: string
}

export default function MissedDoseAdvisor() {
  // Example data - in real app this would come from props or API
  const [missedDoseData] = useState<MissedDoseData>({
    medicineName: "Lisinopril 10mg",
    scheduledTime: "8:00 AM",
    missedBy: "2 hours",
    conditions: ["Hypertension"],
    userAge: 65,
    requiresFood: false,
    medicationType: "Blood Pressure Medication",
  })

  const getAdviceBasedOnDelay = (missedBy: string, medicationType?: string) => {
    const hours = Number.parseInt(missedBy)

    if (hours <= 2) {
      return {
        recommendation: "Take your dose now",
        reasoning: "Since you're only 2 hours late, it's generally safe to take your medication now.",
        urgency: "low",
      }
    } else if (hours <= 6) {
      return {
        recommendation: "Take your dose now, but adjust next dose timing",
        reasoning: "You can still take this dose, but consider spacing your next dose appropriately to avoid overlap.",
        urgency: "medium",
      }
    } else {
      return {
        recommendation: "Skip this dose and take your next scheduled dose",
        reasoning: "Too much time has passed. Taking it now might interfere with your next scheduled dose.",
        urgency: "high",
      }
    }
  }

  const advice = getAdviceBasedOnDelay(missedDoseData.missedBy, missedDoseData.medicationType)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-blue-600">DoseBuddy</h1>
        <p className="text-gray-600">Missed Dose Advisory</p>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Missed Dose Alert</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium">{missedDoseData.medicineName}</p>
                <p className="text-sm text-gray-600">{missedDoseData.medicationType}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <div>
                <p className="font-medium">Scheduled: {missedDoseData.scheduledTime}</p>
                <p className="text-sm text-red-600">Missed by: {missedDoseData.missedBy}</p>
              </div>
            </div>
          </div>

          {missedDoseData.conditions && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <div className="flex flex-wrap gap-1">
                {missedDoseData.conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {missedDoseData.userAge && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <p className="text-sm">Patient Age: {missedDoseData.userAge} years</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card
        className={`border-2 ${
          advice.urgency === "low"
            ? "border-green-200 bg-green-50"
            : advice.urgency === "medium"
              ? "border-yellow-200 bg-yellow-50"
              : "border-red-200 bg-red-50"
        }`}
      >
        <CardHeader>
          <CardTitle
            className={`${
              advice.urgency === "low"
                ? "text-green-800"
                : advice.urgency === "medium"
                  ? "text-yellow-800"
                  : "text-red-800"
            }`}
          >
            Recommended Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`p-4 rounded-lg ${
              advice.urgency === "low" ? "bg-green-100" : advice.urgency === "medium" ? "bg-yellow-100" : "bg-red-100"
            }`}
          >
            <p className="font-semibold text-lg">{advice.recommendation}</p>
            <p className="text-sm mt-2">{advice.reasoning}</p>
          </div>

          {missedDoseData.requiresFood && (
            <Alert>
              <AlertDescription>
                <strong>Food Requirement:</strong> This medication should be taken with food to reduce stomach
                irritation.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-red-800">Important Safety Reminders:</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>
                • <strong>Never double your dose</strong> to make up for a missed one
              </li>
              <li>• If you're unsure, it's safer to skip the missed dose</li>
              <li>• Set up reminders to prevent future missed doses</li>
              <li>• Keep track of missed doses to discuss with your healthcare provider</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <Phone className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Medical Disclaimer:</strong> This is general guidance only. Always consult your doctor or pharmacist
          for personalized medical advice, especially if you frequently miss doses or have concerns about your
          medication schedule.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Phone className="h-4 w-4" />
          Contact Doctor
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">Mark as Handled</Button>
      </div>

      <Separator />

      <div className="text-center text-xs text-gray-500">
        <p>PillDoseBuddy - Smart Medication Management</p>
        <p>For emergencies, call your healthcare provider or emergency services</p>
      </div>
    </div>
  )
}
