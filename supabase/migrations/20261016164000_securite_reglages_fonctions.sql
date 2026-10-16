/*
  Réglages de sécurité signalés par le conseiller Supabase (16/10/2026).
  - search_path figé sur les fonctions qui ne le précisaient pas ;
  - fonctions déclencheurs retirées de l'API (elles ne servent qu'aux
    déclencheurs ; PostgreSQL ne vérifie pas ce droit quand un déclencheur
    s'exécute, les notifications e-mail continuent donc de partir).
  Restent signalées, volontairement : stockage_utilise() et
  photos_a_compresser(), réservées à l'admin connecté (tableau de bord).
*/
alter function private.duree_pieces_jointes() set search_path = '';
alter function private.duree_demandes() set search_path = '';
alter function private.delai_orphelins() set search_path = '';
alter function public.generate_folder_number() set search_path = public;
alter function public.set_folder_number() set search_path = public;
alter function public.update_sales_folder_timestamp() set search_path = public;
alter function public.update_user_financing_profiles_updated_at() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;

revoke execute on function public.notify_financing_profile_submission() from public, anon, authenticated;
revoke execute on function public.send_contact_email_webhook() from public, anon, authenticated;
revoke execute on function public.send_custom_search_email_webhook() from public, anon, authenticated;
revoke execute on function public.send_financing_email_webhook() from public, anon, authenticated;
revoke execute on function public.send_trade_in_email_webhook() from public, anon, authenticated;
