-- Réserve un essai de code AVANT vérification, de façon atomique : des
-- requêtes simultanées obtiennent chacune un numéro d'essai distinct, ce qui
-- empêche de contourner la limite en envoyant les essais en parallèle.
create or replace function public.financement_reserver_essai(p_id uuid)
returns table (essais integer, bloque_jusqua timestamptz)
language sql
security definer
set search_path = public
as $$
  update public.user_financing_profiles
  set access_failed_attempts = case
        when access_locked_until is not null and access_locked_until <= now() then 1
        else access_failed_attempts + 1 end,
      access_locked_until = case
        when access_locked_until is not null and access_locked_until <= now() then null
        else access_locked_until end
  where id = p_id
  returning access_failed_attempts, access_locked_until;
$$;

revoke all on function public.financement_reserver_essai(uuid) from public, anon, authenticated;
grant execute on function public.financement_reserver_essai(uuid) to service_role;
