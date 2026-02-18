import { prisma } from '@/lib/prisma'

export default async function Home() {
  const projectsCount = await prisma.project.count()
  
  return (
    <main style={{ 
      padding: 50, 
      fontFamily: 'sans-serif', 
      maxWidth: 800, 
      margin: '0 auto' 
    }}>
      <h1 style={{ color: '#3B82F6', fontSize: 48, marginBottom: 20 }}>
        🏗️ LPS Inspection Dashboard
      </h1>
      <div style={{
        padding: 25, 
        border: '2px solid #3B82F6', 
        borderRadius: 12, 
        background: '#F0F9FF',
        marginBottom: 30
      }}>
        <h2 style={{ color: '#1E40AF' }}>Database Ready!</h2>
        <p><strong>Projects in DB:</strong> {projectsCount}</p>
      </div>
    </main>
  )
}
