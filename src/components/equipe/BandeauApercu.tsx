import { Eye } from 'lucide-react';

/** Signale, en aperçu seulement, que les fiches sont fictives ou les textes provisoires. */
export function BandeauApercu({ className = '' }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2.5 rounded-xl border border-or/50 bg-[#FBF6E9] px-4 py-3 text-sm text-noir ${className}`}
    >
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-or-texte" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Aperçu :</strong> textes provisoires (présentation de Mattia et phrases de
        l'équipe), en attente de validation. Cette partie n'est pas visible sur svmride.com tant que la publication
        n'est pas activée.
      </span>
    </p>
  );
}
