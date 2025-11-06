import React from 'react'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Travel CRM</h1>
          <p className="text-primary-100">B2B Travel Management System</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
