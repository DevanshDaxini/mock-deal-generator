import React from 'react'

// Spinner with optional label
const Loading = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="spinner mr-2"></div>
      <span className="text-gray-600">{label}</span>
    </div>
  )
}

export default Loading
