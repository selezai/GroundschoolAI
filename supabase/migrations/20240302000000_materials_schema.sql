-- Enable the pgvector extension for embeddings
create extension if not exists vector;

-- Create enum for material types
create type material_type as enum ('pdf', 'image', 'text');

-- Create enum for material status
create type material_status as enum ('processing', 'ready', 'error');

-- Create materials table
create table if not exists materials (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    type material_type not null,
    storage_path text not null,
    content text,  -- Original extracted text content
    processed_content text,  -- AI-processed and structured content
    topics jsonb,  -- Array of identified topics
    status material_status default 'processing',
    error_message text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    last_processed_at timestamp with time zone
);

-- Create embeddings table
create table if not exists material_embeddings (
    id uuid default gen_random_uuid() primary key,
    material_id uuid references materials(id) on delete cascade not null,
    chunk_index integer not null,
    chunk_text text not null,
    embedding vector(1536) not null,  -- Using 1536 dimensions for Claude embeddings
    created_at timestamp with time zone default now()
);

-- Create topics table for organizing and grouping content
create table if not exists material_topics (
    id uuid default gen_random_uuid() primary key,
    material_id uuid references materials(id) on delete cascade not null,
    topic text not null,
    subtopics jsonb,  -- Array of subtopics
    importance_score float4,  -- Score to indicate topic importance (0-1)
    created_at timestamp with time zone default now()
);

-- Create table for tracking material processing progress
create table if not exists material_processing_status (
    id uuid default gen_random_uuid() primary key,
    material_id uuid references materials(id) on delete cascade not null,
    stage text not null,  -- e.g., 'text_extraction', 'content_processing', 'embedding_generation'
    status material_status not null,
    progress float4,  -- Progress percentage (0-1)
    message text,
    started_at timestamp with time zone default now(),
    completed_at timestamp with time zone
);

-- Create indexes for better query performance
create index if not exists materials_user_id_idx on materials(user_id);
create index if not exists materials_status_idx on materials(status);
create index if not exists material_embeddings_material_id_idx on material_embeddings(material_id);
create index if not exists material_topics_material_id_idx on material_topics(material_id);
create index if not exists material_processing_material_id_idx on material_processing_status(material_id);

-- Create embeddings vector similarity search index
create index if not exists material_embeddings_vector_idx on material_embeddings 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Add RLS (Row Level Security) policies
alter table materials enable row level security;
alter table material_embeddings enable row level security;
alter table material_topics enable row level security;
alter table material_processing_status enable row level security;

-- Create policies for materials table
create policy "Users can view their own materials"
    on materials for select
    using (auth.uid() = user_id);

create policy "Users can insert their own materials"
    on materials for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own materials"
    on materials for update
    using (auth.uid() = user_id);

create policy "Users can delete their own materials"
    on materials for delete
    using (auth.uid() = user_id);

-- Create policies for material_embeddings table
create policy "Users can view embeddings of their materials"
    on material_embeddings for select
    using (exists (
        select 1 from materials
        where materials.id = material_embeddings.material_id
        and materials.user_id = auth.uid()
    ));

-- Create policies for material_topics table
create policy "Users can view topics of their materials"
    on material_topics for select
    using (exists (
        select 1 from materials
        where materials.id = material_topics.material_id
        and materials.user_id = auth.uid()
    ));

-- Create policies for material_processing_status table
create policy "Users can view processing status of their materials"
    on material_processing_status for select
    using (exists (
        select 1 from materials
        where materials.id = material_processing_status.material_id
        and materials.user_id = auth.uid()
    ));

-- Create functions for similarity search
create or replace function search_material_embeddings(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    material_id uuid,
    chunk_text text,
    similarity float
)
language sql stable
as $$
    select
        material_id,
        chunk_text,
        1 - (embedding <=> query_embedding) as similarity
    from material_embeddings
    where 1 - (embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
$$;

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for materials table
create trigger update_materials_updated_at
    before update on materials
    for each row
    execute function update_updated_at_column();

-- Add helpful comments to tables
comment on table materials is 'Stores uploaded study materials and their processed content';
comment on table material_embeddings is 'Stores vector embeddings for material content chunks';
comment on table material_topics is 'Organizes material content into topics and subtopics';
comment on table material_processing_status is 'Tracks the processing status of uploaded materials';
