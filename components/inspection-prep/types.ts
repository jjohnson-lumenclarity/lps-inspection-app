export type ProjectArea = {
  id: string;
  name: string;
  x_percent: number;
  y_percent: number;
};

export type AreaPhoto = {
  id: string;
  area_id: string;
  photo_url: string;
};

export type ZoneState = {
  notes: string;
  status: 'Not Started' | 'In Progress' | 'Complete';
  voiceNoteUrl?: string;
};
