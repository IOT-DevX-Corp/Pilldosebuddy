import { NextRequest, NextResponse } from 'next/server'

// Mock AI responses for demonstration
const mockAiResponses = [
  "Based on your medication history, I recommend taking your missed dose now if it's within 2 hours of the scheduled time.",
  "I've analyzed your medication pattern. Consider setting up reminders 30 minutes before each dose.",
  "Your adherence rate has improved by 15% this month. Keep up the great work!",
  "I notice you often miss evening doses. Try linking them to a routine activity like dinner.",
  "This medication should be taken with food to reduce stomach irritation.",
  "I recommend consulting your doctor about adjusting the timing of this medication.",
  "Your blood pressure medication is most effective when taken at the same time daily.",
  "Consider using a pill organizer to help manage multiple medications."
]

// Simulate typing delay
const simulateTyping = (text: string) => {
  const wordsPerMinute = 150
  const words = text.split(' ').length
  const milliseconds = (words / wordsPerMinute) * 60 * 1000
  return Math.min(Math.max(milliseconds, 1000), 3000) // Between 1-3 seconds
}

export async function POST(request: NextRequest) {
  try {
    const { message, language = 'en' } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Simulate AI processing delay
    const typingDelay = simulateTyping(message)
    await new Promise(resolve => setTimeout(resolve, typingDelay))

    // Select a relevant mock response based on keywords
    let response = mockAiResponses[0] // default
    
    if (message.toLowerCase().includes('missed') || message.toLowerCase().includes('forgot')) {
      response = mockAiResponses[0]
    } else if (message.toLowerCase().includes('reminder') || message.toLowerCase().includes('schedule')) {
      response = mockAiResponses[1]
    } else if (message.toLowerCase().includes('adherence') || message.toLowerCase().includes('compliance')) {
      response = mockAiResponses[2]
    } else if (message.toLowerCase().includes('evening') || message.toLowerCase().includes('night')) {
      response = mockAiResponses[3]
    } else if (message.toLowerCase().includes('food') || message.toLowerCase().includes('eat')) {
      response = mockAiResponses[4]
    } else if (message.toLowerCase().includes('doctor') || message.toLowerCase().includes('consult')) {
      response = mockAiResponses[5]
    } else if (message.toLowerCase().includes('blood pressure') || message.toLowerCase().includes('bp')) {
      response = mockAiResponses[6]
    } else if (message.toLowerCase().includes('organize') || message.toLowerCase().includes('manage')) {
      response = mockAiResponses[7]
    } else {
      // Random response for general queries
      response = mockAiResponses[Math.floor(Math.random() * mockAiResponses.length)]
    }

    // Translate response if needed (basic example)
    if (language === 'hi') {
      const hindiResponses = {
        [mockAiResponses[0]]: "आपके दवा इतिहास के आधार पर, मैं सुझाता हूं कि यदि निर्धारित समय के 2 घंटे के भीतर है तो अब अपनी छूटी हुई खुराक लें।",
        [mockAiResponses[1]]: "मैंने आपके दवा पैटर्न का विश्लेषण किया है। प्रत्येक खुराक से 30 मिनट पहले रिमाइंडर सेट करने पर विचार करें।",
        [mockAiResponses[2]]: "इस महीने आपकी पालन दर में 15% सुधार हुआ है। बेहतरीन काम जारी रखें!",
        [mockAiResponses[3]]: "मैंने देखा है कि आप अक्सर शाम की खुराक भूल जाते हैं। इन्हें रात के खाने जैसी नियमित गतिविधि से जोड़ने का प्रयास करें।",
        [mockAiResponses[4]]: "पेट की जलन को कम करने के लिए यह दवा भोजन के साथ लेनी चाहिए।",
        [mockAiResponses[5]]: "मैं इस दवा के समय को समायोजित करने के बारे में अपने डॉक्टर से सलाह लेने की सिफारिश करता हूं।",
        [mockAiResponses[6]]: "आपकी रक्तचाप की दवा प्रतिदिन एक ही समय पर लेने से सबसे प्रभावी होती है।",
        [mockAiResponses[7]]: "कई दवाओं को प्रबंधित करने में मदद के लिए पिल ऑर्गनाइज़र का उपयोग करने पर विचार करें।"
      }
      response = hindiResponses[response] || response
    }

    return NextResponse.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
