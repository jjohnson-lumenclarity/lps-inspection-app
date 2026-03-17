'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type TemplateSettings = {
  autoSaveMinutes: string;
  requirePhotoPerZone: boolean;
  showLogoOnPdf: boolean;
  timezone: string;
  defaultQuoteTemplate: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  logoDataUrl: string;
};

const defaultSettings: TemplateSettings = {
  autoSaveMinutes: '3',
  requirePhotoPerZone: true,
  showLogoOnPdf: true,
  timezone: 'America/Detroit',
  defaultQuoteTemplate: 'modern-blue',
  companyName: 'Inspection Company',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  logoDataUrl: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<TemplateSettings>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('quote-template-settings');
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) } as TemplateSettings);
    } catch {
      // no-op
    }
  }, []);

  const persist = (next: TemplateSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem('quote-template-settings', JSON.stringify(next));
      setSavedMessage('Settings saved.');
      window.setTimeout(() => setSavedMessage(''), 1500);
    } catch {
      setSavedMessage('Could not save settings on this device.');
    }
  };

  const update = <K extends keyof TemplateSettings>(key: K, value: TemplateSettings[K]) => {
    persist({ ...settings, [key]: value });
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update('logoDataUrl', typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  return (
    <main style={{ minHeight: '100vh', padding: '96px 16px 28px calc(var(--sidebar-width, 88px) + 16px)', background: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', display: 'grid', gap: '14px' }}>
        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Settings</h1>
          <p style={{ color: '#64748b', marginBottom: 0 }}>Inspection defaults, quote template controls, and company branding used in PDF-ready quote summaries.</p>
          {savedMessage && <p style={{ color: '#166534', margin: '8px 0 0' }}>{savedMessage}</p>}
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Inspection Workflow</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <label style={{ fontWeight: 600, color: '#334155' }}>Auto-save interval (minutes)
              <select value={settings.autoSaveMinutes} onChange={(e) => update('autoSaveMinutes', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option value="1">1 minute</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Timezone
              <select value={settings.timezone} onChange={(e) => update('timezone', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option>America/Detroit</option>
                <option>America/Chicago</option>
                <option>America/New_York</option>
                <option>America/Los_Angeles</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#334155' }}>
              <input type="checkbox" checked={settings.requirePhotoPerZone} onChange={(e) => update('requirePhotoPerZone', e.target.checked)} /> Require at least one photo per quadrant before submission
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#334155' }}>
              <input type="checkbox" checked={settings.showLogoOnPdf} onChange={(e) => update('showLogoOnPdf', e.target.checked)} /> Include company logo in quote summary PDF
            </label>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Quote Template & Branding</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <label style={{ fontWeight: 600, color: '#334155' }}>Default quote template
              <select value={settings.defaultQuoteTemplate} onChange={(e) => update('defaultQuoteTemplate', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }}>
                <option value="modern-blue">Modern Blue</option>
                <option value="executive-gray">Executive Gray</option>
                <option value="industrial-dark">Industrial Dark</option>
                <option value="minimal-clean">Minimal Clean</option>
                <option value="classic-proposal">Classic Proposal</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Company logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px', background: '#f8fafc' }} />
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Company name
              <input value={settings.companyName} onChange={(e) => update('companyName', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }} />
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Company email
              <input value={settings.companyEmail} onChange={(e) => update('companyEmail', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }} />
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Company phone
              <input value={settings.companyPhone} onChange={(e) => update('companyPhone', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }} />
            </label>
            <label style={{ fontWeight: 600, color: '#334155' }}>Company address
              <input value={settings.companyAddress} onChange={(e) => update('companyAddress', e.target.value)} style={{ width: '100%', marginTop: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px' }} />
            </label>
          </div>
          {settings.logoDataUrl && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: '#475569' }}>Current logo preview</p>
              <img src={settings.logoDataUrl} alt="Company logo preview" style={{ maxHeight: 72, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 6 }} />
            </div>
          )}
        </section>

        <section style={{ background: '#fff', border: '1px solid #dbe3ea', borderRadius: '14px', padding: '20px' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Integration plan for final quote templates</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#475569', lineHeight: 1.6 }}>
            <li>All inspection/project/checklist data remains in Supabase tables (`projects`, `project_areas`, `area_photos`, `inspection_checklists`).</li>
            <li>Use this page to control branding + default template style now (stored locally for MVP).</li>
            <li>Next phase: persist template settings in a Supabase table (e.g., `company_settings`) and generate final branded PDF using a dedicated template engine service.</li>
            <li>Recommended final architecture: app stores data in Supabase; a server-side render job (React PDF / Puppeteer) generates polished, client-facing quote documents.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
