-- Fix remaining function without search_path
create or replace function public.version_agent_prompt()
returns trigger
language plpgsql
security definer
set search_path = public
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