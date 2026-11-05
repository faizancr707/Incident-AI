"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Database,
  Eye,
  FileCode,
  Github,
  Layout,
  Lock,
  MessageSquare,
  Network,
  Search,
  Server,
  Shield,
  Terminal,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Reusable components
const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-porcelain flex flex-col font-sans">
      {/* 1. Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-graphite/90 border-b border-graphite-800 text-porcelain-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-lime flex items-center justify-center text-graphite font-bold">
              AI
            </div>
            <span className="font-semibold text-lg">Incident AI</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium">
            <Link href="#features" className="hover:text-lime transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-lime transition-colors">How it Works</Link>
            <Link href="#integrations" className="hover:text-lime transition-colors">Integrations</Link>
            <Link href="#security" className="hover:text-lime transition-colors">Security</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/signin" className="text-sm font-medium hover:text-lime transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="bg-lime text-graphite px-4 py-2 rounded font-medium text-sm hover:bg-lime-400 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="bg-graphite text-porcelain-50 py-24 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald/20 blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-iris/20 blur-[120px]" />
          </div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center space-x-2 bg-graphite-800 rounded-full px-3 py-1 mb-6 border border-graphite-700">
                  <span className="flex h-2 w-2 rounded-full bg-lime animate-pulse"></span>
                  <span className="text-xs font-medium text-porcelain-300">v2.0 Agent Architecture Live</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
                  AI-Powered <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-emerald">Incident Investigation</span>
                </h1>
                <p className="text-lg text-porcelain-400 mb-8 max-w-xl leading-relaxed">
                  Resolve production incidents 10x faster. Our autonomous AI agents analyze logs, traces, and metrics to find root causes before your coffee gets cold.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/signup" className="bg-lime text-graphite px-6 py-3 rounded-md font-medium hover:bg-lime-400 transition-colors flex items-center">
                    Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <button className="px-6 py-3 rounded-md font-medium border border-graphite-600 hover:bg-graphite-800 transition-colors flex items-center">
                    Watch Demo
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                {/* Abstract Dashboard Mockup */}
                <div className="bg-graphite-900 border border-graphite-800 rounded-xl shadow-2xl p-4 overflow-hidden relative">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-graphite-700"></div>
                    <div className="w-3 h-3 rounded-full bg-graphite-700"></div>
                    <div className="w-3 h-3 rounded-full bg-graphite-700"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-graphite-800 p-3 rounded-lg border border-graphite-700">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-champagne" />
                        <div>
                          <div className="text-sm font-medium">High Latency in Checkout API</div>
                          <div className="text-xs text-porcelain-500">Detected 2 mins ago</div>
                        </div>
                      </div>
                      <div className="bg-champagne/20 text-champagne px-2 py-1 rounded text-xs">SEV-2</div>
                    </div>
                    
                    <div className="bg-graphite-800 rounded-lg border border-graphite-700 p-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-iris/10 rounded-full blur-2xl"></div>
                      <div className="flex items-center space-x-2 mb-3">
                        <Bot className="w-4 h-4 text-iris" />
                        <span className="text-xs font-medium text-porcelain-300">Agent Analysis</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-graphite-700 rounded w-3/4"></div>
                        <div className="h-2 bg-graphite-700 rounded w-full"></div>
                        <div className="h-2 bg-graphite-700 rounded w-5/6"></div>
                      </div>
                      <div className="mt-4 p-2 bg-graphite-900 rounded border border-graphite-700 font-mono text-2xs text-porcelain-400">
                        <span className="text-signal">Root Cause Found:</span> N+1 query in products.ts:142
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. Value Proposition */}
        <section className="py-20 bg-porcelain">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              <FadeIn delay={0.1}>
                <div className="bg-white p-8 rounded-xl border border-porcelain-200 shadow-sm h-full">
                  <div className="w-12 h-12 bg-signal-100 text-signal rounded-lg flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-graphite">Detect in Minutes</h3>
                  <p className="text-graphite-600 leading-relaxed">
                    Instantly identify anomalies across your infrastructure with intelligent alerting that cuts through the noise.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="bg-white p-8 rounded-xl border border-porcelain-200 shadow-sm h-full">
                  <div className="w-12 h-12 bg-iris-100 text-iris rounded-lg flex items-center justify-center mb-6">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-graphite">Investigate Automatically</h3>
                  <p className="text-graphite-600 leading-relaxed">
                    Our AI agents autonomously gather logs, traces, and metrics, correlating data faster than any human could.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="bg-white p-8 rounded-xl border border-porcelain-200 shadow-sm h-full">
                  <div className="w-12 h-12 bg-lime-100 text-lime-700 rounded-lg flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-graphite">Resolve with Confidence</h3>
                  <p className="text-graphite-600 leading-relaxed">
                    Get precise root-cause analysis and actionable remediation steps based on your actual codebase and runbooks.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* 4. Key Features */}
        <section id="features" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4 text-graphite">Everything you need to resolve incidents</h2>
              <p className="text-graphite-600">Powerful AI capabilities designed specifically for modern engineering teams and complex distributed systems.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Brain, title: "AI Root Cause Analysis", desc: "Pinpoint exact lines of code and configuration changes causing the issue." },
                { icon: Network, title: "Distributed Tracing", desc: "Visualize the exact path of failed requests across your microservices." },
                { icon: Terminal, title: "Log Intelligence", desc: "Automatically extract meaning from millions of log lines instantly." },
                { icon: Zap, title: "Deployment Correlation", desc: "Link incidents to specific PRs, commits, and deployments." },
                { icon: Database, title: "Knowledge Base", desc: "Agents learn from past incidents to solve future ones faster." },
                { icon: Workflow, title: "Multi-Agent Orchestration", desc: "Specialized agents collaborate to tackle complex, multi-layered problems." },
              ].map((feat, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="p-6 rounded-xl border border-porcelain-200 hover:border-porcelain-300 transition-colors bg-porcelain-50/50">
                    <feat.icon className="w-8 h-8 text-signal mb-4" />
                    <h4 className="text-lg font-bold mb-2 text-graphite">{feat.title}</h4>
                    <p className="text-graphite-600 text-sm">{feat.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* 5. How It Works */}
        <section id="how-it-works" className="py-24 bg-porcelain">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4 text-graphite">How it Works</h2>
              <p className="text-graphite-600">From alert to resolution in minutes, not hours.</p>
            </div>

            <div className="max-w-4xl mx-auto relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-porcelain-300 md:left-1/2 md:-ml-px"></div>
              
              <div className="space-y-12">
                {[
                  { step: 1, title: "Connect Your Services", desc: "Integrate with Datadog, AWS, GitHub, and PagerDuty in minutes.", align: "right" },
                  { step: 2, title: "AI Detects Anomalies", desc: "Continuous monitoring identifies patterns that standard alerts miss.", align: "left", isAi: true },
                  { step: 3, title: "Automated Investigation", desc: "Agents gather context, query logs, and analyze traces autonomously.", align: "right", isAi: true },
                  { step: 4, title: "Evidence-Based Resolution", desc: "Receive a clear summary, root cause, and remediation plan.", align: "left" },
                ].map((item, i) => (
                  <FadeIn key={i} delay={0.2}>
                    <div className={`relative flex items-center ${item.align === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                      <div className="absolute left-8 md:left-1/2 -ml-4 w-8 h-8 rounded-full bg-white border-4 border-porcelain-300 flex items-center justify-center z-10 font-bold text-xs">
                        {item.step}
                      </div>
                      <div className={`ml-20 md:ml-0 md:w-1/2 ${item.align === 'left' ? 'md:pr-12 text-left md:text-right' : 'md:pl-12'}`}>
                        <div className={`p-6 rounded-xl border ${item.isAi ? 'border-iris-200 bg-iris-50/30' : 'border-porcelain-200 bg-white'} shadow-sm`}>
                          <h4 className={`text-lg font-bold mb-2 ${item.isAi ? 'text-iris-800' : 'text-graphite'}`}>
                            {item.title}
                          </h4>
                          <p className="text-graphite-600">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. AI Investigation Workflow */}
        <section className="py-24 bg-emerald text-porcelain-50 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Multi-Agent Orchestration</h2>
              <p className="text-emerald-100">Our specialized AI agents work together to solve complex problems.</p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                
                {/* Manager */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-graphite-900 p-6 rounded-xl border border-emerald-700 shadow-xl w-64 flex flex-col items-center text-center z-10"
                >
                  <Bot className="w-10 h-10 text-lime mb-3" />
                  <h4 className="font-bold">Incident Manager</h4>
                  <p className="text-xs text-porcelain-400 mt-2">Coordinates investigation and synthesizes findings</p>
                </motion.div>

                <div className="hidden md:block w-16 h-0.5 bg-emerald-600"></div>
                <div className="md:hidden h-8 w-0.5 bg-emerald-600"></div>

                {/* Specialists */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Log Analyst", icon: Terminal },
                    { name: "Trace Analyst", icon: Network },
                    { name: "DB Analyst", icon: Database },
                    { name: "Code Analyst", icon: FileCode }
                  ].map((agent, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="bg-graphite-800 p-4 rounded-lg border border-emerald-800 flex items-center space-x-3"
                    >
                      <agent.icon className="w-5 h-5 text-iris" />
                      <span className="font-medium text-sm">{agent.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Integrations */}
        <section id="integrations" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4 text-graphite">Integrates with your stack</h2>
              <p className="text-graphite-600">Connects seamlessly with the tools you already use.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
              {[
                { name: "GitHub", icon: Github },
                { name: "Slack", icon: MessageSquare },
                { name: "PagerDuty", icon: AlertTriangle },
                { name: "Datadog", icon: Activity },
                { name: "AWS", icon: Server },
                { name: "PostgreSQL", icon: Database },
                { name: "Redis", icon: Database },
                { name: "OpenTelemetry", icon: Network },
                { name: "Prometheus", icon: Activity },
                { name: "Grafana", icon: Layout },
              ].map((integration, i) => (
                <FadeIn key={i} delay={i * 0.05} className="flex flex-col items-center justify-center p-6 bg-porcelain-50 rounded-xl border border-porcelain-200 hover:shadow-md transition-shadow">
                  <integration.icon className="w-8 h-8 text-graphite-500 mb-3" />
                  <span className="text-sm font-medium text-graphite-700">{integration.name}</span>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Security */}
        <section id="security" className="py-24 bg-porcelain">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-graphite">Enterprise-grade Security</h2>
                <p className="text-graphite-600 mb-8 leading-relaxed">
                  We understand the sensitivity of your operational data. Incident AI is built from the ground up with security and compliance in mind.
                </p>
                <ul className="space-y-4">
                  {[
                    "SOC 2 Type II Certified",
                    "GDPR & CCPA Compliant",
                    "End-to-End Encryption (Transit & Rest)",
                    "Granular Role-Based Access Control (RBAC)",
                    "Comprehensive Audit Logging"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-graphite-700">
                      <Shield className="w-5 h-5 text-signal" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-8 rounded-xl border border-porcelain-200 shadow-sm relative">
                <div className="absolute top-0 right-0 p-4">
                  <Lock className="w-12 h-12 text-porcelain-300" />
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="pb-6 border-b border-porcelain-200">
                    <h4 className="font-bold text-graphite mb-1">Data Privacy</h4>
                    <p className="text-sm text-graphite-500">Your telemetry data is never used to train public models.</p>
                  </div>
                  <div className="pb-6 border-b border-porcelain-200">
                    <h4 className="font-bold text-graphite mb-1">Data Retention</h4>
                    <p className="text-sm text-graphite-500">Customizable retention policies to meet your compliance needs.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-graphite mb-1">Deployment Options</h4>
                    <p className="text-sm text-graphite-500">SaaS, Dedicated Cloud, or On-Premise deployments available.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FAQ */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-graphite">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "How does Incident AI access our data?", a: "We connect via read-only APIs to your existing observability tools and source code repositories. We do not require agents to be installed on your servers." },
                { q: "Can it automatically fix issues?", a: "Currently, Incident AI focuses on investigation and providing actionable remediation steps. Auto-remediation capabilities are on our roadmap for select safe operations." },
                { q: "What happens if the AI is wrong?", a: "Incident AI always provides citations and links to the underlying raw data (logs, traces) that led to its conclusion, allowing your engineers to easily verify its reasoning." },
                { q: "How long does it take to set up?", a: "Most teams are fully integrated and running their first investigation within 15 minutes of signing up." },
                { q: "Do you offer on-premise deployment?", a: "Yes, for our Enterprise tier customers, we offer VPC peering and fully on-premise deployment options." }
              ].map((faq, i) => (
                <div key={i} className="border border-porcelain-200 rounded-lg bg-porcelain-50 overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-4 text-left font-bold text-graphite flex justify-between items-center hover:bg-porcelain-100 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 text-graphite-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-4 pt-0 text-graphite-600 text-sm">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. CTA Banner */}
        <section className="bg-graphite text-porcelain-50 py-20">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <h2 className="text-4xl font-bold mb-6">Ready to investigate smarter?</h2>
            <p className="text-porcelain-400 mb-8 text-lg">
              Join leading engineering teams resolving incidents 10x faster with AI.
            </p>
            <Link href="/signup" className="inline-flex items-center bg-lime text-graphite px-8 py-4 rounded-md font-bold text-lg hover:bg-lime-400 transition-colors shadow-[0_0_20px_rgba(184,230,46,0.3)]">
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="bg-graphite-950 text-porcelain-400 py-12 border-t border-graphite-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-6 h-6 rounded bg-lime flex items-center justify-center text-graphite font-bold text-xs">
                  AI
                </div>
                <span className="font-semibold text-porcelain-50">Incident AI</span>
              </div>
              <p className="text-sm">The autonomous incident investigation platform for modern engineering teams.</p>
            </div>
            <div>
              <h4 className="font-bold text-porcelain-50 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-lime transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-porcelain-50 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-lime transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-porcelain-50 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-lime transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-lime transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-graphite-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Incident AI Inc. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="hover:text-porcelain-50 transition-colors"><Github className="w-5 h-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
