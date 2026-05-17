import React, { useState, useMemo } from 'react'
import TimelineEvent from '../../components/TimelineEvent'

// Timeline grouped by stage with champion marker per spec
const DealTimeline = ({ deal }) => {
  const events = deal.events || []
  const metadata = deal.metadata

  // Group events by stage
  const eventsByStage = useMemo(() => {
    const grouped = {
      'Prospecting': [],
      'Discovery': [],
      'Demo': [],
      'Evaluation': [],
      'Negotiation': [],
      'Closed': []
    }

    events.forEach(event => {
      if (grouped[event.stage]) {
        grouped[event.stage].push(event)
      }
    })

    // Sort events within each stage by timestamp
    Object.keys(grouped).forEach(stage => {
      grouped[stage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    })

    return grouped
  }, [events])

  const stageNames = ['Prospecting', 'Discovery', 'Demo', 'Evaluation', 'Negotiation', 'Closed']

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Timeline</h2>

      <div className="space-y-8">
        {stageNames.map(stageName => {
          const stageEvents = eventsByStage[stageName] || []

          // Check if champion entered in this stage per spec
          const stageInfo = metadata.stage_progression.find(s => s.stage === stageName)
          const championEntered = stageInfo?.champion_entered

          return (
            <div key={stageName}>
              {/* Stage divider */}
              <div className="flex items-center mb-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <h3 className="px-4 font-bold text-gray-700">{stageName}</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Champion marker */}
              {championEntered && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                  👤 Champion entered in this stage
                </div>
              )}

              {/* Events in stage */}
              <div className="space-y-3">
                {stageEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No events in this stage</p>
                ) : (
                  stageEvents.map(event => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      allEvents={events}
                      stakeholders={metadata.stakeholders}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DealTimeline
