'use client'
import { useState, useTransition } from 'react'
import { prisma } from '@/lib/prisma'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [isPending, startTransition] = useTransition()

  return (
    <main style={{ 
      padding: 40, 
      maxWidth: 1000, 
      margin: '0 auto',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30
      }}>
        <h1 style={{ 
          color: '#3B82F6', 
          fontSize: 42, 
          margin: 0 
        }}>
          🏗️ LPS Dashboard
        </h1>
        <span style={{ 
          padding: '12px 24px', 
          background: '#10B981', 
          color: 'white', 
          borderRadius: 25,
          fontWeight: 'bold',
          fontSize: 18
        }}>
          {projects.length} Projects
        </span>
      </div>

      {/* ADD PROJECT FORM */}
      <form action={async (formData) => {
        "use server"
        const name = formData.get('name') as string
        const address = formData.get('address') as string
        
        // Prisma create (runs on Vercel)
        await prisma.project.create({
          data: { name, address }
        })
        
        // Refresh (deploys later)
        window.location.reload()
      }} style={{
        background: 'white',
        padding: 30,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: 30
      }}>
        <h2 style={{marginBottom: 20, color: '#1F2937'}}>
          ➕ New Project
        </h2>
        <div style={{display: 'flex', gap: 15, flexWrap: 'wrap'}}>
          <input 
            name="name" 
            placeholder="Project Name" 
            required 
            style={{
              flex: 1,
              minWidth: 250,
              padding: 15,
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 16
            }}
          />
          <input 
            name="address" 
            placeholder="123 Main St, Sparta MI" 
            required
            style={{
              flex: 1, 
              minWidth: 300,
              padding: 15,
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 16
            }}
          />
          <button 
            type="submit" 
            disabled={isPending}
            style={{
              padding: '15px 32px',
              background: isPending ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: isPending ? 'not-allowed' : 'pointer'
            }}
          >
            {isPending ? 'Adding...' : '+ Add Project'}
          </button>
        </div>
      </form>

      {/* PROJECTS GRID */}
      <div style={{display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr)')}}>
        {projects.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: 60,
            textAlign: 'center',
            color: '#6B7280',
            border: '2px dashed #D1D5DB',
            borderRadius: 12
          }}>
            <h3 style={{marginBottom: 10}}>No projects yet</h3>
            <p>Add your first LPS inspection project above!</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} style={{
              padding: 25,
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{margin: '0 0 8px 0', color: '#1F2937', fontSize: 20}}>
                {project.name}
              </h3>
              <p style={{margin: '0 0 20px 0', color: '#6B7280'}}>
                {project.address}
              </p>
              <button style={{
                padding: '10px 20px',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                📋 New Inspection
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
