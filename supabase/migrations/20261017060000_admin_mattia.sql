-- Accès administrateur de Mattia SARAVIA (responsable commercial), compte créé par Seb le 17/10/2026
insert into private.administrateurs (user_id)
select id from auth.users where email = 'mattiasaravia@hotmail.fr'
on conflict do nothing;
