import React, { useState } from 'react'

const TimelineEvent = ({ event, allEvents, stakeholders }) => {
  const [expanded, setExpanded] = useState(false)

  const getStakeholderNames = (ids) =>
    ids.map(id => stakeholders.find(s => s.id === id)?.name || 'Unknown').join(', ')

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const sentimentStyle = {
    positive: { background: 'var(--teal-mid)', color: 'var(--teal)' },
    neutral:  { background: 'rgba(136,136,160,0.12)', color: 'var(--text-muted)' },
    concerned:{ background: 'rgba(232,164,74,0.12)', color: 'var(--amber)' },
    negative: { background: 'rgba(239,68,68,0.12)', color: '#f87171' },
  }

  // Priority colors for support tickets
  const priorityStyles = {
    critical: { background: 'rgba(239,68,68,0.12)', color: '#f87171' },
    high: { background: 'rgba(239,68,68,0.12)', color: '#f87171' },
    medium: { background: 'rgba(251,146,60,0.12)', color: '#fb923c' },
    low: { background: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  }

  const CANONICAL = ['positive', 'neutral', 'concerned', 'negative']
  const normalizeSentiment = (s) => {
    if (!s) return 'neutral'
    const lower = s.toLowerCase()
    return CANONICAL.find(c => lower === c) || CANONICAL.find(c => lower.includes(c)) || 'neutral'
  }
  const sentimentKey = normalizeSentiment(event.sentiment)
  const sentimentLabel = sentimentKey.charAt(0).toUpperCase() + sentimentKey.slice(1)

  const typeLabel = { call: 'Call', email: 'Email', crm_note: 'Note', support_ticket: 'Ticket', support_call: 'Support', internal_call: 'Int. Call' }[event.record_type] || '–'

  const supportCallTitle = (() => {
    const customer = event.participants?.find(p => p.role === 'customer_contact')
    if (customer?.name) return `Call with ${customer.name}`
    const callType = event.call_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return callType ? `${callType} Call` : 'Support Call'
  })()

  const supportEngineerName = event.participants?.find(p => p.role === 'support_engineer')?.name || null

  const fmt = s => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '–'

  // Determine styling based on event type
  const isSupport = event.record_type === 'support_ticket' || event.record_type === 'support_call'
  const isInternalCall = event.record_type === 'internal_call'
  const supportEventStyle = event.record_type === 'support_ticket'
    ? { borderColor: 'rgba(59,130,246,0.26)', background: 'var(--surface)' }
    : event.record_type === 'support_call'
    ? { borderColor: 'rgba(34,197,94,0.26)', background: 'var(--surface)' }
    : event.record_type === 'internal_call'
    ? { borderColor: 'rgba(168,85,247,0.26)', background: 'var(--surface)' }
    : {}

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--rule)',
    borderRadius: '8px',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    ...supportEventStyle,
  }

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={cardStyle}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = isSupport
            ? (event.record_type === 'support_ticket' ? 'rgba(59,130,246,0.5)' : 'rgba(34,197,94,0.5)')
            : isInternalCall
            ? 'rgba(168,85,247,0.5)'
            : 'var(--teal-border)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isSupport
            ? (event.record_type === 'support_ticket' ? 'rgba(59,130,246,0.26)' : 'rgba(34,197,94,0.26)')
            : isInternalCall
            ? 'rgba(168,85,247,0.26)'
            : 'var(--rule)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: '2px', minWidth: '36px' }}>
            {typeLabel}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {event.record_type === 'call' ? event.title : event.record_type === 'email' ? event.subject : event.record_type === 'support_ticket' ? (event.description_preview || event.description) : event.record_type === 'support_call' ? supportCallTitle : event.record_type === 'internal_call' ? event.title : 'CRM Note'}
              </span>
              {event.record_type === 'email' && event.sender?.name && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{event.sender.name}</span>
              )}
              {event.record_type === 'support_ticket' && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{event.from_company ? 'Customer' : 'Internal'}</span>
              )}
              {event.record_type === 'support_ticket' && event.priority && (
                <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '3px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em', ...priorityStyles[event.priority?.toLowerCase() || 'low'] }}>
                  {event.priority}
                </span>
              )}
              {event.record_type === 'support_call' && supportEngineerName && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{supportEngineerName}</span>
              )}
              {event.record_type === 'internal_call' && (
                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '3px', background: 'rgba(168,85,247,0.12)', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Sales Team</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {event.record_type === 'crm_note'
                ? event.author
                : event.record_type === 'call'
                ? getStakeholderNames(event.participants?.map(p => p.stakeholder_id) || [])
                : event.record_type === 'support_ticket'
                ? fmt(event.ticket_type)
                : event.record_type === 'support_call'
                ? [supportEngineerName, event.call_duration_minutes ? `${event.call_duration_minutes} min` : null].filter(Boolean).join(' · ')
                : event.record_type === 'internal_call'
                ? event.participants?.map(p => p.name).join(', ')
                : null}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {formatDate(event.timestamp)}
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '500', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', ...sentimentStyle[sentimentKey] }}>
              {sentimentLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Expanded
  return (
    <div
      onClick={() => setExpanded(false)}
      style={{
        ...cardStyle,
        borderColor: isSupport
          ? (event.record_type === 'support_ticket' ? 'rgba(59,130,246,0.4)' : 'rgba(34,197,94,0.4)')
          : isInternalCall
          ? 'rgba(168,85,247,0.4)'
          : 'var(--teal-border)',
        background: 'var(--surface-hi)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--rule)' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: '2px', minWidth: '36px' }}>
          {typeLabel}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {event.record_type === 'call' ? event.title : event.record_type === 'email' ? event.subject : event.record_type === 'support_ticket' ? (event.description_preview || event.description) : event.record_type === 'support_call' ? supportCallTitle : event.record_type === 'internal_call' ? event.title : 'CRM Note'}
            {event.record_type === 'support_ticket' && event.ticket_id && (
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '400' }}>
                ({event.ticket_id})
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {event.record_type === 'crm_note' ? event.author
              : event.record_type === 'call' ? getStakeholderNames(event.participants?.map(p => p.stakeholder_id) || [])
              : event.record_type === 'support_ticket' ? [event.from_company ? 'Customer' : 'Internal', fmt(event.ticket_type)].join(' · ')
              : event.record_type === 'support_call' ? [supportEngineerName, event.call_duration_minutes ? `${event.call_duration_minutes} min` : null].filter(Boolean).join(' · ')
              : event.record_type === 'internal_call' ? event.participants?.map(p => `${p.name} (${p.role})`).join(', ')
              : null}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{formatDate(event.timestamp)}</div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '500', padding: '3px 8px', borderRadius: '4px', flexShrink: 0, ...sentimentStyle[sentimentKey] }}>
          {sentimentLabel}
        </span>
      </div>

      {/* Call content */}
      {event.record_type === 'call' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Transcript</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '320px', overflowY: 'auto', lineHeight: '1.6' }}>
              {event.transcript}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Summary</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>{event.summary}</p>
          </div>
          {event.next_steps?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Next Steps</div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {event.next_steps.map((step, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{step}</li>)}
              </ul>
            </div>
          )}
          {event.objections_raised?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Objections</div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {event.objections_raised.map((obj, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{obj}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Email content */}
      {event.record_type === 'email' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '6px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)' }}>{event.sender.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{formatDate(event.timestamp)}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            To: {event.recipients.map(r => r.name).join(', ')}
            {event.cc?.length > 0 && ` · CC: ${event.cc.map(c => c.name).join(', ')}`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>{event.body}</div>
        </div>
      )}

      {/* CRM Note content */}
      {event.record_type === 'crm_note' && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Internal Note</div>
          <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '10px' }}>{event.content}</p>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{event.author} · {formatDate(event.timestamp)}</div>
        </div>
      )}

      {/* Internal Call content */}
      {event.record_type === 'internal_call' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Internal Call banner */}
          <div style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '6px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Internal Sales Team Call</span>
          </div>

          {/* Participants section */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Participants</div>
            <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {event.participants?.map((p, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{p.name} — {p.role}</li>)}
            </ul>
          </div>

          {/* Deal health badge */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Deal Health</div>
            <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', ...(event.deal_health === 'on_track' ? { background: 'var(--teal-low)', color: 'var(--teal)' } : event.deal_health === 'at_risk' ? { background: 'rgba(232,164,74,0.12)', color: 'var(--amber)' } : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }) }}>
              {event.deal_health ? (event.deal_health.charAt(0).toUpperCase() + event.deal_health.slice(1)).replace(/_/g, ' ') : '–'}
            </div>
          </div>

          {/* Transcript */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Transcript</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '320px', overflowY: 'auto', lineHeight: '1.6' }}>
              {event.transcript}
            </div>
          </div>

          {/* Summary */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Summary</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>{event.summary}</p>
          </div>

          {/* Action Items */}
          {event.action_items?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Action Items</div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {event.action_items.map((item, i) => <li key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Support Ticket content */}
      {event.record_type === 'support_ticket' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Type</div>
                <div style={{ color: 'var(--text)' }}>{fmt(event.ticket_type)}</div>
              </div>
              {event.priority && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Priority</div>
                  <div style={{ display: 'inline-block', ...priorityStyles[event.priority?.toLowerCase() || 'low'], padding: '2px 6px', borderRadius: '3px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {event.priority?.charAt(0).toUpperCase() + event.priority?.slice(1)}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Submitted By</div>
                <div style={{ color: 'var(--text)' }}>{event.from_company ? 'Customer' : 'Internal'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Days Since Close</div>
                <div style={{ color: 'var(--text)' }}>{event.days_since_close ?? '–'}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Description</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>{event.description}</p>
          </div>
        </div>
      )}

      {/* Support Call content */}
      {event.record_type === 'support_call' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              {supportEngineerName && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Support Engineer</div>
                  <div style={{ color: 'var(--text)' }}>{supportEngineerName}</div>
                </div>
              )}
              {event.call_duration_minutes && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Duration</div>
                  <div style={{ color: 'var(--text)' }}>{event.call_duration_minutes} minutes</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Type</div>
                <div style={{ color: 'var(--text)' }}>{fmt(event.call_type)}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Days Since Close</div>
                <div style={{ color: 'var(--text)' }}>{event.days_since_close ?? '–'}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Transcript</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '320px', overflowY: 'auto', lineHeight: '1.6' }}>
              {event.transcript}
            </div>
          </div>
          {event.resolution && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Resolution</div>
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6' }}>{event.resolution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TimelineEvent
