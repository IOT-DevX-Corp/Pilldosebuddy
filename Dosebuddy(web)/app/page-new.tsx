"use client"

import { LandingHero } from "@/components/simple-landing-hero"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  return <LandingHero onGetStarted={handleGetStarted} />
}
