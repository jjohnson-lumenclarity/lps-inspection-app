import { prisma } from '@/lib/prisma'
import { createProject } from './actions'

export default async function Dashboard() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, address: true, createdAt: true }
  })

  return (
    <main style={{ 
      padding: 40, 
      maxWidth: 1000, 
      margin: '0 auto',
      fontFamily: 'sans-serif'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
        paddingBottom: 20,
        borderBottom: '1px solid #E5E7EB'
      }}>
        <h1 style={{ 
          color: '#1F2937', 
          fontSize: 42, 
          margin: 0,
          fontWeight: 700
        }}>
          🏗️ LPS Inspection
        </h1>
        <div style={{ 
          padding: '12px 24px', 
          background: '#10B981', 
          color: 'white', 
          borderRadius: 25,
          fontWeight: 600,
          fontSize: 18
        }}>
          {projects.length} Projects
        </div>
      </header>

      {/* ADD PROJECT FORM */}
      <form action={createProject} style={{
        background: 'white',
        padding: 30,
        borderRadius: 12,
        boxShadow: '0

