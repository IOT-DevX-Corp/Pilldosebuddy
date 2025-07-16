"use client"

import { useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Pill, 
  Smartphone, 
  Activity, 
  Shield, 
  Wifi,
  Bell,
  Brain,
  Clock,
  Heart,
  CheckCircle,
  Zap,
  Users,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Timer,
  AlertTriangle,
  Languages,
  Globe
} from 'lucide-react'

// Multilingual translations
const translations = {
  en: {
    aiPoweredHealthcare: "AI-Powered Healthcare",
    neverMissA: "Never miss a",
    doseAgain: "dose again",
    tagline: "Revolutionary AI-powered smart pill dispenser with real-time monitoring, personalized healthcare insights, and seamless medication management.",
    getStarted: "Get Started",
    viewDemo: "View Demo",
    features: {
      aiPowered: { title: "AI-Powered", desc: "Smart medication insights" },
      realTimeAlerts: { title: "Real-time Alerts", desc: "Never miss a dose" },
      secureAndSafe: { title: "Secure & Safe", desc: "HIPAA compliant" },
      healthMonitoring: { title: "Health Monitoring", desc: "Track adherence patterns" }
    },
    stats: {
      accuracy: "Accuracy",
      monitoring: "Monitoring", 
      livesImproved: "Lives Improved",
      responseTime: "Response Time"
    },
    connected: "Connected",
    seamlesslySync: "Seamlessly synced across all your devices",
    readyToRevolutionize: "Ready to revolutionize your healthcare?",
    joinThousands: "Join thousands of patients who never miss a dose with PillDoseBuddy",
    startJourney: "Start Your Journey",
    noCreditCard: "No credit card required",
    timeForMedication: "Time for your medication!",
    aspirin: "Aspirin - 1 tablet",
    language: "Language",
    english: "English",
    hindi: "हिंदी"
  },
  hi: {
    aiPoweredHealthcare: "AI-संचालित स्वास्थ्य सेवा",
    neverMissA: "कभी न चूकें",
    doseAgain: "दवा की खुराक",
    tagline: "वास्तविक समय निगरानी, व्यक्तिगत स्वास्थ्य अंतर्दृष्टि और निर्बाध दवा प्रबंधन के साथ क्रांतिकारी AI-संचालित स्मार्ट पिल डिस्पेंसर।",
    getStarted: "शुरू करें",
    viewDemo: "डेमो देखें",
    features: {
      aiPowered: { title: "AI-संचालित", desc: "स्मार्ट दवा अंतर्दृष्टि" },
      realTimeAlerts: { title: "वास्तविक समय अलर्ट", desc: "कभी खुराक न चूकें" },
      secureAndSafe: { title: "सुरक्षित और सुरक्षित", desc: "HIPAA अनुपालित" },
      healthMonitoring: { title: "स्वास्थ्य निगरानी", desc: "पालन पैटर्न ट्रैक करें" }
    },
    stats: {
      accuracy: "सटीकता",
      monitoring: "निगरानी",
      livesImproved: "जीवन में सुधार",
      responseTime: "प्रतिक्रिया समय"
    },
    connected: "जुड़ा हुआ",
    seamlesslySync: "आपके सभी उपकरणों में निर्बाध रूप से सिंक",
    readyToRevolutionize: "अपनी स्वास्थ्य सेवा में क्रांति लाने के लिए तैयार हैं?",
    joinThousands: "हजारों रोगियों से जुड़ें जो PillDoseBuddy के साथ कभी खुराक नहीं चूकते",
    startJourney: "अपनी यात्रा शुरू करें",
    noCreditCard: "क्रेडिट कार्ड की आवश्यकता नहीं",
    timeForMedication: "आपकी दवा का समय!",
    aspirin: "एस्पिरिन - 1 गोली",
    language: "भाषा",
    english: "English",
    hindi: "हिंदी"
  }
}

interface LandingHeroProps {
  onGetStarted: () => void
}

const FloatingCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    className="transform-gpu"
  >
    {children}
  </motion.div>
)

const TypewriterText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text])

  return <span>{displayText}<span className="animate-pulse">|</span></span>
}

export function LandingHero({ onGetStarted }: LandingHeroProps) {
  const controls = useAnimation()
  const [isVisible, setIsVisible] = useState(false)
  const [language, setLanguage] = useState<'en' | 'hi'>('en')

  const t = translations[language]

  useEffect(() => {
    setIsVisible(true)
    controls.start("visible")
  }, [controls])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  }

  const features = [
    { icon: Brain, title: t.features.aiPowered.title, desc: t.features.aiPowered.desc },
    { icon: Bell, title: t.features.realTimeAlerts.title, desc: t.features.realTimeAlerts.desc },
    { icon: Shield, title: t.features.secureAndSafe.title, desc: t.features.secureAndSafe.desc },
    { icon: Activity, title: t.features.healthMonitoring.title, desc: t.features.healthMonitoring.desc }
  ]

  const stats = [
    { value: "99.9%", label: t.stats.accuracy, icon: CheckCircle },
    { value: "24/7", label: t.stats.monitoring, icon: Clock },
    { value: "50K+", label: t.stats.livesImproved, icon: Heart },
    { value: "5sec", label: t.stats.responseTime, icon: Zap }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        {/* Language Selector */}
        <motion.div 
          className="absolute top-4 right-4"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-blue-100">
            <Languages className="h-4 w-4 text-blue-600" />
            <Select value={language} onValueChange={(value: 'en' | 'hi') => setLanguage(value)}>
              <SelectTrigger className="w-32 border-0 bg-transparent text-blue-900 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="hi">{t.hindi}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <motion.div 
            className="flex items-center justify-center mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-lg px-6 py-2 rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              {t.aiPoweredHealthcare}
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-8 text-blue-900 leading-tight"
            variants={itemVariants}
          >
            {t.neverMissA}{' '}
            <span className="text-blue-600">
              {isVisible && <TypewriterText text={t.doseAgain} />}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-blue-700 mb-8 max-w-4xl mx-auto leading-relaxed"
            variants={itemVariants}
          >
            {t.tagline}
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {t.getStarted}
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 rounded-2xl">
                <Activity className="w-5 h-5 mr-2" />
                {t.viewDemo}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <FloatingCard delay={index * 0.5}>
                <Card className="bg-white/90 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group hover:scale-105">
                  <CardContent className="p-0">
                    <motion.div 
                      className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">{feature.title}</h3>
                    <p className="text-blue-600">{feature.desc}</p>
                  </CardContent>
                </Card>
              </FloatingCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <FloatingCard delay={index * 0.3}>
                <Card className="bg-white/90 backdrop-blur-sm border-blue-100 shadow-lg p-6 text-center">
                  <CardContent className="p-0">
                    <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <motion.div 
                      className="text-3xl font-bold text-blue-900 mb-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + 0.5, type: "spring" }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-blue-600 text-sm">{stat.label}</p>
                  </CardContent>
                </Card>
              </FloatingCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Device Showcase */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <motion.div 
            className="relative inline-block"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FloatingCard>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-3xl shadow-xl">
                <div className="flex items-center justify-center space-x-8">
                  <motion.div 
                    className="bg-white/20 p-6 rounded-2xl"
                    whileHover={{ rotate: 5 }}
                  >
                    <Pill className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center text-white"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-8 h-8 mr-2" />
                    <span className="text-lg font-semibold">{t.connected}</span>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white/20 p-6 rounded-2xl"
                    whileHover={{ rotate: -5 }}
                  >
                    <Smartphone className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
                
                <motion.p 
                  className="text-white/90 mt-4 text-lg"
                  variants={itemVariants}
                >
                  {t.seamlesslySync}
                </motion.p>
              </div>
            </FloatingCard>
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center bg-gradient-to-r from-blue-100 to-blue-50 rounded-3xl p-12 border border-blue-200"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-4xl font-bold text-blue-900 mb-4"
            variants={itemVariants}
          >
            {t.readyToRevolutionize}
          </motion.h2>
          <motion.p 
            className="text-xl text-blue-700 mb-8"
            variants={itemVariants}
          >
            {t.joinThousands}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Timer className="w-5 h-5 mr-2" />
                {t.startJourney}
              </Button>
            </motion.div>
            
            <div className="flex items-center text-blue-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              {t.noCreditCard}
            </div>
          </motion.div>
        </motion.div>

        {/* Floating notification demo */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.5 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.3)",
                "0 0 30px rgba(59, 130, 246, 0.6)", 
                "0 0 20px rgba(59, 130, 246, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Card className="bg-white/95 backdrop-blur-sm border-blue-200 shadow-xl p-4 max-w-sm">
              <CardContent className="p-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-blue-900 font-semibold text-sm">{t.timeForMedication}</p>
                    <p className="text-blue-600 text-xs">{t.aspirin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
