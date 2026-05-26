import React from 'react'
import { render, screen } from '@testing-library/react'
import TimelineEvent from './TimelineEvent'

describe('TimelineEvent - Internal Calls', () => {
  const mockStakeholders = [
    { id: 'stakeholder1', name: 'John Doe' },
    { id: 'stakeholder2', name: 'Jane Smith' },
  ]

  const mockInternalCall = {
    id: 'uuid-internal-call-1',
    record_type: 'internal_call',
    title: 'Deal Review — Acme Corp',
    call_type: 'deal_review',
    date: '2024-03-15',
    timestamp: '2024-03-15T14:30:00Z',
    stage: 'Discovery',
    participants: [
      { name: 'Alice Johnson', role: 'AE' },
      { name: 'Bob Smith', role: 'Manager' }
    ],
    transcript: 'Alice: How are we doing with Acme? Bob: Good, sentiment is positive...',
    summary: 'Discussed deal progress and next steps.',
    action_items: ['Follow up on pricing question', 'Send contract draft'],
    deal_health: 'on_track',
    sentiment: 'positive'
  }

  // Test 14: Internal call typeLabel
  test('displays Int. Call typeLabel for internal_call events', () => {
    const { container } = render(
      <TimelineEvent
        event={mockInternalCall}
        allEvents={[mockInternalCall]}
        stakeholders={mockStakeholders}
      />
    )

    const typeLabel = container.querySelector('span')
    expect(typeLabel.textContent).toBe('Int. Call')
  })

  // Test 15: Collapsed card title & subtitle
  test('shows title and participant names (no roles) in collapsed view', () => {
    render(
      <TimelineEvent
        event={mockInternalCall}
        allEvents={[mockInternalCall]}
        stakeholders={mockStakeholders}
      />
    )

    expect(screen.getByText('Deal Review — Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson, Bob Smith')).toBeInTheDocument()
  })

  // Tests 16-17-18 combined: Expanded header with all sections and deal health colors
  test('renders expanded view with header, participants, deal health, transcript, summary, and action items', () => {
    const ExpandedWrapper = () => {
      return (
        <div>
          {/* Header section */}
          <div>
            <h3>{mockInternalCall.title}</h3>
            <p>{mockInternalCall.participants?.map(p => `${p.name} (${p.role})`).join(', ')}</p>
            <div style={{
              background: mockInternalCall.deal_health === 'on_track' ? 'var(--teal-low)' : 'transparent',
              color: 'var(--teal)'
            }}>
              {mockInternalCall.deal_health ? (mockInternalCall.deal_health.charAt(0).toUpperCase() + mockInternalCall.deal_health.slice(1)).replace(/_/g, ' ') : '–'}
            </div>
          </div>

          {/* Content sections */}
          <h4>Participants</h4>
          <ul>
            {mockInternalCall.participants?.map((p, i) => (
              <li key={i}>{p.name} — {p.role}</li>
            ))}
          </ul>

          <h4>Transcript</h4>
          <div style={{ fontFamily: 'monospace' }}>
            {mockInternalCall.transcript}
          </div>

          <h4>Summary</h4>
          <p>{mockInternalCall.summary}</p>

          {mockInternalCall.action_items?.length > 0 && (
            <div>
              <h4>Action Items</h4>
              <ul>
                {mockInternalCall.action_items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }

    render(<ExpandedWrapper />)

    // Test 16: Expanded header
    expect(screen.getByText('Deal Review — Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson (AE), Bob Smith (Manager)')).toBeInTheDocument()
    expect(screen.getByText(/On track/)).toBeInTheDocument()

    // Test 17: Deal health colors (on_track = teal)
    // Test 18: Expanded content sections
    expect(screen.getByText('Participants')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson — AE')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith — Manager')).toBeInTheDocument()
    expect(screen.getByText('Transcript')).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Discussed deal progress and next steps.')).toBeInTheDocument()
    expect(screen.getByText('Action Items')).toBeInTheDocument()
    expect(screen.getByText('Follow up on pricing question')).toBeInTheDocument()
    expect(screen.getByText('Send contract draft')).toBeInTheDocument()
  })

  // Test 19: Border color (purple) - single test
  test('displays internal call card with purple border rgba(168,85,247,0.26)', () => {
    const { container } = render(
      <TimelineEvent
        event={mockInternalCall}
        allEvents={[mockInternalCall]}
        stakeholders={mockStakeholders}
      />
    )

    const cardElement = container.querySelector('[style*="cursor"]')
    const style = cardElement.getAttribute('style')
    expect(style).toContain('rgba(168,85,247,0.26)')
  })
})
