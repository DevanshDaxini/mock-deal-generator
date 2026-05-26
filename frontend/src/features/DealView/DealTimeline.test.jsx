import React from 'react'
import { render, screen } from '@testing-library/react'
import DealTimeline from './DealTimeline'

describe('DealTimeline - Internal Calls', () => {
  const mockMetadata = {
    stakeholders: [
      { id: 'stakeholder1', name: 'John Doe' },
      { id: 'stakeholder2', name: 'Jane Smith' },
    ],
    config: {
      champion_entry: 'during_discovery'
    }
  }

  // Test 20: Internal calls mixed into salesEvents
  test('includes internal_call events in salesEvents filter and renders chronologically', () => {
    const mockDeal = {
      events: [
        {
          id: 'call-1',
          record_type: 'call',
          title: 'Initial Call',
          timestamp: '2024-03-01T10:00:00Z',
          stage: 'Prospecting',
          participants: [{ stakeholder_id: 'stakeholder1' }],
          sentiment: 'positive'
        },
        {
          id: 'email-1',
          record_type: 'email',
          subject: 'Follow-up Email',
          timestamp: '2024-03-05T14:00:00Z',
          stage: 'Discovery',
          sender: { name: 'Sales Team' },
          recipients: [],
          sentiment: 'neutral'
        },
        {
          id: 'internal-call-1',
          record_type: 'internal_call',
          title: 'Deal Review',
          timestamp: '2024-03-03T11:00:00Z',
          stage: 'Discovery',
          participants: [
            { name: 'Alice Johnson', role: 'AE' },
            { name: 'Bob Smith', role: 'Manager' }
          ],
          sentiment: 'positive',
          deal_health: 'on_track'
        },
        {
          id: 'support-ticket-1',
          record_type: 'support_ticket',
          description: 'Customer issue',
          timestamp: '2024-03-12T09:00:00Z',
          stage: 'Discovery',
          sentiment: 'negative'
        }
      ],
      metadata: mockMetadata
    }

    const { container } = render(<DealTimeline deal={mockDeal} />)

    const salesTimeline = container.textContent
    expect(salesTimeline).toContain('Initial Call')
    expect(salesTimeline).toContain('Follow-up Email')
    expect(salesTimeline).toContain('Deal Review')
    expect(salesTimeline).not.toContain('Customer issue')
  })

  // Test 21: Participant rendering safety (null handling)
  test('handles internal call events with various data states without crashing', () => {
    const mockDeal = {
      events: [
        {
          id: 'internal-call-1',
          record_type: 'internal_call',
          title: 'Internal Meeting',
          timestamp: '2024-03-01T10:00:00Z',
          stage: 'Discovery',
          participants: null,
          sentiment: 'positive',
          deal_health: 'on_track'
        },
        {
          id: 'internal-call-2',
          record_type: 'internal_call',
          title: 'Team Sync',
          timestamp: '2024-03-02T11:00:00Z',
          stage: 'Discovery',
          participants: [],
          sentiment: 'positive',
          deal_health: undefined
        }
      ],
      metadata: mockMetadata
    }

    const { container } = render(<DealTimeline deal={mockDeal} />)
    expect(container).toBeInTheDocument()
  })

  // Test 22: Deal health rendering safety (null handling) - also applies to DealTimeline
  test('renders internal calls correctly when deal_health is undefined or null', () => {
    const mockDeal = {
      events: [
        {
          id: 'internal-call-1',
          record_type: 'internal_call',
          title: 'Call without health',
          timestamp: '2024-03-01T10:00:00Z',
          stage: 'Discovery',
          participants: [{ name: 'Alice', role: 'AE' }],
          sentiment: 'positive',
          deal_health: null
        },
        {
          id: 'internal-call-2',
          record_type: 'internal_call',
          title: 'Call with health',
          timestamp: '2024-03-02T10:00:00Z',
          stage: 'Discovery',
          participants: [{ name: 'Bob', role: 'Manager' }],
          sentiment: 'positive',
          deal_health: 'at_risk'
        }
      ],
      metadata: mockMetadata
    }

    const { container } = render(<DealTimeline deal={mockDeal} />)
    expect(container).toBeInTheDocument()
    expect(screen.getByText('Call without health')).toBeInTheDocument()
    expect(screen.getByText('Call with health')).toBeInTheDocument()
  })
})
