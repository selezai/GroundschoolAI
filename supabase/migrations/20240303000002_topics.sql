-- Create topics table
create table if not exists topics (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  parent_id uuid references topics(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table topics enable row level security;

create policy "Users can view all topics"
  on topics for select
  using (true);

create policy "Service role can manage all topics"
  on topics for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Create trigger for updating updated_at
create trigger update_topics_updated_at
  before update on topics
  for each row
  execute function update_updated_at_column();
