export default function Home() {
  return (
    <main style={{ 
      padding: 50, 
      fontFamily: 'sans-serif', 
      maxWidth: 800, 
      margin: '0 auto'
    }}>
      <h1 style={{ 
        color: '#3B82F6', 
        fontSize: 48, 
        marginBottom: 20 
      }}>
        LPS Inspection App
      </h1>
      <p style={{ fontSize: 20, color: '#666' }}>
        ✅ Next.js 16 + Tailwind + Vercel LIVE!
      </p>
      <div style={{
        marginTop: 30, 
        padding: 25, 
        border: '2px solid #3B82F6',
        borderRadius: 12,
        background: '#F0F9FF'
      }}>
        <h2 style={{ color: '#1E40AF', marginBottom: 15 }}>
          Next Steps:
        </h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>✅ Basic deploy works!</li>
          <li>🗄️ Add Prisma DB</li>
          <li>🗺️ Google Maps API</li>
          <li>📱 Inspection forms</li>
        </ul>
      </div>
    </main>
  )
}


