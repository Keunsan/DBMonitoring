-- Phase 5 저장·정규화 MVP 스키마입니다.
-- 실제 운영 반영 전 T-009/T-010 인증·RBAC 정책과 RLS를 함께 확정합니다.

create table if not exists public.business_system (
  id uuid primary key,
  tenant_id uuid not null,
  code text not null,
  name text not null,
  importance text not null,
  owner_dept text,
  owner_name text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.db_instance (
  id uuid primary key,
  tenant_id uuid not null,
  dbms_type text not null,
  instance_name text not null,
  host text not null,
  port integer not null,
  service_name text,
  database_name text,
  business_system_id uuid not null references public.business_system(id),
  importance text not null,
  env_type text not null,
  collector_type text not null,
  collector_id text,
  collect_interval_sec integer not null default 30,
  sql_aggregate_interval_sec integer not null default 300,
  is_active boolean not null default true,
  connection_secret_ref text not null,
  last_collect_at timestamptz,
  last_collect_status text,
  last_connection_test_at timestamptz,
  last_connection_test_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_db_instance_tenant_active
  on public.db_instance (tenant_id, is_active);

create table if not exists public.collection_run (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status text not null,
  error_message text,
  metrics_count integer not null default 0,
  sessions_count integer not null default 0,
  locks_count integer not null default 0,
  sql_count integer not null default 0
);

create index if not exists idx_collection_run_instance_time
  on public.collection_run (db_instance_id, finished_at desc);

create table if not exists public.metric_history (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  metric_time timestamptz not null,
  metric_name text not null,
  metric_value double precision not null,
  unit text,
  tags jsonb not null default '{}'::jsonb
);

create index if not exists idx_metric_history_instance_metric_time
  on public.metric_history (db_instance_id, metric_name, metric_time desc);

create table if not exists public.session_snapshot (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  snapshot_time timestamptz not null,
  session_id text not null,
  login_name text not null,
  status text not null,
  wait_type text,
  wait_ms integer,
  sql_id text,
  host_name text,
  program_name text,
  database_name text
);

create index if not exists idx_session_snapshot_instance_time
  on public.session_snapshot (db_instance_id, snapshot_time desc);

create table if not exists public.blocking_snapshot (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  snapshot_time timestamptz not null,
  blocker_session_id text not null,
  blocked_session_id text not null,
  lock_type text not null,
  wait_ms integer not null,
  object_name text
);

create index if not exists idx_blocking_snapshot_instance_time
  on public.blocking_snapshot (db_instance_id, snapshot_time desc);

create table if not exists public.sql_performance (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  metric_time timestamptz not null,
  sql_id text not null,
  sql_text_masked text not null,
  executions bigint not null,
  avg_elapsed_ms double precision not null,
  total_cpu_ms double precision not null,
  total_logical_reads double precision,
  last_execution_time timestamptz
);

create index if not exists idx_sql_performance_instance_time
  on public.sql_performance (db_instance_id, metric_time desc);

create table if not exists public.deadlock_event (
  id uuid primary key,
  tenant_id uuid not null,
  db_instance_id uuid not null references public.db_instance(id),
  occurred_at timestamptz not null,
  victim_session_id text not null,
  graph_xml text not null
);

create index if not exists idx_deadlock_event_instance_time
  on public.deadlock_event (db_instance_id, occurred_at desc);
