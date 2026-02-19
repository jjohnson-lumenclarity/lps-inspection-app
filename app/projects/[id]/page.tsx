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
      notes: inspection.notes
