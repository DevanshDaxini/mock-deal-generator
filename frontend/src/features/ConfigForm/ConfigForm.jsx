import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDealContext } from '../../context/DealContext'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'

// Form for generating new deal with 14 fields
const ConfigForm = () => {
  const navigate = useNavigate()
  const { generateDeal, loading, error, setError } = useDealContext()

  // Form state with default values per Mock_Deal_REQUIREMENTS.md Section 10.4
  const [formData, setFormData] = useState({
    company_name: '',  // Empty to auto-generate
    industry: 'Fintech',
    deal_size: '$75k ARR',
    sales_cycle_length_days: 45,
    starting_sentiment: 'neutral',  // CRITICAL: Must be neutral
    ending_sentiment: 'positive',
    deal_outcome: 'closed_won',
    champion_entry: 'after_demo',  // CRITICAL: Must be after_demo
    main_objection: 'Security Review',  // CRITICAL: Must be Security Review
    buyer_urgency: 'medium',
    num_calls: 5,  // CRITICAL: Must be 5
    emails_per_stage: 2,
    num_stakeholders: 3,
    complexity: 'messy'  // CRITICAL: Must be messy
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (
        ['sales_cycle_length_days', 'num_calls', 'emails_per_stage', 'num_stakeholders'].includes(name)
          ? parseInt(value)
          : value
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      // Send company_name as null if empty string for auto-generation
      const payload = {
        ...formData,
        company_name: formData.company_name === '' ? null : formData.company_name
      }
      const response = await generateDeal(payload)
      // Auto-navigate to deal detail page
      navigate(`/deals/${response.deal_id}`)
    } catch (err) {
      // Error is already set in context, displayed below
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Deal</h1>
      <p className="text-gray-600 mb-6">Configure your synthetic B2B sales deal parameters</p>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Leave blank to auto-generate"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="e.g., Fintech"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Deal Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
          <input
            type="text"
            name="deal_size"
            value={formData.deal_size}
            onChange={handleChange}
            placeholder="e.g., $75k ARR"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Sales Cycle Length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sales Cycle Length (days)</label>
          <input
            type="number"
            name="sales_cycle_length_days"
            value={formData.sales_cycle_length_days}
            onChange={handleChange}
            min="14"
            max="180"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Starting Sentiment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starting Sentiment</label>
          <select
            name="starting_sentiment"
            value={formData.starting_sentiment}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="concerned">Concerned</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Ending Sentiment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ending Sentiment</label>
          <select
            name="ending_sentiment"
            value={formData.ending_sentiment}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="concerned">Concerned</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Deal Outcome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deal Outcome</label>
          <select
            name="deal_outcome"
            value={formData.deal_outcome}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>

        {/* Champion Entry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Champion Entry</label>
          <select
            name="champion_entry"
            value={formData.champion_entry}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="none">None</option>
            <option value="before_discovery">Before Discovery</option>
            <option value="during_discovery">During Discovery</option>
            <option value="after_demo">After Demo</option>
            <option value="during_procurement">During Procurement</option>
            <option value="late_stage_rescue">Late Stage Rescue</option>
          </select>
        </div>

        {/* Main Objection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main Objection</label>
          <input
            type="text"
            name="main_objection"
            value={formData.main_objection}
            onChange={handleChange}
            placeholder="e.g., Security Review"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Buyer Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Urgency</label>
          <select
            name="buyer_urgency"
            value={formData.buyer_urgency}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Number of Calls */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Calls</label>
          <input
            type="number"
            name="num_calls"
            value={formData.num_calls}
            onChange={handleChange}
            min="1"
            max="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Emails Per Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emails Per Stage</label>
          <input
            type="number"
            name="emails_per_stage"
            value={formData.emails_per_stage}
            onChange={handleChange}
            min="1"
            max="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Number of Stakeholders */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Number of Stakeholders</label>
          <input
            type="number"
            name="num_stakeholders"
            value={formData.num_stakeholders}
            onChange={handleChange}
            min="2"
            max="8"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Complexity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
          <select
            name="complexity"
            value={formData.complexity}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="simple">Simple</option>
            <option value="normal">Normal</option>
            <option value="messy">Messy</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="spinner mr-2"></div>
              Generating deal...
            </>
          ) : (
            'Generate Deal'
          )}
        </button>
      </form>
    </div>
  )
}

export default ConfigForm
