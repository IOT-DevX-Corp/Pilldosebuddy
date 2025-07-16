// AI service using GitHub Models for enhanced medication advice
// Since we can't install the Azure packages without npm, let's create a simple fetch-based implementation

interface MedicationAdviceRequest {
  medicationName: string
  delayHours: number
  userAge?: number
  recentMissedDoses: number
  dispenserOnline: boolean
  conditions?: string
  medicationType?: string
}

interface AIAdviceResponse {
  recommendation: 'take_now' | 'take_with_adjustment' | 'skip_dose' | 'contact_healthcare'
  reasoning: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  nextSteps: string[]
  warnings?: string[]
  timeSensitive: boolean
}

export class GitHubModelsAIService {
  private readonly endpoint = "https://models.inference.ai.azure.com/chat/completions"
  private readonly model = "gpt-4o-mini"
  private readonly token = process.env.GITHUB_TOKEN || ""

  async getMedicationAdvice(request: MedicationAdviceRequest): Promise<AIAdviceResponse> {
    const systemPrompt = `You are PillDoseBuddy AI, a specialized medication adherence assistant. You provide safe, evidence-based advice for missed medication doses.

CRITICAL SAFETY RULES:
1. NEVER recommend double dosing or taking multiple missed doses at once
2. ALWAYS prioritize patient safety over adherence
3. For critical medications (heart, seizure, blood thinners), be extra cautious
4. When in doubt, recommend consulting healthcare provider
5. Consider drug half-life, interactions, and patient age

RESPONSE FORMAT:
Return a JSON object with:
- recommendation: "take_now" | "take_with_adjustment" | "skip_dose" | "contact_healthcare"
- reasoning: Clear explanation (max 100 words)
- urgency: "low" | "medium" | "high" | "critical"
- nextSteps: Array of 2-4 actionable steps
- warnings: Array of important warnings (if any)
- timeSensitive: boolean

MEDICATION CATEGORIES TO CONSIDER:
- Anticoagulants (warfarin, rivaroxaban): Very time-sensitive
- Seizure medications (phenytoin, carbamazepine): Critical timing
- Heart medications (digoxin, beta-blockers): Important timing
- Diabetes medications (insulin, metformin): Time-sensitive
- Antibiotics: Maintain steady levels
- Pain relievers: Less critical timing`

    const userPrompt = `Patient missed their ${request.medicationName} dose.

Details:
- Delay: ${request.delayHours} hours late
- Patient age: ${request.userAge || 'Not specified'}
- Recent missed doses (last 3 days): ${request.recentMissedDoses}
- Dispenser online: ${request.dispenserOnline}
- Special conditions: ${request.conditions || 'None'}
- Medication type: ${request.medicationType || 'Not specified'}

Provide medication advice following the safety rules and format specified.`

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3, // Lower temperature for more consistent medical advice
          max_tokens: 800,
          response_format: { type: "json_object" }
        }),
      })

      if (!response.ok) {
        throw new Error(`GitHub Models API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      try {
        const aiResponse = JSON.parse(content) as AIAdviceResponse
        
        // Validate the response has required fields
        if (!aiResponse.recommendation || !aiResponse.reasoning || !aiResponse.urgency) {
          throw new Error('Invalid AI response format')
        }
        
        return aiResponse
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        // Fallback to rule-based advice
        return this.getFallbackAdvice(request)
      }
      
    } catch (error) {
      console.error('GitHub Models AI error:', error)
      // Fallback to rule-based advice
      return this.getFallbackAdvice(request)
    }
  }

  private getFallbackAdvice(request: MedicationAdviceRequest): AIAdviceResponse {
    const { delayHours, recentMissedDoses, userAge } = request
    
    // Critical situation - multiple missed doses
    if (recentMissedDoses >= 3) {
      return {
        recommendation: 'contact_healthcare',
        reasoning: 'Multiple missed doses in recent days requires immediate medical consultation to prevent serious health complications.',
        urgency: 'critical',
        nextSteps: [
          'Contact your healthcare provider immediately',
          'Do not take multiple doses to catch up',
          'Bring your medication schedule for review'
        ],
        warnings: ['Multiple missed doses can be dangerous'],
        timeSensitive: true
      }
    }
    
    // Age-based considerations
    if (userAge && userAge >= 65 && delayHours > 6) {
      return {
        recommendation: 'skip_dose',
        reasoning: 'For seniors, skipping a significantly delayed dose is safer than risking medication interactions or side effects.',
        urgency: 'medium',
        nextSteps: [
          'Skip this dose',
          'Take your next dose at the scheduled time',
          'Contact your healthcare provider if concerned'
        ],
        warnings: ['Do not double dose'],
        timeSensitive: false
      }
    }
    
    // Time-based recommendations
    if (delayHours <= 2) {
      return {
        recommendation: 'take_now',
        reasoning: 'A 2-hour delay is generally acceptable for most medications without significant risk.',
        urgency: 'low',
        nextSteps: [
          'Take your dose now',
          'Continue with your regular schedule',
          'Set reminders to prevent future missed doses'
        ],
        timeSensitive: false
      }
    } else if (delayHours <= 6) {
      return {
        recommendation: 'take_with_adjustment',
        reasoning: 'You can take this dose now, but adjust the timing of your next dose to prevent overlap.',
        urgency: 'medium',
        nextSteps: [
          'Take your dose now',
          'Delay your next dose by 2-4 hours',
          'Return to regular schedule afterward',
          'Set additional reminders'
        ],
        warnings: ['Space out your next dose appropriately'],
        timeSensitive: false
      }
    } else {
      return {
        recommendation: 'skip_dose',
        reasoning: 'Too much time has passed. Taking the dose now might interfere with your next scheduled dose.',
        urgency: 'medium',
        nextSteps: [
          'Skip this dose',
          'Take your next dose at the regular scheduled time',
          'Discuss adherence strategies with your healthcare provider'
        ],
        warnings: ['Do not take double doses'],
        timeSensitive: false
      }
    }
  }
}

export const githubModelsAI = new GitHubModelsAIService()
