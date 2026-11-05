"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    console.error("Uncaught error:", error, errorInfo)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-porcelain-300 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-graphite-900">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-sm text-graphite-600">
            An unexpected error occurred in this section of the application. 
            Our team has been notified.
          </p>
          
          <Button onClick={this.handleReset} variant="primary" className="mb-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          {this.state.error && (
            <details className="w-full max-w-2xl text-left bg-porcelain-100 p-4 rounded-md border border-porcelain-300">
              <summary className="text-sm font-medium text-graphite-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500 rounded p-1">
                View Error Details
              </summary>
              <pre className="mt-4 overflow-auto text-xs text-graphite-800 p-4 bg-white border border-porcelain-300 rounded font-mono">
                {this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
