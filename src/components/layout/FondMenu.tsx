/**
 * Fond derrière un menu « sandwich » ouvert (site et admin, tablette et
 * téléphone) : légèrement assombri, il referme le menu au premier toucher ou
 * clic en dehors, sans déclencher le lien ou le bouton qui se trouve dessous.
 * Le menu doit être au-dessus (z-index plus élevé que `z`).
 */
export function FondMenu({ ouvert, onFermer, z = 'z-40' }: { ouvert: boolean; onFermer: () => void; z?: string }) {
  return (
    <div
      aria-hidden="true"
      onClick={onFermer}
      className={`fixed inset-0 ${z} bg-noir/25 transition-opacity duration-300 ease-out motion-reduce:transition-none xl:hidden ${
        ouvert ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    />
  );
}
