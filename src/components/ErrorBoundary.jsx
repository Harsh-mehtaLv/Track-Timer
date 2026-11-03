import React from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg mx-auto py-16 px-4 text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Something went wrong loading this view
          </h2>
          <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please click below to reset.'}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            {this.props.onResetTab && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  this.props.onResetTab('today')
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Today</span>
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
