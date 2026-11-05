"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { ShieldAlert, Zap, Search } from "lucide-react"

const steps = [
  {
    title: "Welcome to AI Investigator",
    description: "The premium telemetry and incident investigation platform powered by AI. Let's get you set up to handle production issues faster.",
    icon: <ShieldAlert className="h-12 w-12 text-lime-500" />
  },
  {
    title: "Connect Your Services",
    description: "Link your observability tools like Datadog, AWS, and PagerDuty to give our AI the full context it needs to trace issues.",
    icon: <Zap className="h-12 w-12 text-signal-500" />
  },
  {
    title: "Start Investigating",
    description: "You're all set! When an alert fires, our AI agent will automatically gather telemetry, run hypotheses, and present actionable findings.",
    icon: <Search className="h-12 w-12 text-iris-500" />
  }
]

export function WelcomeModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenOnboarding")
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem("hasSeenOnboarding", "true")
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="fixed inset-0 bg-graphite-950/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-porcelain-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="p-8 pb-6 text-center h-[320px] flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 rounded-full bg-porcelain-100 p-6 shadow-sm">
                {steps[currentStep].icon}
              </div>
              <h2 id="onboarding-title" className="mb-3 text-2xl font-bold text-graphite-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-graphite-600 max-w-sm">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between bg-porcelain-100 px-8 py-4 border-t border-porcelain-300">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 w-2 rounded-full transition-colors ${i === currentStep ? "bg-lime-500 w-4" : "bg-porcelain-400"}`} 
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Skip
            </Button>
            <Button variant="primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
