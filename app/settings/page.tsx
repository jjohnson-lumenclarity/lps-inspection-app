'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [autoSaveMinutes, setAutoSaveMinutes] = useState('3');
  const [requirePhotoPerZone, setRequirePhotoPerZone] = useState(true);
  const [showLogoOnPdf, setShowLogoOnPdf] = useState(true);
  const [timezone, setTimezone] = useState('America/Detroit');

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Settings</h1>
          <p style={{ color: '#64748b', marginBottom: 0 }}>Recommended controls for inspection teams: data quality, PDF output, and workflow defaults.</p>
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Inspection Workflow</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <label style={{ fontWeight: 600, color: '#334155' }}>Auto-save interval (minutes)
              <select value={autoSaveMinutes} onChange={(e) => setAutoSaveMinutes(e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option value="1">1 minute</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Timezone
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option>America/Detroit</option>
                <option>America/Chicago</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#334155' }}>
              <input type="checkbox" checked={requirePhotoPerZone} onChange={(e) => setRequirePhotoPerZone(e.target.checked)} /> Require at least one photo per zone before submission
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#334155' }}>
              <input type="checkbox" checked={showLogoOnPdf} onChange={(e) => setShowLogoOnPdf(e.target.checked)} /> Include company logo in PDF summary
            </label>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Team & Permissions (MVP)</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
            <li>Inspector role: create/edit inspections, upload photos, complete checklist.</li>
            <li>Manager role: review quote summary, approve final submission.</li>
            <li>Admin role: manage company branding, status options, and report exports.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
