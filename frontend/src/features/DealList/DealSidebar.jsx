import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealContext } from '../../context/DealContext'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/ErrorMessage'

// Sidebar: New Deal button + deal list with outcome and complexity badges
const DealSidebar = () => {
  const navigate = useNavigate()
  const { dealsList, loading, error, setError, deleteDeal } = useDealContext()

  const handleNewDeal = () => {
    navigate('/new')
  }

  const handleSelectDeal = (dealId) => {
    navigate(`/deals/${dealId}`)
  }

  const handleDeleteDeal = (e, dealId) => {
    e.stopPropagation()
    if (confirm('Delete this deal?')) {
      deleteDeal(dealId)
    }
  }

  // Format date as "May 16, 2026" per spec
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with New Deal button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewDeal}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + New Deal
        </button>
      </div>

      {/* Deals list */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={() => setError(null)} />
          </div>
        )}

        {loading ? (
          <div className="p-4">
            <Loading label="Loading deals..." />
          </div>
        ) : dealsList.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No deals yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {dealsList.map((deal) => {
              // Outcome badge: green "Closed Won" / red "Closed Lost"
              const outcomeColor = deal.deal_outcome === 'closed_won'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              const outcomeLabel = deal.deal_outcome === 'closed_won' ? 'Closed Won' : 'Closed Lost'

              return (
                <div
                  key={deal.deal_id}
                  onClick={() => handleSelectDeal(deal.deal_id)}
                  className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition group"
                >
                  {/* Company name in bold */}
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {deal.company_name}
                  </div>

                  {/* Outcome badge (green/red) and complexity badge (gray pill) */}
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${outcomeColor}`}>
                      {outcomeLabel}
                    </span>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                      {deal.complexity.charAt(0).toUpperCase() + deal.complexity.slice(1)}
                    </span>
                  </div>

                  {/* Date formatted as "May 16, 2026" */}
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(deal.generated_at)}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteDeal(e, deal.deal_id)}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DealSidebar
