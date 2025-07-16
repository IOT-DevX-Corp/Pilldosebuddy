// Voice synthesis utility for multilingual AI responses
export class VoiceSynthesis {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis
      this.loadVoices()
      
      // Handle voice loading
      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices()
        }
      }
    }
  }
  
  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices()
    }
  }
  
  private getVoiceForLanguage(language: 'en' | 'hi' | 'ta' | 'pa'): SpeechSynthesisVoice | null {
    if (!this.voices.length) {
      this.loadVoices()
    }
    
    const voiceMap = {
      'en': ['en-US', 'en-GB', 'en-AU'],
      'hi': ['hi-IN', 'hi'],
      'ta': ['ta-IN', 'ta'],
      'pa': ['pa-IN', 'pa-Guru', 'pa']
    }
    
    const preferredLangs = voiceMap[language]
    
    // Try to find a voice that matches the language
    for (const lang of preferredLangs) {
      const voice = this.voices.find(v => v.lang.startsWith(lang))
      if (voice) return voice
    }
    
    // Fallback to default voice
    return this.voices[0] || null
  }

  speak(text: string, language: 'en' | 'hi' | 'ta' | 'pa' = 'en', options: {
    rate?: number
    pitch?: number
    volume?: number
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'))
        return
      }
      
      // Cancel any ongoing speech
      this.synth.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = this.getVoiceForLanguage(language)
      
      if (voice) {
        utterance.voice = voice
      }
      
      // Set voice parameters
      utterance.rate = options.rate || 0.9
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1
      
      // Set language
      const langMap = {
        'en': 'en-US',
        'hi': 'hi-IN', 
        'ta': 'ta-IN',
        'pa': 'pa-IN'
      }
      utterance.lang = langMap[language] || 'en-US'
      
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(event.error))
      
      this.synth.speak(utterance)
    })
  }
  
  stop() {
    if (this.synth) {
      this.synth.cancel()
    }
  }
  
  pause() {
    if (this.synth) {
      this.synth.pause()
    }
  }
  
  resume() {
    if (this.synth) {
      this.synth.resume()
    }
  }
  
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false
  }
  
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }
  
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }
}

// Create a singleton instance
export const voiceSynthesis = new VoiceSynthesis()

// Utility function for easy use
export const speakText = (text: string, language: 'en' | 'hi' | 'ta' = 'en') => {
  return voiceSynthesis.speak(text, language)
}

// React hook for voice synthesis
import { useState, useCallback } from 'react'

export const useVoiceSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported] = useState(() => voiceSynthesis.isSupported())
  
  const speak = useCallback(async (text: string, language: 'en' | 'hi' | 'ta' | 'pa' = 'en') => {
    if (!isSupported) {
      console.warn('Voice synthesis not supported')
      return
    }
    
    try {
      setIsSpeaking(true)
      await voiceSynthesis.speak(text, language)
    } catch (error) {
      console.error('Voice synthesis error:', error)
    } finally {
      setIsSpeaking(false)
    }
  }, [isSupported])
  
  const stop = useCallback(() => {
    voiceSynthesis.stop()
    setIsSpeaking(false)
  }, [])
  
  const pause = useCallback(() => {
    voiceSynthesis.pause()
  }, [])
  
  const resume = useCallback(() => {
    voiceSynthesis.resume()
  }, [])
  
  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking: isSpeaking || voiceSynthesis.isSpeaking(),
    isSupported
  }
}
