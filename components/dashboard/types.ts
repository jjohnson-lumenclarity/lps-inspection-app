export type Project = {
  id: string;
  title: string;
  description: string;
  address: string;
  status: string;
  created_at?: string;
  photo_url?: string | null;
};

export type ProjectMeta = {
  inspectors: string;
  inspectionDate: string;
};
