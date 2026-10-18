/*
  Studio Design — typographie (18/10/2026).

  - Validation : nouveaux réglages de style police_titres, police_texte,
    taille_titres, graisse_titres, casse_titres (miroir de STYLE dans
    src/config/design.ts ; les polices sont des choix de liste, jamais du texte libre).
  - Thèmes prédéfinis : chacun reçoit sa typographie (SVM Signature inchangé).
    Le thème en ligne n'est pas modifié : sa configuration est figée dans
    l'historique des publications.
*/

create or replace function private.theme_valide(t jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  k text;
  v jsonb;
  k2 text;
  v2 jsonb;
  hex constant text := '^#[0-9A-Fa-f]{6}$';
begin
  if t is null or jsonb_typeof(t) <> 'object' or t -> 'schema' is distinct from '1'::jsonb then
    return false;
  end if;
  for k in select jsonb_object_keys(t) loop
    if k not in ('schema', 'couleurs', 'derivees', 'sections', 'style') then return false; end if;
  end loop;

  if jsonb_typeof(t -> 'couleurs') is distinct from 'object' then return false; end if;
  for k, v in select * from jsonb_each(t -> 'couleurs') loop
    if k not in ('primaire', 'secondaire', 'accent', 'arriere_plan', 'surface', 'texte', 'texte_secondaire', 'bordure', 'boutons', 'liens')
       or jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ hex then
      return false;
    end if;
  end loop;

  if t ? 'derivees' then
    if jsonb_typeof(t -> 'derivees') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'derivees') loop
      if k not in ('bleu-hover', 'bleu-clair', 'sur-bouton', 'bleu-vif', 'or-texte', 'or-voile', 'or-voile-leger', 'degrade-debut',
                   'degrade-debut-sombre', 'champ', 'doux-68', 'doux-64', 'doux-62', 'doux-58', 'inverse', 'inverse-91',
                   'inverse-88', 'inverse-84', 'inverse-74', 'inverse-66', 'inverse-53', 'inverse-52')
         or jsonb_typeof(v) <> 'string' or (v #>> '{}') !~ hex then
        return false;
      end if;
    end loop;
  end if;

  if t ? 'sections' then
    if jsonb_typeof(t -> 'sections') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'sections') loop
      if k not in ('header', 'hero', 'catalogue', 'cartes', 'fiche', 'marques', 'equipe', 'avis', 'formulaires', 'boutons', 'footer')
         or jsonb_typeof(v) <> 'object' then
        return false;
      end if;
      for k2, v2 in select * from jsonb_each(v) loop
        if k2 not in ('fond', 'texte', 'titres', 'accent', 'bouton', 'bordure')
           or jsonb_typeof(v2) <> 'string' or (v2 #>> '{}') !~ hex then
          return false;
        end if;
      end loop;
    end loop;
  end if;

  if t ? 'style' then
    if jsonb_typeof(t -> 'style') <> 'object' then return false; end if;
    for k, v in select * from jsonb_each(t -> 'style') loop
      if jsonb_typeof(v) <> 'string' then return false; end if;
      if not (
        (k = 'police_titres' and (v #>> '{}') in ('oswald', 'bebas', 'barlow', 'anton', 'rajdhani', 'montserrat', 'playfair'))
        or (k = 'police_texte' and (v #>> '{}') in ('inter', 'dmsans', 'roboto', 'lato', 'opensans', 'sourcesans'))
        or (k = 'taille_titres' and (v #>> '{}') in ('compacte', 'normale', 'grande', 'tres_grande'))
        or (k = 'graisse_titres' and (v #>> '{}') in ('normale', 'semi_grasse', 'grasse'))
        or (k = 'casse_titres' and (v #>> '{}') in ('majuscules', 'normale'))
        or (k = 'arrondi_boutons' and (v #>> '{}') in ('carre', 'leger', 'arrondi', 'pilule'))
        or (k = 'arrondi_cartes' and (v #>> '{}') in ('carre', 'leger', 'arrondi'))
        or (k = 'ombres' and (v #>> '{}') in ('aucune', 'legeres', 'marquees'))
      ) then
        return false;
      end if;
    end loop;
  end if;

  return true;
end;
$$;
grant execute on function private.theme_valide(jsonb) to anon, authenticated;

do $$
begin
  perform set_config('svm.migration', 'oui', true);
  update public.design_themes set config = jsonb_set(config, '{style}', coalesce(config -> 'style', '{}'::jsonb) || s.typo)
  from (values
    (2, '{"police_titres":"barlow","police_texte":"roboto","graisse_titres":"grasse","taille_titres":"grande"}'::jsonb),
    (3, '{"police_titres":"montserrat","police_texte":"dmsans","casse_titres":"normale","graisse_titres":"semi_grasse"}'::jsonb),
    (4, '{"police_titres":"playfair","police_texte":"lato","casse_titres":"normale","graisse_titres":"normale","taille_titres":"grande"}'::jsonb),
    (5, '{"police_titres":"rajdhani","police_texte":"inter","graisse_titres":"grasse"}'::jsonb)
  ) as s(ordre, typo)
  where predefini and design_themes.ordre = s.ordre;
  perform set_config('svm.migration', '', true);
end;
$$;
