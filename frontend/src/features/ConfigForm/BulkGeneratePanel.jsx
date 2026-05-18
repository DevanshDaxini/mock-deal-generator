import React, { useState } from 'react'
import { useDealContext } from '../../context/DealContext'

const inputStyle = {
  padding: '7px 10px', background: 'var(--surface)',
  border: '1px solid var(--rule)', borderRadius: '6px', color: 'var(--text)',
  fontFamily: 'inherit', fontSize: '13px', outline: 'none', width: '100%',
}
const labelStyle = {
  fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const INDUSTRIES = [
  'Fintech','Healthcare IT','Cybersecurity','DevTools','HR Tech',
  'Legal Tech','EdTech','Supply Chain','Real Estate Tech','MarTech',
  'InsurTech','Logistics','Manufacturing SaaS','Retail Tech','CleanTech',
]
const DEAL_SIZES = [
  '$25k ARR','$50k ARR','$75k ARR','$100k ARR','$150k ARR',
  '$200k ARR','$300k ARR','$500k ARR','$750k ARR','$1M ARR',
]
const OBJECTIONS = [
  'Security Review','Budget Constraints','Integration Complexity',
  'Compliance Requirements','Vendor Risk Assessment','Contract Negotiation',
  'Technical Fit','ROI Justification','Procurement Process',
  'Competing Priority','Executive Buy-In','Data Privacy',
]

const RandomToggle = ({ locked, onToggle }) => (
  <button type="button" onClick={onToggle} style={{
    padding: '3px 10px', fontSize: '11px', fontWeight: '500',
    background: locked ? 'var(--teal)' : 'var(--surface)',
    color: locked ? '#fff' : 'var(--text-muted)',
    border: '1px solid', borderColor: locked ? 'var(--teal)' : 'var(--rule)',
    borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  }}>
    {locked ? 'Fixed' : 'Random'}
  </button>
)

const VarRow = ({ label, locked, onToggle, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ ...labelStyle, minWidth: '140px' }}>{label}</span>
    <RandomToggle locked={locked} onToggle={onToggle} />
    <div style={{ flex: 1, opacity: locked ? 1 : 0.35, pointerEvents: locked ? 'auto' : 'none' }}>
      {children}
    </div>
  </div>
)

const BulkGeneratePanel = () => {
  const { bulkGenerateStream, bulkLoading, bulkProgress, cancelGeneration } = useDealContext()
  const [count, setCount] = useState(5)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const [locks, setLocks] = useState({
    industry: false, deal_size: false, deal_outcome: false,
    complexity: false, main_objection: false, buyer_urgency: false,
    champion_entry: false,
  })
  const [vals, setVals] = useState({
    industry: 'Fintech', deal_size: '$75k ARR', deal_outcome: 'closed_won',
    complexity: 'normal', main_objection: 'Security Review', buyer_urgency: 'medium',
    champion_entry: 'after_demo',
  })

  const toggle = (k) => setLocks(p => ({ ...p, [k]: !p[k] }))
  const setVal = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const buildOverrides = () => {
    const o = {}
    for (const [k, locked] of Object.entries(locks)) {
      if (locked) o[k] = vals[k]
    }
    return Object.keys(o).length ? o : null
  }

  const handleGenerate = async () => {
    setDone(false)
    setError(null)
    try {
      await bulkGenerateStream(count, buildOverrides())
      setDone(true)
    } catch (err) {
      setError(err.message || 'Bulk generation failed')
    }
  }

  const progressPct = bulkProgress.total > 0
    ? Math.round(((bulkProgress.completed + bulkProgress.failed) / bulkProgress.total) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Count slider */}
      <div>
        <label style={{ display: 'block', ...labelStyle, marginBottom: '6px' }}>Number of Deals</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input type="range" min={1} max={20} value={count}
            onChange={e => setCount(Number(e.target.value))}
            disabled={bulkLoading}
            style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', minWidth: '40px', textAlign: 'right' }}>{count}</span>
        </div>
      </div>

      {/* Per-variable controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--rule)', paddingTop: '16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Toggle a variable to fix it across all generated deals. Unlocked variables are randomized.
        </p>

        <VarRow label="Industry" locked={locks.industry} onToggle={() => toggle('industry')}>
          <select value={vals.industry} onChange={e => setVal('industry', e.target.value)} style={inputStyle}>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </VarRow>

        <VarRow label="Deal Size" locked={locks.deal_size} onToggle={() => toggle('deal_size')}>
          <select value={vals.deal_size} onChange={e => setVal('deal_size', e.target.value)} style={inputStyle}>
            {DEAL_SIZES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </VarRow>

        <VarRow label="Deal Outcome" locked={locks.deal_outcome} onToggle={() => toggle('deal_outcome')}>
          <select value={vals.deal_outcome} onChange={e => setVal('deal_outcome', e.target.value)} style={inputStyle}>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </VarRow>

        <VarRow label="Complexity" locked={locks.complexity} onToggle={() => toggle('complexity')}>
          <select value={vals.complexity} onChange={e => setVal('complexity', e.target.value)} style={inputStyle}>
            <option value="simple">Simple</option>
            <option value="normal">Normal</option>
            <option value="messy">Messy</option>
          </select>
        </VarRow>

        <VarRow label="Main Objection" locked={locks.main_objection} onToggle={() => toggle('main_objection')}>
          <select value={vals.main_objection} onChange={e => setVal('main_objection', e.target.value)} style={inputStyle}>
            {OBJECTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </VarRow>

        <VarRow label="Buyer Urgency" locked={locks.buyer_urgency} onToggle={() => toggle('buyer_urgency')}>
          <select value={vals.buyer_urgency} onChange={e => setVal('buyer_urgency', e.target.value)} style={inputStyle}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </VarRow>

        <VarRow label="Champion Entry" locked={locks.champion_entry} onToggle={() => toggle('champion_entry')}>
          <select value={vals.champion_entry} onChange={e => setVal('champion_entry', e.target.value)} style={inputStyle}>
            <option value="none">None</option>
            <option value="before_discovery">Before Discovery</option>
            <option value="during_discovery">During Discovery</option>
            <option value="after_demo">After Demo</option>
            <option value="during_procurement">During Procurement</option>
            <option value="late_stage_rescue">Late Stage Rescue</option>
          </select>
        </VarRow>
      </div>

      {/* Progress bar */}
      {bulkLoading && bulkProgress.total > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {bulkProgress.completed + bulkProgress.failed} of {bulkProgress.total} complete
              {bulkProgress.failed > 0 && <span style={{ color: '#e05c5c', marginLeft: '8px' }}>{bulkProgress.failed} failed</span>}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{progressPct}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--surface-hi)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--teal)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {done && !bulkLoading && (
        <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: '6px', fontSize: '13px', color: 'var(--text)' }}>
          Done — {bulkProgress.completed} deal{bulkProgress.completed !== 1 ? 's' : ''} generated
          {bulkProgress.failed > 0 && <span style={{ color: '#e05c5c' }}>, {bulkProgress.failed} failed</span>}.
          Check the sidebar.
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid #e05c5c', borderRadius: '6px', fontSize: '13px', color: '#e05c5c' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleGenerate} disabled={bulkLoading} style={{
          flex: 1, padding: '11px',
          background: bulkLoading ? 'var(--surface-hi)' : 'var(--teal)',
          color: bulkLoading ? 'var(--text-muted)' : '#fff',
          borderRadius: '6px', border: 'none', fontFamily: 'inherit',
          fontSize: '14px', fontWeight: '500',
          cursor: bulkLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          {bulkLoading
            ? <><div className="spinner" />Generating {bulkProgress.completed + bulkProgress.failed}/{bulkProgress.total}...</>
            : `Generate ${count} Random Deal${count !== 1 ? 's' : ''}`}
        </button>
        {bulkLoading && (
          <button onClick={cancelGeneration} style={{
            padding: '11px 16px', background: 'var(--surface)', color: 'var(--text-muted)',
            borderRadius: '6px', border: '1px solid var(--rule)', fontFamily: 'inherit',
            fontSize: '14px', cursor: 'pointer',
          }}>Cancel</button>
        )}
      </div>
    </div>
  )
}

export default BulkGeneratePanel
