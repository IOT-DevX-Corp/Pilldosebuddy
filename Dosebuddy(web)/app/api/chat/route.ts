import { NextRequest, NextResponse } from 'next/server'

// GitHub Models API integration (Azure AI Services)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const API_URL = 'https://models.inference.ai.azure.com/chat/completions'
const MODEL_NAME = 'openai/gpt-4.1' // Using GPT-4.1 model as specified

export async function POST(request: NextRequest) {
  let context: any = null
  
  try {
    const { message, context: requestContext } = await request.json()
    context = requestContext
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Prepare system prompt based on context
    const getLanguageInstruction = (lang: string) => {
      switch (lang) {
        case 'hi': return 'Respond in Hindi (हिंदी)'
        case 'ta': return 'Respond in Tamil (தமிழ்)'
        case 'pa': return 'Respond in Punjabi (ਪੰਜਾਬੀ)'
        default: return 'Respond in English'
      }
    }

    const systemPrompt = `You are DoseBuddy AI, an advanced healthcare assistant specialized in medication management. You have access to the user's medication data and can provide personalized insights.

User Context:
- Language: ${context?.language || 'en'}
- Current medications: ${JSON.stringify(context?.doses || [])}
- Recent notifications: ${JSON.stringify(context?.notifications || [])}
- Member: ${context?.memberInfo || 'Unknown'}

Your capabilities:
1. Analyze medication adherence patterns
2. Provide missed dose advice
3. Suggest schedule optimizations
4. Answer medication-related questions
5. Generate health insights and reports
6. Provide AI-powered recommendations

Always provide helpful, accurate, and personalized responses. If asked about serious medical conditions, recommend consulting healthcare professionals. ${getLanguageInstruction(context?.language || 'en')}.`

    // Check if GitHub token is available for real API calls
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'your-github-token-here') {
      // Provide intelligent fallback response based on the message content
      const fallbackResponses = {
        en: {
          greeting: "Hello! I'm DoseBuddy AI, your intelligent medication management assistant. I can help you with medication schedules, adherence tracking, and health insights.",
          medication: "I can help you manage your medications, set reminders, and provide adherence insights. What specific medication question do you have?",
          schedule: "I can assist with optimizing your medication schedule. Would you like me to analyze your current dosing times?",
          missed: "For missed doses, the general rule is: if it's been less than half the time until your next dose, take it now. Otherwise, skip it and take your next scheduled dose.",
          default: "I'm here to help with all your medication management needs. How can I assist you today?"
        },
        hi: {
          greeting: "नमस्ते! मैं डोज़बडी AI हूं, आपका बुद्धिमान दवा प्रबंधन सहायक। मैं दवा कार्यक्रम, पालन ट्रैकिंग और स्वास्थ्य अंतर्दृष्टि में आपकी सहायता कर सकता हूं।",
          medication: "मैं आपकी दवाओं का प्रबंधन करने, रिमाइंडर सेट करने और पालन अंतर्दृष्टि प्रदान करने में मदद कर सकता हूं। आपका कोई विशिष्ट दवा प्रश्न है?",
          schedule: "मैं आपके दवा कार्यक्रम को अनुकूलित करने में सहायता कर सकता हूं। क्या आप चाहते हैं कि मैं आपके वर्तमान खुराक समय का विश्लेषण करूं?",
          missed: "छूटी हुई खुराक के लिए, सामान्य नियम है: यदि आपकी अगली खुराक तक आधे से कम समय बीता है, तो अब लें। अन्यथा, इसे छोड़ें और अपनी अगली निर्धारित खुराक लें।",
          default: "मैं आपकी सभी दवा प्रबंधन आवश्यकताओं में मदद करने के लिए यहां हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?"
        },
        ta: {
          greeting: "வணக்கம்! நான் டோஸ்பட்டி AI, உங்கள் புத்திசாலித்தனமான மருந்து மேலாண்மை உதவியாளர். மருந்து அட்டவணைகள், பின்பற்றுதல் கண்காணிப்பு மற்றும் சுகாதார நுண்ணறிவுகளில் உங்களுக்கு உதவ முடியும்.",
          medication: "உங்கள் மருந்துகளை நிர்வகிக்க, நினைவூட்டல்களை அமைக்க மற்றும் பின்பற்றுதல் நுண்ணறிவுகளை வழங்க உதவ முடியும். உங்களுக்கு ஏதேனும் குறிப்பிட்ட மருந்து கேள்வி உள்ளதா?",
          schedule: "உங்கள் மருந்து அட்டவணையை மேம்படுத்த உதவ முடியும். உங்கள் தற்போதைய மருந்து நேரங்களை பகுப்பாய்வு செய்ய விரும்புகிறீர்களா?",
          missed: "தவறிய டோஸ்களுக்கு, பொதுவான விதி: உங்கள் அடுத்த டோஸ் வரை பாதி நேரத்திற்கும் குறைவாக இருந்தால், இப்போது எடுத்துக்கொள்ளுங்கள். இல்லையென்றால், அதைத் தவிர்த்து உங்கள் அடுத்த திட்டமிடப்பட்ட டோஸை எடுத்துக்கொள்ளுங்கள்.",
          default: "உங்கள் அனைத்து மருந்து மேலாண்மை தேவைகளுக்கும் உதவ நான் இங்கே இருக்கிறேன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
        },
        pa: {
          greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਡੋਜ਼ਬੱਡੀ AI ਹਾਂ, ਤੁਹਾਡਾ ਬੁੱਧੀਮਾਨ ਦਵਾਈ ਪ੍ਰਬੰਧਨ ਸਹਾਇਕ। ਮੈਂ ਦਵਾਈ ਸਮਾਂ-ਸਾਰਣੀ, ਪਾਲਣਾ ਟਰੈਕਿੰਗ ਅਤੇ ਸਿਹਤ ਸੂਝ-ਬੂਝ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",
          medication: "ਮੈਂ ਤੁਹਾਡੀਆਂ ਦਵਾਈਆਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰਨ, ਰਿਮਾਈਂਡਰ ਸੈੱਟ ਕਰਨ ਅਤੇ ਪਾਲਣਾ ਸੂਝ-ਬੂਝ ਪ੍ਰਦਾਨ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਕੋਈ ਖਾਸ ਦਵਾਈ ਸਵਾਲ ਹੈ?",
          schedule: "ਮੈਂ ਤੁਹਾਡੀ ਦਵਾਈ ਸਮਾਂ-ਸਾਰਣੀ ਨੂੰ ਅਨੁਕੂਲ ਬਣਾਉਣ ਵਿੱਚ ਸਹਾਇਤਾ ਕਰ ਸਕਦਾ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ ਕਿ ਮੈਂ ਤੁਹਾਡੇ ਮੌਜੂਦਾ ਡੋਜ਼ ਸਮੇਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਾਂ?",
          missed: "ਛੁੱਟੀ ਹੋਈ ਡੋਜ਼ ਲਈ, ਆਮ ਨਿਯਮ ਹੈ: ਜੇ ਤੁਹਾਡੀ ਅਗਲੀ ਡੋਜ਼ ਤੱਕ ਅੱਧੇ ਤੋਂ ਘੱਟ ਸਮਾਂ ਬੀਤਿਆ ਹੈ, ਤਾਂ ਹੁਣ ਲਓ। ਨਹੀਂ ਤਾਂ, ਇਸਨੂੰ ਛੱਡੋ ਅਤੇ ਆਪਣੀ ਅਗਲੀ ਨਿਰਧਾਰਿਤ ਡੋਜ਼ ਲਓ।",
          default: "ਮੈਂ ਤੁਹਾਡੀਆਂ ਸਾਰੀਆਂ ਦਵਾਈ ਪ੍ਰਬੰਧਨ ਲੋੜਾਂ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਸਹਾਇਤਾ ਕਰ ਸਕਦਾ ਹਾਂ?"
        }
      }

      const lang = context?.language || 'en'
      const responses = fallbackResponses[lang as keyof typeof fallbackResponses] || fallbackResponses.en
      
      // Simple keyword matching for better responses
      const lowerMessage = message.toLowerCase()
      let response = responses.default
      
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('namaste') || 
          lowerMessage.includes('vanakkam') || lowerMessage.includes('sat sri akal')) {
        response = responses.greeting
      } else if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || 
                lowerMessage.includes('pill') || lowerMessage.includes('drug')) {
        response = responses.medication
      } else if (lowerMessage.includes('schedule') || lowerMessage.includes('time') || 
                lowerMessage.includes('when')) {
        response = responses.schedule
      } else if (lowerMessage.includes('missed') || lowerMessage.includes('forget') || 
                lowerMessage.includes('skip')) {
        response = responses.missed
      }

      return NextResponse.json({ 
        response,
        model: 'fallback',
        timestamp: new Date().toISOString(),
        note: 'GitHub token not configured. Using intelligent fallback responses.'
      })
    }

    // Call GitHub Models API (Azure AI format)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'api-key': GITHUB_TOKEN, // Azure AI might expect this header
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      console.error('GitHub Models API error:', await response.text())
      throw new Error(`GitHub Models API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request.'

    return NextResponse.json({ 
      response: aiResponse,
      model: MODEL_NAME,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Enhanced fallback response for errors with multilingual support
    const fallbackResponses = {
      en: "Hello! I'm DoseBuddy AI, your intelligent medication management assistant. I can help you with medication schedules, adherence tracking, and health insights. How can I assist you today?",
      hi: "नमस्ते! मैं डोज़बडी AI हूं, आपका बुद्धिमान दवा प्रबंधन सहायक। मैं दवा कार्यक्रम, पालन ट्रैकिंग और स्वास्थ्य अंतर्दृष्टि में आपकी सहायता कर सकता हूं। आज मैं आपकी कैसे सहायता कर सकता हूं?",
      ta: "வணக்கம்! நான் டோஸ்பட்டி AI, உங்கள் புத்திசாலித்தனமான மருந்து மேலாண்மை உதவியாளர். மருந்து அட்டவணைகள், பின்பற்றுதல் கண்காணிப்பு மற்றும் சுகாதார நுண்ணறிவுகளில் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਡੋਜ਼ਬੱਡੀ AI ਹਾਂ, ਤੁਹਾਡਾ ਬੁੱਧੀਮਾਨ ਦਵਾਈ ਪ੍ਰਬੰਧਨ ਸਹਾਇਕ। ਮੈਂ ਦਵਾਈ ਸਮਾਂ-ਸਾਰਣੀ, ਪਾਲਣਾ ਟਰੈਕਿੰਗ ਅਤੇ ਸਿਹਤ ਸੂਝ-ਬੂਝ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਸਹਾਇਤਾ ਕਰ ਸਕਦਾ ਹਾਂ?"
    }
    
    const lang = context?.language || 'en'
    const fallbackResponse = fallbackResponses[lang as keyof typeof fallbackResponses] || fallbackResponses.en
    
    return NextResponse.json({ 
      response: fallbackResponse,
      error: 'AI service temporarily unavailable',
      fallback: true,
      timestamp: new Date().toISOString()
    })
  }
}
