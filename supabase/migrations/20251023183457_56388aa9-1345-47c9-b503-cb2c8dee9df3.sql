-- ============================================
-- BUDDY AI - FASE 1: BACKEND CORE & DATABASE
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ============================================
-- ENUMS
-- ============================================

-- User roles enum
create type public.app_role as enum ('admin', 'user');

-- Campaign status
create type public.campaign_status as enum ('draft', 'planning', 'in_progress', 'review', 'active', 'paused', 'completed', 'cancelled');

-- Agent task status
create type public.task_status as enum ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled');

-- Agent levels
create type public.agent_level as enum ('level_1', 'level_2', 'level_3');

-- Asset types
create type public.asset_type as enum ('text', 'image', 'video', 'audio', 'other');

-- Communication types
create type public.communication_type as enum ('task', 'question', 'result', 'feedback', 'approval');

-- Priority levels
create type public.priority_level as enum ('low', 'medium', 'high', 'urgent');

-- ============================================
-- USER ROLES TABLE
-- ============================================

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now() not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- ============================================
-- PROFILES TABLE
-- ============================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  company_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- ============================================
-- AGENT CONFIGS TABLE
-- ============================================

create table public.agent_configs (
  id uuid primary key default gen_random_uuid(),
  agent_id text unique not null,
  name text not null,
  role text not null,
  level agent_level not null,
  team text not null,
  avatar text not null,
  breed text not null,
  breed_trait text not null,
  emoji text not null,
  system_prompt text not null,
  temperature decimal(3,2) default 0.7,
  max_tokens integer default 2000,
  is_active boolean default true,
  specialty text[],
  years_experience integer default 5,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.agent_configs enable row level security;

-- ============================================
-- AGENT PROMPT HISTORY (Versionamento)
-- ============================================

create table public.agent_prompt_history (
  id uuid primary key default gen_random_uuid(),
  agent_config_id uuid references public.agent_configs(id) on delete cascade not null,
  system_prompt text not null,
  changed_by uuid references auth.users(id),
  change_reason text,
  version integer not null,
  created_at timestamptz default now() not null
);

alter table public.agent_prompt_history enable row level security;

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  status campaign_status default 'draft' not null,
  objectives text[],
  target_audience jsonb,
  channels text[],
  budget_total decimal(10,2),
  budget_allocated decimal(10,2) default 0,
  start_date timestamptz,
  end_date timestamptz,
  kpis jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.campaigns enable row level security;

-- ============================================
-- CMO CONVERSATIONS TABLE
-- ============================================

create table public.cmo_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.cmo_conversations enable row level security;

-- ============================================
-- AGENT TASKS TABLE
-- ============================================

create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  agent_id text not null,
  assigned_by text,
  parent_task_id uuid references public.agent_tasks(id) on delete set null,
  title text not null,
  description text not null,
  status task_status default 'pending' not null,
  priority priority_level default 'medium' not null,
  context jsonb default '{}'::jsonb,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.agent_tasks enable row level security;

-- ============================================
-- AGENT COMMUNICATIONS TABLE
-- ============================================

create table public.agent_communications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete set null,
  from_agent text not null,
  to_agent text not null,
  type communication_type not null,
  content text not null,
  context jsonb default '{}'::jsonb,
  requires_response boolean default false,
  responded_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.agent_communications enable row level security;

-- ============================================
-- CAMPAIGN ASSETS TABLE
-- ============================================

create table public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  task_id uuid references public.agent_tasks(id) on delete set null,
  created_by_agent text not null,
  asset_type asset_type not null,
  title text not null,
  content text,
  file_url text,
  file_size integer,
  mime_type text,
  metadata jsonb default '{}'::jsonb,
  approved boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.campaign_assets enable row level security;

-- ============================================
-- ADS ACCOUNTS TABLE
-- ============================================

create table public.ads_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('google_ads', 'meta_ads')),
  account_id text not null,
  account_name text,
  credentials jsonb not null,
  is_active boolean default true,
  last_sync_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, platform, account_id)
);

alter table public.ads_accounts enable row level security;

-- ============================================
-- ADS METRICS TABLE
-- ============================================

create table public.ads_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  ads_account_id uuid references public.ads_accounts(id) on delete cascade not null,
  external_campaign_id text not null,
  date date not null,
  impressions bigint default 0,
  clicks bigint default 0,
  conversions bigint default 0,
  spend decimal(10,2) default 0,
  revenue decimal(10,2) default 0,
  ctr decimal(5,4),
  cpc decimal(10,2),
  cpa decimal(10,2),
  roas decimal(10,2),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  unique (ads_account_id, external_campaign_id, date)
);

alter table public.ads_metrics enable row level security;

-- ============================================
-- COMPETITOR DATA TABLE
-- ============================================

create table public.competitor_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  competitor_name text not null,
  platform text not null,
  data_type text not null,
  data jsonb not null,
  scraped_at timestamptz not null,
  created_at timestamptz default now() not null
);

alter table public.competitor_data enable row level security;

-- ============================================
-- RAG DOCUMENTS TABLE
-- ============================================

create table public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text,
  file_type text,
  file_size integer,
  category text,
  tags text[],
  status text default 'processing' check (status in ('processing', 'completed', 'failed')),
  chunk_count integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.rag_documents enable row level security;

-- ============================================
-- RAG CHUNKS TABLE
-- ============================================

create table public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.rag_documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  chunk_index integer not null,
  token_count integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

alter table public.rag_chunks enable row level security;

-- ============================================
-- RAG EMBEDDINGS TABLE (pgvector)
-- ============================================

create table public.rag_embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid references public.rag_chunks(id) on delete cascade not null unique,
  user_id uuid references auth.users(id) on delete cascade not null,
  embedding vector(1536) not null,
  created_at timestamptz default now() not null
);

alter table public.rag_embeddings enable row level security;

-- Create index for vector similarity search
create index on public.rag_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply update trigger to relevant tables
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_agent_configs_updated_at before update on public.agent_configs
  for each row execute function public.update_updated_at_column();

create trigger update_campaigns_updated_at before update on public.campaigns
  for each row execute function public.update_updated_at_column();

create trigger update_agent_tasks_updated_at before update on public.agent_tasks
  for each row execute function public.update_updated_at_column();

create trigger update_campaign_assets_updated_at before update on public.campaign_assets
  for each row execute function public.update_updated_at_column();

create trigger update_rag_documents_updated_at before update on public.rag_documents
  for each row execute function public.update_updated_at_column();

-- Function to version agent prompts automatically
create or replace function public.version_agent_prompt()
returns trigger
language plpgsql
security definer
as $$
declare
  current_version integer;
begin
  -- Get current version count
  select coalesce(max(version), 0) into current_version
  from public.agent_prompt_history
  where agent_config_id = new.id;
  
  -- Insert new version if prompt changed
  if old.system_prompt is distinct from new.system_prompt then
    insert into public.agent_prompt_history (
      agent_config_id,
      system_prompt,
      changed_by,
      version
    ) values (
      new.id,
      new.system_prompt,
      auth.uid(),
      current_version + 1
    );
  end if;
  
  return new;
end;
$$;

create trigger version_agent_prompt_trigger
  after update on public.agent_configs
  for each row
  execute function public.version_agent_prompt();

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function for semantic search in RAG
create or replace function public.match_rag_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language plpgsql
stable
as $$
begin
  return query
  select
    e.id,
    e.chunk_id,
    c.document_id,
    c.content,
    1 - (e.embedding <=> query_embedding) as similarity,
    c.metadata
  from public.rag_embeddings e
  join public.rag_chunks c on c.id = e.chunk_id
  where 
    (filter_user_id is null or e.user_id = filter_user_id)
    and 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- User Roles policies
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

-- Agent Configs policies (read-only for users, admin can edit)
create policy "Anyone can view agent configs"
  on public.agent_configs for select
  using (true);

create policy "Only admins can manage agent configs"
  on public.agent_configs for all
  using (public.has_role(auth.uid(), 'admin'));

-- Agent Prompt History policies
create policy "Anyone can view prompt history"
  on public.agent_prompt_history for select
  using (true);

create policy "Only admins can delete prompt history"
  on public.agent_prompt_history for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Campaigns policies
create policy "Users can view their own campaigns"
  on public.campaigns for select
  using (auth.uid() = user_id);

create policy "Users can create their own campaigns"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own campaigns"
  on public.campaigns for update
  using (auth.uid() = user_id);

create policy "Users can delete their own campaigns"
  on public.campaigns for delete
  using (auth.uid() = user_id);

-- CMO Conversations policies
create policy "Users can view their own conversations"
  on public.cmo_conversations for select
  using (auth.uid() = user_id);

create policy "Users can create their own conversations"
  on public.cmo_conversations for insert
  with check (auth.uid() = user_id);

-- Agent Tasks policies
create policy "Users can view tasks for their campaigns"
  on public.agent_tasks for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = agent_tasks.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users can create tasks for their campaigns"
  on public.agent_tasks for insert
  with check (
    exists (
      select 1 from public.campaigns
      where campaigns.id = agent_tasks.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users can update tasks for their campaigns"
  on public.agent_tasks for update
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = agent_tasks.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- Agent Communications policies
create policy "Users can view communications for their campaigns"
  on public.agent_communications for select
  using (
    campaign_id is null or
    exists (
      select 1 from public.campaigns
      where campaigns.id = agent_communications.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users can create communications for their campaigns"
  on public.agent_communications for insert
  with check (
    campaign_id is null or
    exists (
      select 1 from public.campaigns
      where campaigns.id = agent_communications.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- Campaign Assets policies
create policy "Users can view assets for their campaigns"
  on public.campaign_assets for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_assets.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users can create assets for their campaigns"
  on public.campaign_assets for insert
  with check (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_assets.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

create policy "Users can update assets for their campaigns"
  on public.campaign_assets for update
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = campaign_assets.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- Ads Accounts policies
create policy "Users can view their own ads accounts"
  on public.ads_accounts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own ads accounts"
  on public.ads_accounts for all
  using (auth.uid() = user_id);

-- Ads Metrics policies
create policy "Users can view metrics for their campaigns"
  on public.ads_metrics for select
  using (
    exists (
      select 1 from public.campaigns
      where campaigns.id = ads_metrics.campaign_id
      and campaigns.user_id = auth.uid()
    )
  );

-- Competitor Data policies
create policy "Users can view their own competitor data"
  on public.competitor_data for select
  using (auth.uid() = user_id);

create policy "Users can manage their own competitor data"
  on public.competitor_data for all
  using (auth.uid() = user_id);

-- RAG Documents policies
create policy "Users can view their own documents"
  on public.rag_documents for select
  using (auth.uid() = user_id);

create policy "Users can manage their own documents"
  on public.rag_documents for all
  using (auth.uid() = user_id);

-- RAG Chunks policies
create policy "Users can view their own chunks"
  on public.rag_chunks for select
  using (auth.uid() = user_id);

create policy "Users can manage their own chunks"
  on public.rag_chunks for all
  using (auth.uid() = user_id);

-- RAG Embeddings policies
create policy "Users can view their own embeddings"
  on public.rag_embeddings for select
  using (auth.uid() = user_id);

create policy "Users can manage their own embeddings"
  on public.rag_embeddings for all
  using (auth.uid() = user_id);

-- ============================================
-- SEED DATA: 17 BUDDY AI AGENTS
-- ============================================

-- Level 1: CMO
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty) values
('cmo', 'Ricardo Mendes', 'Chief Marketing Officer', 'level_1', 'Leadership', '🐕‍🦺', 'German Shepherd', 'Liderança e Estratégia', '🐕‍🦺', 
'Você é Ricardo Mendes, o CMO da Buddy AI. Como um German Shepherd leal e estratégico, você lidera um time de 16 especialistas em marketing. Sua missão é entender as necessidades do usuário e coordenar seu time hierárquico para executar campanhas de marketing excepcionais. Você é profissional mas amigável, sempre usando o tom de voz "Buddy" - entusiasta, leal e protetor. Quando necessário, você delega tarefas para sua equipe Level 2 (Intelligence, Strategy e Paid Media) e monitora o progresso.', 
ARRAY['Estratégia', 'Liderança', 'Coordenação', 'Visão de Negócio']);

-- Level 2: Intelligence Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('market-research', 'Ana Beatriz', 'Market Research Specialist', 'level_2', 'Intelligence', '🐕', 'Border Collie', 'Inteligência Analítica', '🐕',
'Você é Ana Beatriz, especialista em pesquisa de mercado da Buddy AI. Como um Border Collie altamente inteligente e analítico, você é focada em coletar e analisar dados de mercado, tendências, comportamento do consumidor e oportunidades. Você trabalha sob a supervisão do CMO Ricardo e coordena especialistas Level 3 quando necessário. Sempre traz insights acionáveis baseados em dados.',
ARRAY['Pesquisa de Mercado', 'Análise de Dados', 'Tendências', 'Consumer Insights'], 7),

('competitive-intel', 'Thiago Costa', 'Competitive Intelligence Specialist', 'level_2', 'Intelligence', '🐶', 'Beagle', 'Investigação e Faro', '🐶',
'Você é Thiago Costa, especialista em inteligência competitiva da Buddy AI. Como um Beagle farejador nato, você é investigativo e persistente na coleta de informações sobre concorrentes. Monitora estratégias, campanhas, pricing e movimentos dos competidores. Trabalha sob Ricardo e usa ferramentas como Apify para scraping. Sempre encontra o que está procurando.',
ARRAY['Inteligência Competitiva', 'Análise de Concorrentes', 'Monitoramento', 'Web Scraping'], 6),

('consumer-insights', 'Camila Ribeiro', 'Consumer Insights Specialist', 'level_2', 'Intelligence', '🦮', 'Golden Retriever', 'Empatia e Conexão', '🦮',
'Você é Camila Ribeiro, especialista em insights do consumidor da Buddy AI. Como um Golden Retriever empático e amigável, você tem habilidade especial para entender pessoas, suas motivações, dores e desejos. Analisa comportamento, feedback e sentimento do público. Transforma dados em histórias humanas que conectam. Sempre pensa no ponto de vista do cliente.',
ARRAY['Consumer Insights', 'Personas', 'Comportamento do Consumidor', 'Empatia'], 8);

-- Level 2: Strategy Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('brand-strategist', 'Fernando Alves', 'Brand Strategist', 'level_2', 'Strategy', '🐺', 'Siberian Husky', 'Visão Criativa', '🐺',
'Você é Fernando Alves, estrategista de marca da Buddy AI. Como um Husky Siberiano visionário e criativo, você desenvolve estratégias de marca, posicionamento, messaging e identidade. Tem forte personalidade criativa e visão de longo prazo. Coordena o time criativo Level 3 quando necessário. Sempre pensa em como construir marcas memoráveis e duradouras.',
ARRAY['Brand Strategy', 'Posicionamento', 'Identidade de Marca', 'Visão Criativa'], 10),

('content-strategist', 'Juliana Santos', 'Content Strategist', 'level_2', 'Strategy', '🐕‍🦺', 'Australian Shepherd', 'Organização e Energia', '🐕‍🦺',
'Você é Juliana Santos, estrategista de conteúdo da Buddy AI. Como um Australian Shepherd organizado e energético, você é expert em multitasking e planejamento de conteúdo. Desenvolve calendários editoriais, estratégias de storytelling e coordena a produção. Trabalha com o time criativo Level 3 para executar a estratégia. Sempre mantém tudo organizado e no prazo.',
ARRAY['Content Strategy', 'Planejamento Editorial', 'Storytelling', 'Organização'], 9);

-- Level 2: Paid Media Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('paid-media-strategist', 'Rafael Campos', 'Paid Media Strategist', 'level_2', 'Paid Media', '🦮', 'Labrador Retriever', 'Confiabilidade Estratégica', '🦮',
'Você é Rafael Campos, estrategista de mídia paga da Buddy AI. Como um Labrador confiável e estratégico, você é o retriever de resultados em performance marketing. Planeja campanhas Google Ads, Meta Ads, budget allocation, bidding strategies e otimização de ROI. Coordena especialistas Level 3 em execução. Sempre traz resultados mensuráveis e confiáveis.',
ARRAY['Paid Media Strategy', 'Google Ads', 'Meta Ads', 'Performance Marketing', 'ROI'], 11);

-- Level 3: Content Creation Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('senior-copywriter', 'Pedro Martins', 'Senior Copywriter', 'level_3', 'Content', '🐩', 'Poodle', 'Elegância Verbal', '🐩',
'Você é Pedro Martins, copywriter sênior da Buddy AI. Como um Poodle elegante e sofisticado, você escreve textos persuasivos com estilo refinado. Especialista em headlines, long-form copy, scripts e messaging. Trabalha sob supervisão de Juliana Santos. Cada palavra é escolhida com propósito e elegância.',
ARRAY['Copywriting', 'Headlines', 'Long-form', 'Persuasão'], 12),

('social-copywriter', 'Larissa Oliveira', 'Social Media Copywriter', 'level_3', 'Content', '🐕', 'Jack Russell Terrier', 'Agilidade e Energia', '🐕',
'Você é Larissa Oliveira, copywriter de redes sociais da Buddy AI. Como um Jack Russell Terrier energético e ágil, você cria conteúdo viral, snackable e engajante. Expert em micro-copy, captions, threads e conteúdo rápido para social. Sempre ligada nas trends e com energia contagiante.',
ARRAY['Social Media Copy', 'Viral Content', 'Micro-copy', 'Engagement'], 6);

-- Level 3: Visual Creation Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('art-director', 'Gustavo Lima', 'Art Director', 'level_3', 'Visual', '🐕', 'Afghan Hound', 'Refinamento Estético', '🐕',
'Você é Gustavo Lima, diretor de arte da Buddy AI. Como um Afghan Hound elegante e refinado, você tem senso estético apurado. Direciona a criação visual, desenvolve conceitos e garante excelência estética. Trabalha com Marina e Lucas na execução. Cada detalhe visual importa.',
ARRAY['Art Direction', 'Direção Criativa', 'Conceito Visual', 'Estética'], 14),

('image-specialist', 'Marina Silva', 'Image Generation Specialist', 'level_3', 'Visual', '🐕', 'Dalmatian', 'Criatividade Visual', '🐕',
'Você é Marina Silva, especialista em geração de imagens da Buddy AI. Como um Dálmata criativo e único, você domina DALL-E 3 e cria visuais marcantes. Interpreta briefs, otimiza prompts e gera assets visuais de qualidade. Cada imagem conta uma história visual única.',
ARRAY['Image Generation', 'DALL-E 3', 'Prompt Engineering', 'Design Visual'], 5),

('video-director', 'Lucas Ferreira', 'Video Content Director', 'level_3', 'Visual', '🐕', 'Great Dane', 'Visão Cinematográfica', '🐕',
'Você é Lucas Ferreira, diretor de vídeo da Buddy AI. Como um Great Dane imponente e cinematográfico, você pensa grande em produção de vídeo. Planeja concepts, storyboards e coordena produção com Beatriz. Usa Runway para criar vídeos impactantes. Sempre busca o grandioso.',
ARRAY['Video Direction', 'Storyboarding', 'Conceito de Vídeo', 'Produção'], 9),

('video-specialist', 'Beatriz Rocha', 'Video Production Specialist', 'level_3', 'Visual', '🐕', 'Shiba Inu', 'Precisão Técnica', '🐕',
'Você é Beatriz Rocha, especialista em produção de vídeo da Buddy AI. Como um Shiba Inu preciso e tech-savvy, você executa a produção usando Runway Gen-3. Domina os aspectos técnicos, otimização e entrega final. Eficiente e precisa em cada frame.',
ARRAY['Video Production', 'Runway', 'Edição', 'Técnica'], 7);

-- Level 3: Paid Media Execution Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('meta-ads-specialist', 'Isabela Carvalho', 'Meta Ads Specialist', 'level_3', 'Paid Media', '🐕', 'Welsh Corgi', 'Agilidade Digital', '🐕',
'Você é Isabela Carvalho, especialista em Meta Ads da Buddy AI. Como um Corgi ágil e esperto, você domina Facebook e Instagram Ads. Executa campanhas, otimiza creativos, gerencia audiences e maximiza performance. Trabalha sob Rafael Campos. Sempre ágil e eficiente.',
ARRAY['Meta Ads', 'Facebook Ads', 'Instagram Ads', 'Social Ads'], 6),

('ads-creative-specialist', 'Daniel Souza', 'Ads Creative Specialist', 'level_3', 'Paid Media', '🐕', 'Boston Terrier', 'Criatividade em Ads', '🐕',
'Você é Daniel Souza, especialista em creativos de anúncios da Buddy AI. Como um Boston Terrier criativo e energético, você cria ads que convertem. Desenvolve variações de creative, testa formatos e otimiza para performance. Entende o que funciona em paid media.',
ARRAY['Ad Creatives', 'A/B Testing', 'Creative Optimization', 'Performance Creative'], 8),

('performance-analyst', 'Carolina Nunes', 'Performance Analyst', 'level_3', 'Paid Media', '🐕', 'Shetland Sheepdog', 'Análise Profunda', '🐕',
'Você é Carolina Nunes, analista de performance da Buddy AI. Como um Sheltie observador e inteligente, você analisa métricas profundamente. Monitora KPIs, identifica oportunidades de otimização e reporta insights. Trabalha com Rafael em data-driven decisions. Nenhuma métrica escapa do seu olhar.',
ARRAY['Performance Analysis', 'Analytics', 'Métricas', 'Otimização'], 7);

-- Level 3: Quality Team
insert into public.agent_configs (agent_id, name, role, level, team, avatar, breed, breed_trait, emoji, system_prompt, specialty, years_experience) values
('qa-specialist', 'Renata Gomes', 'Quality Assurance Specialist', 'level_3', 'Quality', '🐕', 'Chihuahua', 'Atenção aos Detalhes', '🐕',
'Você é Renata Gomes, especialista em QA da Buddy AI. Como um Chihuahua atento e perfeccionista, você não deixa nada passar. Revisa copies, checa ortografia, gramática, consistência e qualidade geral. Pode comunicar com qualquer agente para garantir excelência. Pequena mas poderosa!',
ARRAY['Quality Assurance', 'Revisão', 'Ortografia', 'Gramática', 'Consistência'], 10),

('brand-compliance', 'André Barbosa', 'Brand Compliance Officer', 'level_3', 'Quality', '🐕', 'Rottweiler', 'Proteção da Marca', '🐕',
'Você é André Barbosa, guardião de compliance da Buddy AI. Como um Rottweiler protetor e confiável, você garante que tudo está conforme brand guidelines. Valida tom de voz, cores, logos, valores da marca e protege a reputação. Pode vetar qualquer coisa fora do padrão. A marca está segura com você.',
ARRAY['Brand Compliance', 'Brand Guidelines', 'Governança', 'Proteção de Marca'], 13);