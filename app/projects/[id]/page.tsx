'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

type Inspection = {
  id: string;
  roof: string;
  siding: string;
  windows: string;
  notes?: string;
  createdAt: string;
  photos?: { id: string; url: string; filename: string }[];
};

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [formData, setFormData] = useState({
    roof: '', siding: '', windows: '', notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInspections();
  }, [projectId]);

  const fetchInspections = async () => {
    const res = await fetch(`/api/projects/${projectId}/inspections`);
    const data = await res.json();
    setInspections(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const url = editingId 
      ? `/api/projects/${projectId}/inspections/${editingId}` 
      : `/api/projects/${projectId}/inspection`;
    
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setFormData({ roof: '', siding: '', windows: '', notes: '' });
        setEditingId(null);
        fetchInspections();
      }, 2000);
    }
    setLoading(false);
  };

  const handleEdit = (inspection: Inspection) => {
    setFormData({
      roof: inspection.roof,
      siding: inspection.siding,
      windows: inspection.windows,
      notes: inspection.notes || ''
    });
    setEditingId(inspection.id);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${projectId}/inspections/${id}`, { method: 'DELETE' });
    fetchInspections();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Project {projectId}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-2xl mb-4">{editingId ? 'Edit' : 'New'} Inspection</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label>Roof Condition:</label>
            <select name="roof" value={formData.roof} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="">Select...</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div>
            <label>Siding Condition:</label>
            <select name="siding" value={formData.siding} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="">Select...</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div>
            <label>Windows Condition:</label>
            <select name="windows" value={formData.windows} onChange={handleChange} className="w-full p-2 border rounded">
              <option value="">Select...</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label>Notes:</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange}
            className="w-full p-2 border rounded h-24"
            placeholder="Additional observations..."
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : editingId ? 'Update' : 'Create Inspection'}
        </button>
        {saved && <p className="text-green-600 mt-2">Saved!</p>}
      </form>

      <div>
        <h2 className="text-2xl mb-4">Inspections ({inspections.length})</h2>
        {inspections.map((inspection) => (
          <div key={inspection.id} className="bg-gray-50 p-4 rounded mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{new Date(inspection.createdAt).toLocaleDateString()}</h3>
              <div>
                <button 
                  onClick={() => handleEdit(inspection)}
                  className="text-blue-500 mr-2 hover:underline"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(inspection.id)}
                  className="text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div><strong>Roof:</strong> {inspection.roof}</div>
              <div><strong>Siding:</strong> {inspection.siding}</div>
              <div><strong>Windows:</strong> {inspection.windows}</div>
            </div>
            {inspection.notes && <p><strong>Notes:</strong> {inspection.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
