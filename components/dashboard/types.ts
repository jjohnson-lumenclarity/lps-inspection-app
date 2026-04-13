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
  contactName: string;
  phone: string;
  email: string;
  inspectionDate: string;
  reportDate: string;
  dueDate: string;
  weather: string;
  temperature: string;
  contractorJobNumber: string;
  inspectors: string;
  certificationType: string;
  aerialImages: string[];
};
