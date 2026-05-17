import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { DealProvider, useDealContext } from './context/DealContext'
import DealSidebar from './features/DealList/DealSidebar'
import ConfigForm from './features/ConfigForm/ConfigForm'
import DealView from './features/DealView/DealView'
import EmptyState from './features/DealList/EmptyState'
import './App.css'

// Layout wrapper: sidebar + outlet
const Layout = () => {
  const { fetchDealsList } = useDealContext()

  // Fetch deals on mount
  useEffect(() => {
    fetchDealsList()
  }, [fetchDealsList])

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar: 280px fixed left */}
      <div className="flex-shrink-0 bg-gray-50 border-r border-gray-200" style={{ width: '280px' }}>
        <DealSidebar />
      </div>

      {/* Main content: scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}

// App with routing
const App = () => {
  return (
    <DealProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<EmptyState />} />
            <Route path="/new" element={<ConfigForm />} />
            <Route path="/deals/:deal_id" element={<DealView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DealProvider>
  )
}

export default App
