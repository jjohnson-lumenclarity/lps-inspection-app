'use client';

import { useState, useEffect } from 'react';
const supabase = createClient();

export default function InspectionsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [pins, setPins] = useState<{ x: number; y: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

const fetchProjects = async () => {
  const supabase = createClient();
  const { data } = await supabase
    .from('projects')
    .select(`
      *,
      projectareas (
        name,
        xpercent,
        ypercent
      ),
      photourl
    `);
  setProjects(data || []);
  setLoading(false);
};

  const handleFileChange = (projectId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFiles((prev) => ({ ...prev, [projectId]: file }));
    }
  };

  const handleUploadPhoto = async (project: any) => {
    const file = selectedFiles[project.id];
    if (!file) return;
    setUploadingId(project.id);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('projectId', project.id);
      const response = await fetch('/api/upload-photo', { method: 'POST', body: formData });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploadingId(null);
    }
  };

  const handleEdit = (project: any) => {
    console.log('Edit project', project);
    alert('Edit functionality coming soon!');
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      setProjects((projects) => projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
  const zoneName = prompt('Lighting zone name? (e.g., Parking Pole 3, Entry Signage, Wall Pack 7)');
  if (!zoneName) return;
  const newPin = { x, y, name: zoneName };
  setPins((prev) => [...prev, newPin]);
  const supabase = createClient();
  const { error } = await supabase.from('projectareas').insert({
    projectid: selectedProject.id,
    name: zoneName,
    xpercent: x,
    ypercent: y,
  });
  if (error) {
    alert(`Save failed: ${error.message}`);
    setPins((prev) => prev.slice(0, -1));
  }
};

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <p style={{ fontSize: '18px', color: '#6B7280' }}>Loading inspections...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8 font-[Inter,system-ui,sans-serif]">
      <div className="max-w-7xl mx-auto font-[Inter,system-ui,sans-serif]">
        <h1
          className="text-5xl font-black mb-12 text-center bg-gradient-to-r from-gray-800 via-gray-600 to-slate-800 bg-clip-text text-transparent drop-shadow-2xl font-[Inter,system-ui,sans-serif]"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Guardian Lightning Inspection - Current Projects
        </h1>

        {/* Project Cards - Inline Styles Matching Dashboard */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {projects.length === 0 ? (
            <p
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                color: '#6B7280',
                fontSize: '18px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              No projects yet. Add your first project above!
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: '25px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onClick={() => {
                  setSelectedProject(project);
                  setPins(
                    project.projectareas?.map((a: any) => ({
                      x: a.xpercent,
                      y: a.ypercent,
                      name: a.name,
                    })) || []
                  );
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)')}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#1F2937',
                    fontSize: '20px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: '600',
                  }}
                >
                  {project.title}
                </h3>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    color: '#6B7280',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {project.description}
                </p>
                <p
                  style={{
                    margin: '0 0 12px 0',
                    color: '#374151',
                    fontSize: '14px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: '500',
                  }}
                >
                  {project.address}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      padding: '4px 12px',
                      background:
                        project.status === 'Active'
                          ? '#10B981'
                          : project.status === 'In Progress'
                          ? '#F59E0B'
                          : '#6B7280',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                {project.photourl && (
                  <div style={{ marginBottom: '12px' }}>
                    <img
                      src={project.photourl}
                      alt="Project"
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(project.id, e)}
                  />
                  <button
                    onClick={() => handleUploadPhoto(project)}
                    disabled={!selectedFiles[project.id] || uploadingId === project.id}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      background: !selectedFiles[project.id] || uploadingId === project.id ? '#9CA3AF' : '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: !selectedFiles[project.id] || uploadingId === project.id ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {uploadingId === project.id ? 'Uploading...' : 'Upload Photo'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Project View */}
        {selectedProject && (
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-3xl border border-white/50 p-8 max-w-6xl mx-auto font-[Inter,system-ui,sans-serif]">
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center mb-12">
              <div className="flex-1">
                <h2
                  className="text-4xl font-black mb-2 text-gray-900 font-[Inter,system-ui,sans-serif]"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {selectedProject.title} ({pins.length} zones)
                </h2>
                <p
                  className="text-xl text-gray-700 font-[Inter,system-ui,sans-serif]"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {selectedProject.address}
                </p>
              </div>
            </div>

            {/* Aerial Map */}
            <div className="relative mb-12 w-full h-[90vh] flex items-center justify-center font-[Inter,system-ui,sans-serif]">
              <div
                className="h-[90vh] w-full max-w-6xl mx-auto bg-cover bg-center bg-no-repeat rounded-3xl border-8 border-dashed border-blue-300/50 shadow-3xl relative overflow-visible cursor-crosshair hover:border-blue-400/80 transition-all duration-300 hover:shadow-4xl group/map z-0"
                style={{
                  backgroundImage: `url(${selectedProject?.photourl || 'https://via.placeholder.com/1200x800/4F46E5/FFFFFF?text=Aerial+Site+Photo'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '90vh',
                  minHeight: '600px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onClick={handleImageClick}
              >
                {/* Pins */}
                {pins.map((pin, index) => (
                  <div
                    key={index}
                    className="absolute w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 border-8 border-white/90 rounded-full shadow-2xl flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-all z-50"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {pin.name.slice(0, 3).toUpperCase()}
                  </div>
                ))}
                <div className="absolute inset-0 bg-black/0 group-hover/map:bg-black/20 transition-all flex items-center justify-center pointer-events-none rounded-3xl z-10">
                  <div className="text-white text-2xl font-bold drop-shadow-2xl opacity-0 group-hover/map:opacity-100 font-[Inter,system-ui,sans-serif]">
                    Click to add lighting zone pin
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center mt-6 text-lg font-semibold text-gray-700 font-[Inter,system-ui,sans-serif]">
              Click building areas (parking lot, signage, walls) to create lighting zone pins
            </p>

            {/* Active Pins List */}
            {pins.length > 0 && (
              <div>
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2 font-[Inter,system-ui,sans-serif]">
                  Active Lighting Zones ({pins.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pins.map((pin, i) => (
                    <div
                      key={i}
                      className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all hover:scale-102 font-[Inter,system-ui,sans-serif]"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4 mx-auto shadow-2xl font-[Inter,system-ui,sans-serif]">
                        {pin.name.slice(0, 3)}
                      </div>
                      <h4 className="font-black text-xl mb-2 text-gray-900 text-center font-[Inter,system-ui,sans-serif]">
                        {pin.name}
                      </h4>
                      <div className="flex justify-center gap-4 text-sm text-blue-700 font-mono bg-white/50 px-4 py-2 rounded-xl font-[Inter,system-ui,sans-serif]">
                        <span>X: {pin.x}%</span>
                        <span>Y: {pin.y}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedProject && projects.length === 0 && (
          <div className="text-center py-32 font-[Inter,system-ui,sans-serif]">
            <h2 className="text-3xl font-black mb-4 text-gray-600 font-[Inter,system-ui,sans-serif]">No inspections</h2>
            <p className="text-xl text-gray-500 mb-8 font-[Inter,system-ui,sans-serif]">Create first inspection in Supabase</p>
          </div>
        )}
      </div>
    </div>
  );
}
