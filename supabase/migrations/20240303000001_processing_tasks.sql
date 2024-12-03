-- Create enum for task types
create type task_type as enum (
  'text_extraction',
  'content_analysis',
  'embedding_generation'
);

-- Create enum for task status
create type task_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Create processing_tasks table
create table if not exists processing_tasks (
  id uuid default uuid_generate_v4() primary key,
  material_id uuid references materials(id) on delete cascade,
  task_type task_type not null,
  status task_status not null default 'pending',
  progress float not null default 0,
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_processing_tasks_material_id on processing_tasks(material_id);
create index if not exists idx_processing_tasks_status on processing_tasks(status);
create index if not exists idx_processing_tasks_type on processing_tasks(task_type);

-- Add RLS policies
alter table processing_tasks enable row level security;

create policy "Users can view their own processing tasks"
  on processing_tasks for select
  using (
    material_id in (
      select id from materials
      where user_id = auth.uid()
    )
  );

create policy "Service role can manage all processing tasks"
  on processing_tasks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create trigger for updating updated_at
create trigger update_processing_tasks_updated_at
  before update on processing_tasks
  for each row
  execute function update_updated_at_column();
