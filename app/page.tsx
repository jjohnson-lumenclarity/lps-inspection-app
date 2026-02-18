'use client'
import { useState } from 'react'

export default function Home() {
  const [projects, setProjects] = useState([])

  const addProject = async (formData: FormData) => {
    'use server'
    // POST /api/projects → Prisma create
  }

  return (
    <main style={{padding: 50}}>
      <h1>LPS Dashboard</h1>
      
      {/* Project Form */}
      <form>
        <input name="name" placeholder="Project Name" />
        <input name="address" placeholder="Address" />
        <button>Add Project</button>
      </form>
      
      {/* Projects List */}
      <ul>{projects.map(p => <li>{p.name}</li>)}</ul>
    </main>
  )
}
