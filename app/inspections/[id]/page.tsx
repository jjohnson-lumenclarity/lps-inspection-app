'use client'
import Link from 'next/link'
import { createInspection } from '../../actions'

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
      <Link href="/" style={{
        display: 'inline-flex', gap: 8, alignItems: 'center',
        padding: '12px 24px', background: '#6B7280', color: 'white',
        textDecoration: 'none', borderRadius: 8, marginBottom: 30
      }}>
        ← Back to Dashboard
      </Link>
      
      <h1 style={{ color: '#3B82F6', fontSize: 36, marginBottom: 30 }}>
        📋 Project #{params.id} Inspections
      </h1>
      
      <form action={createInspection} style={{
        background: 'white', padding: 30, borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 30
      }}>
        <input name="projectId" value={params.id} hidden />
        <div style={{display: 'flex', gap: 15}}>
          <input name="inspector" placeholder="Inspector Name" required 
            style={{flex: 1, padding: 15, border: '1px solid #D1D5DB', borderRadius: 8}} />
          <button type="submit" style={{
            padding: '15px 32px', background: '#10B981', color: 'white',
            border: 'none', borderRadius: 8, fontWeight: 'bold' }}>
            ➕ New Inspection
          </button>
        </div>
      </form>
    </div>
  )
}
