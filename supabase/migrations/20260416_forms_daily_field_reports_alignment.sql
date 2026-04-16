-- Align Daily Field Labor forms schema with current app expectations

create extension if not exists pgcrypto;

create table if not exists public.forms_daily_field_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null,
  project_id uuid null references public.projects(id) on delete set null,
  report_date date not null default current_date,
  job_number text null,
  project_name_snapshot text null,
  customer_gc_snapshot text null,
  lead_foreman_name text null,
  scope_of_work text null,
  daily_notes text null,
  status text not null default 'draft',
  pm_review_required boolean not null default true,
  pm_reviewed_at timestamptz null,
  pm_reviewed_by uuid null,
  client_not_available boolean not null default false,
  guardian_signature_data text null,
  guardian_signed_at timestamptz null,
  customer_signature_data text null,
  customer_signed_at timestamptz null,
  submitted_at timestamptz null,
  submitted_by uuid null,
  sent_to_accounting_at timestamptz null,
  accounting_recipient_email text null,
  client_recipient_email text null,
  pm_recipient_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'forms_daily_field_reports' and column_name = 'guardian_signature_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'forms_daily_field_reports' and column_name = 'guardian_signature_data'
  ) then
    alter table public.forms_daily_field_reports rename column guardian_signature_url to guardian_signature_data;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'forms_daily_field_reports' and column_name = 'customer_signature_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'forms_daily_field_reports' and column_name = 'customer_signature_data'
  ) then
    alter table public.forms_daily_field_reports rename column customer_signature_url to customer_signature_data;
  end if;
end $$;

alter table public.forms_daily_field_reports
  add column if not exists organization_id uuid,
  add column if not exists project_id uuid,
  add column if not exists report_date date default current_date,
  add column if not exists job_number text,
  add column if not exists project_name_snapshot text,
  add column if not exists customer_gc_snapshot text,
  add column if not exists lead_foreman_name text,
  add column if not exists scope_of_work text,
  add column if not exists daily_notes text,
  add column if not exists status text default 'draft',
  add column if not exists pm_review_required boolean default true,
  add column if not exists pm_reviewed_at timestamptz,
  add column if not exists pm_reviewed_by uuid,
  add column if not exists client_not_available boolean default false,
  add column if not exists guardian_signature_data text,
  add column if not exists guardian_signed_at timestamptz,
  add column if not exists customer_signature_data text,
  add column if not exists customer_signed_at timestamptz,
  add column if not exists submitted_at timestamptz,
  add column if not exists submitted_by uuid,
  add column if not exists sent_to_accounting_at timestamptz,
  add column if not exists accounting_recipient_email text,
  add column if not exists client_recipient_email text,
  add column if not exists pm_recipient_email text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.forms_daily_field_reports
set report_date = current_date
where report_date is null;

alter table public.forms_daily_field_reports
  alter column report_date set default current_date,
  alter column report_date set not null,
  alter column status set default 'draft',
  alter column pm_review_required set default true,
  alter column client_not_available set default false,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'forms_daily_field_reports_status_check'
      and conrelid = 'public.forms_daily_field_reports'::regclass
  ) then
    alter table public.forms_daily_field_reports
      add constraint forms_daily_field_reports_status_check
      check (status in ('draft','submitted','pm_reviewed','client_signed','sent_to_accounting'));
  end if;
end $$;

create table if not exists public.forms_daily_field_report_labor (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.forms_daily_field_reports(id) on delete cascade,
  worker_name text null,
  role_class text null,
  st_hours integer not null default 0,
  ot_hours integer not null default 0,
  notes text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.forms_daily_field_report_labor
  add column if not exists st_hours integer default 0,
  add column if not exists ot_hours integer default 0,
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default now();

alter table public.forms_daily_field_report_labor
  alter column st_hours type integer using round(coalesce(st_hours, 0))::integer,
  alter column ot_hours type integer using round(coalesce(ot_hours, 0))::integer,
  alter column st_hours set default 0,
  alter column ot_hours set default 0,
  alter column st_hours set not null,
  alter column ot_hours set not null,
  alter column sort_order set default 0,
  alter column sort_order set not null,
  alter column created_at set default now();

create table if not exists public.forms_daily_field_report_materials (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.forms_daily_field_reports(id) on delete cascade,
  qty integer not null default 0,
  unit text null,
  description text null,
  notes text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.forms_daily_field_report_materials
  add column if not exists qty integer default 0,
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default now();

alter table public.forms_daily_field_report_materials
  alter column qty type integer using round(coalesce(qty, 0))::integer,
  alter column qty set default 0,
  alter column qty set not null,
  alter column sort_order set default 0,
  alter column sort_order set not null,
  alter column created_at set default now();

create table if not exists public.forms_daily_field_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.forms_daily_field_reports(id) on delete cascade,
  storage_path text not null,
  caption text null,
  uploaded_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists forms_daily_field_reports_status_idx on public.forms_daily_field_reports(status);
create index if not exists forms_daily_field_reports_project_id_idx on public.forms_daily_field_reports(project_id);
create index if not exists forms_daily_field_report_labor_report_id_idx on public.forms_daily_field_report_labor(report_id);
create index if not exists forms_daily_field_report_materials_report_id_idx on public.forms_daily_field_report_materials(report_id);
create index if not exists forms_daily_field_report_photos_report_id_idx on public.forms_daily_field_report_photos(report_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists forms_daily_field_reports_set_updated_at on public.forms_daily_field_reports;
create trigger forms_daily_field_reports_set_updated_at
before update on public.forms_daily_field_reports
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;
