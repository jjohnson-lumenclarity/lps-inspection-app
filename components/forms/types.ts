export type ReportStatus = 'draft' | 'submitted' | 'pm_reviewed' | 'client_signed' | 'sent_to_accounting';

export type LaborRow = {
  id?: string;
  worker_name: string;
  role_class: string;
  st_hours: number;
  ot_hours: number;
  notes: string;
  sort_order: number;
};

export type MaterialRow = {
  id?: string;
  qty: number;
  unit: string;
  description: string;
  notes: string;
  sort_order: number;
};

export type PhotoRow = {
  id?: string;
  storage_path: string;
  caption: string;
  created_at?: string;
};

export type DailyFieldReportForm = {
  id?: string;
  project_id: string;
  report_date: string;
  job_number: string;
  project_name_snapshot: string;
  customer_gc_snapshot: string;
  lead_foreman_name: string;
  scope_of_work: string;
  daily_notes: string;
  status: ReportStatus;
  pm_review_required: boolean;
  client_not_available: boolean;
  guardian_signature_url: string;
  guardian_signed_at: string;
  customer_signature_url: string;
  customer_signed_at: string;
  pm_recipient_email: string;
  client_recipient_email: string;
  accounting_recipient_email: string;
};
