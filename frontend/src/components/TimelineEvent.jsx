import React, { useState, useMemo } from 'react'

// Timeline event card with collapse/expand functionality per spec
const TimelineEvent = ({ event, allEvents, stakeholders }) => {
  const [expanded, setExpanded] = useState(false)

  // Get stakeholder names from IDs
  const getStakeholderNames = (ids) => {
    return ids
      .map(id => {
        const stakeholder = stakeholders.find(s => s.id === id)
        return stakeholder ? stakeholder.name : 'Unknown'
      })
      .join(', ')
  }

  // Get sentiment color class per spec
  const getSentimentClass = (sentiment) => {
    const sentimentMap = {
      positive: 'sentiment-positive',
      neutral: 'sentiment-neutral',
      concerned: 'sentiment-concerned',
      negative: 'sentiment-negative'
    }
    return sentimentMap[sentiment] || 'bg-gray-100 text-gray-700'
  }

  // Format timestamp
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get event icon per spec
  const getIcon = () => {
    switch (event.record_type) {
      case 'call':
        return '☎️'
      case 'email':
        return '✉️'
      case 'crm_note':
        return '📝'
      default:
        return '•'
    }
  }

  // Collapsed view per spec
  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
      >
        <div className="flex items-start gap-3">
          {/* Left: Icon */}
          <div className="text-2xl mt-1">{getIcon()}</div>

          {/* Center: Title, participants, date */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">
              {event.record_type === 'call'
                ? event.title
                : event.record_type === 'email'
                ? event.subject
                : 'CRM Note'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {event.record_type === 'crm_note'
                ? `${event.author}`
                : getStakeholderNames(event.participants?.map(p => p.stakeholder_id) || [])}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(event.timestamp)}
            </div>
          </div>

          {/* Right: Stage tag and sentiment */}
          <div className="flex-shrink-0 flex gap-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              {event.stage}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentClass(event.sentiment)}`}>
              {event.sentiment}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Expanded view per spec
  return (
    <div
      onClick={() => setExpanded(false)}
      className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer transition"
    >
      {/* Header (same as collapsed) */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-200">
        <div className="text-2xl">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">
            {event.record_type === 'call'
              ? event.title
              : event.record_type === 'email'
              ? event.subject
              : 'CRM Note'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {event.record_type === 'crm_note'
              ? `${event.author}`
              : getStakeholderNames(event.participants?.map(p => p.stakeholder_id) || [])}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(event.timestamp)}
          </div>
        </div>
      </div>

      {/* Content based on type per spec */}
      {event.record_type === 'call' && (
        <div className="space-y-4">
          {/* Transcript */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Transcript</h4>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
              {event.transcript}
            </div>
          </div>

          {/* Summary */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <p className="text-sm text-gray-700">{event.summary}</p>
          </div>

          {/* Next Steps */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
            <ul className="list-disc list-inside space-y-1">
              {(event.next_steps || []).map((step, i) => (
                <li key={i} className="text-sm text-gray-700">{step}</li>
              ))}
            </ul>
          </div>

          {/* Objections */}
          {event.objections_raised && event.objections_raised.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Objections Raised</h4>
              <ul className="list-disc list-inside space-y-1">
                {event.objections_raised.map((obj, i) => (
                  <li key={i} className="text-sm text-gray-700">{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {event.record_type === 'email' && (
        <div className="space-y-4">
          {/* Find all emails in thread per spec */}
          {(() => {
            const threadEmails = allEvents.filter(
              e => e.record_type === 'email' && e.thread_id === event.thread_id
            )
            threadEmails.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

            return threadEmails.map((email, idx) => (
              <div key={email.id} className="border border-gray-200 rounded p-3 bg-white">
                {idx > 0 && <div className="mb-3 pb-3 text-xs text-gray-500">---------- Forwarded message ----------</div>}
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">{email.sender.name}</div>
                  <div className="text-xs text-gray-500">{formatDate(email.timestamp)}</div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  To: {email.recipients.map(r => r.name).join(', ')}
                  {email.cc && email.cc.length > 0 && ` | CC: ${email.cc.map(c => c.name).join(', ')}`}
                </div>
                <div className="text-sm text-gray-700">{email.body}</div>
              </div>
            ))
          })()}
        </div>
      )}

      {event.record_type === 'crm_note' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Internal</span>
          </div>
          <p className="text-sm text-gray-700">{event.content}</p>
          <div className="text-xs text-gray-500">
            {event.author} · {formatDate(event.timestamp)}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineEvent
