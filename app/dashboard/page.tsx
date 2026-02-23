'use client';
import { useState, useEffect } from 'react';
// ... other imports

// REMOVE any "export default function Dashboard()" at top
// KEEP only component definition

export default function Dashboard() {  // ✅ ADD this at BOTTOM
  // ... all your dashboard code
}
// In project form - ADD this field:
<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('project-photos')
      .upload(`${projectId}.jpg`, file);
    
    if (data) {
      await supabase
        .from('projects')
        .update({ photo_url: `${data.path}` })
        .eq('id', projectId);
    }
  }}
  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
/>
