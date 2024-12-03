-- Create the material_processing table
create table if not exists material_processing (
    id uuid default uuid_generate_v4() primary key,
    material_id uuid references materials(id) on delete cascade,
    stage text not null,
    status text not null,
    progress float not null default 0,
    message text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create an index for faster lookups
create index if not exists idx_material_processing_material_id on material_processing(material_id);

-- Add RLS policies
alter table material_processing enable row level security;

create policy "Users can view their own material processing status"
    on material_processing for select
    using (
        material_id in (
            select id from materials
            where user_id = auth.uid()
        )
    );

create policy "Service role can manage all processing statuses"
    on material_processing for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- Create a function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create a trigger to automatically update the updated_at column
create trigger update_material_processing_updated_at
    before update on material_processing
    for each row
    execute function update_updated_at_column();
