import React from 'react'

// Error display with optional retry button
const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
      <p className="text-red-800 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
