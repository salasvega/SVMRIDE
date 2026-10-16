/**
 * Signature électronique d'un contrat de dépôt-vente (lien personnel reçu par
 * e-mail ou QR code montré au showroom). Le déposant lit le PDF, coche les
 * cases, reçoit un code par e-mail et signe. Tout est vérifié côté serveur
 * (fonction depot-signature) : ce composant ne fait qu'afficher.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Download, FileText, Lock, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { signatureSeo } from '../config/seo';
import { siteConfig } from '../config/site';
import { Section } from '../components/ui/Section';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { appelSignature, ErreurDepot, euros, jour, messageErreur } from '../lib/depot';

interface Resume {
  titre: string;
  type: 'mandat' | 'avenant';
  reference: string;
  deposant: string;
  email_masque: string;
  vehicule: string;
  immatriculation: string | null;
  prix_affiche: number;
  net_vendeur: number;
  date_debut: string;
  date_fin: string;
  duree_mois: number;
  frais_resiliation: number;
  gardiennage_par_jour: number;
  gardiennage_delai_jours: number;
  avenant: { ancienne_date_fin: string; nouvelle_date_fin: string; prix_modifie: boolean } | null;
  empreinte: string;
  expire_le: string;
  code_envoye: boolean;
}

export function Signature() {
  const { jeton = '' } = useParams();
  const [etat, setEtat] = useState<'chargement' | 'erreur' | 'pret' | 'signe'>('chargement');
  const [erreur, setErreur] = useState('');
  const [contrat, setContrat] = useState<Resume | null>(null);
  const [pdf, setPdf] = useState<string | null>(null);
  const [lu, setLu] = useState(false);
  const [accord, setAccord] = useState(false);
  const [renonciation, setRenonciation] = useState(false);
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [attente, setAttente] = useState(0);
  const [code, setCode] = useState('');
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [signe, setSigne] = useState<{ pdf: string | null; le: string } | null>(null);
  const champCode = useRef<HTMLInputElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);

  // Le lien est personnel : on ne le transmet à aucun autre site
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'referrer';
    m.content = 'no-referrer';
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  useEffect(() => {
    appelSignature<{ contrat: Resume; pdf: string | null }>('ouvrir', { jeton })
      .then((r) => {
        setContrat(r.contrat);
        setPdf(r.pdf);
        setCodeEnvoye(r.contrat.code_envoye);
        setEtat('pret');
      })
      .catch((e) => {
        setErreur(messageErreur(e));
        setEtat('erreur');
      });
  }, [jeton]);

  useEffect(() => {
    if (attente <= 0) return;
    const t = setTimeout(() => setAttente((a) => a - 1), 1000);
    return () => clearTimeout(t);
  }, [attente]);

  useEffect(() => {
    if (etat === 'signe') titre.current?.focus();
  }, [etat]);

  const charge = useRef(Date.now());
  const lire = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    setLu(true);
    // Le lien du PDF dure 15 minutes : passé ce délai, on en redemande un
    if (pdf && Date.now() - charge.current < 13 * 60_000) return;
    e.preventDefault();
    const fenetre = window.open('about:blank', '_blank');
    try {
      const r = await appelSignature<{ pdf: string | null }>('ouvrir', { jeton });
      if (r.pdf) {
        setPdf(r.pdf);
        charge.current = Date.now();
        if (fenetre) fenetre.location.href = r.pdf;
        else window.location.href = r.pdf;
        return;
      }
    } catch { /* message ci-dessous */ }
    fenetre?.close();
    setMessage("Le contrat n'a pas pu être ouvert. Rechargez la page.");
  };

  const demanderCode = async () => {
    setMessage('');
    setEnvoi('Envoi du code…');
    try {
      await appelSignature('envoyer-code', { jeton });
      setCodeEnvoye(true);
      setAttente(60);
      setTimeout(() => champCode.current?.focus(), 50);
    } catch (e) {
      setMessage(messageErreur(e));
      if (e instanceof ErreurDepot && e.code === 'attendre') setCodeEnvoye(true);
    } finally {
      setEnvoi(null);
    }
  };

  const signer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (code.replace(/\D/g, '').length !== 6) return setMessage('Saisissez les 6 chiffres reçus par e-mail.');
    setEnvoi('Signature en cours…');
    try {
      const r = await appelSignature<{ pdf: string | null; signe_le: string }>('signer', { jeton, code, accord, renonciation });
      setSigne({ pdf: r.pdf, le: r.signe_le });
      setEtat('signe');
    } catch (err) {
      setMessage(messageErreur(err));
    } finally {
      setEnvoi(null);
    }
  };

  const mandat = contrat?.type === 'mandat';
  const pretACoder = accord && (!mandat || renonciation);
  const tel = siteConfig.contact.phone;

  return (
    <>
      <SEOHead meta={signatureSeo} />
      <Section background="gray" className="!py-8 md:!py-12 min-h-[70vh]">
        <Container size="md">
          {etat === 'chargement' && <p className="text-gris" role="status">Chargement du contrat…</p>}

          {etat === 'erreur' && (
            <div className="carte p-6 md:p-10 text-center">
              <Lock className="w-12 h-12 text-gris mx-auto mb-4" aria-hidden="true" />
              <h1 className="text-[26px] md:text-[30px] mb-3">Lien de signature indisponible</h1>
              <p className="text-gris max-w-xl mx-auto">{erreur}</p>
              <p className="mt-6 text-gris">
                SVM Ride : <a href={`tel:${tel.replace(/\s/g, '')}`} className="lien">{tel}</a>
              </p>
            </div>
          )}

          {etat === 'signe' && contrat && signe && (
            <div className="carte p-6 md:p-10 text-center" role="status">
              <CheckCircle2 className="w-14 h-14 text-green-700 mx-auto mb-4" aria-hidden="true" />
              <h1 ref={titre} tabIndex={-1} className="text-[26px] md:text-[30px] mb-3 outline-none">C'est signé, merci !</h1>
              <p className="text-gris max-w-xl mx-auto">
                Votre {mandat ? 'contrat de dépôt-vente' : 'avenant'} ({contrat.reference}) est signé. Une copie vient de vous être
                envoyée par e-mail ({contrat.email_masque}).
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                {signe.pdf && (
                  <a href={signe.pdf} rel="noreferrer" tabIndex={-1}>
                    <Button size="lg" className="w-full sm:w-auto"><Download className="w-4 h-4" aria-hidden="true" /> Télécharger le contrat signé</Button>
                  </a>
                )}
                <Link to="/suivre-ma-vente" tabIndex={-1}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">Suivre ma vente</Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-gris">Vous pouvez suivre l'avancement de la vente à tout moment sur svmride.com/suivre-ma-vente.</p>
            </div>
          )}

          {etat === 'pret' && contrat && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gris tabular-nums">Référence {contrat.reference}</p>
                <h1 className="text-[24px] sm:text-[28px] md:text-[34px] filet-apres mb-2">{contrat.titre}</h1>
                <p className="text-gris">
                  Bonjour {contrat.deposant.split(' ')[0]}, voici {mandat ? 'votre contrat' : "l'avenant à votre contrat"} pour votre{' '}
                  <strong className="text-noir">{contrat.vehicule}</strong>{contrat.immatriculation ? ` (${contrat.immatriculation})` : ''}.
                </p>
              </div>

              <div className="carte p-5 md:p-6">
                <h2 className="text-lg font-semibold mb-4">L'essentiel</h2>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="text-gris">Prix de vente affiché</dt><dd className="text-noir font-semibold text-base">{euros(contrat.prix_affiche)}</dd></div>
                  <div><dt className="text-gris">Vous percevez (net vendeur)</dt><dd className="text-noir font-semibold text-base">{euros(contrat.net_vendeur)}</dd></div>
                  {contrat.avenant ? (
                    <>
                      <div><dt className="text-gris">Fin actuelle du mandat</dt><dd className="text-noir">{jour(contrat.avenant.ancienne_date_fin)}</dd></div>
                      <div><dt className="text-gris">Nouvelle fin du mandat</dt><dd className="text-noir font-semibold">{jour(contrat.avenant.nouvelle_date_fin)}</dd></div>
                    </>
                  ) : (
                    <>
                      <div><dt className="text-gris">Durée</dt><dd className="text-noir">{contrat.duree_mois} mois, du {jour(contrat.date_debut)} au {jour(contrat.date_fin)}</dd></div>
                      <div><dt className="text-gris">Paiement</dt><dd className="text-noir">Par virement, sous 48 h après l'encaissement de la vente</dd></div>
                      <div><dt className="text-gris">Exclusivité</dt><dd className="text-noir">Pas d'autre annonce pendant le mandat</dd></div>
                      <div><dt className="text-gris">Reprise avant la fin</dt><dd className="text-noir">Indemnité de {euros(contrat.frais_resiliation)}</dd></div>
                      <div className="sm:col-span-2">
                        <dt className="text-gris">Après le mandat</dt>
                        <dd className="text-noir">Gardiennage de {euros(contrat.gardiennage_par_jour)} par jour à partir du {contrat.gardiennage_delai_jours}e jour si la moto n'est pas récupérée</dd>
                      </div>
                    </>
                  )}
                </dl>
                <p className="text-xs text-gris mt-4">
                  Ce résumé ne remplace pas le contrat : lisez le document complet avant de signer.
                </p>
              </div>

              <div className="carte p-5 md:p-6">
                <a
                  href={pdf ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={lire}
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-vif ${
                    lu ? 'bg-white text-noir border-or hover:bg-fond' : 'bg-bleu text-white border-transparent hover:bg-bleu-hover'
                  }`}
                >
                  <FileText className="w-4 h-4" aria-hidden="true" /> {lu ? 'Relire le contrat (PDF)' : 'Lire le contrat complet (PDF)'}
                </a>
                <p className="text-xs text-gris mt-2">S'ouvre dans un nouvel onglet. Empreinte du document : {contrat.empreinte.slice(0, 16)}…</p>

                <div className="mt-6 space-y-4">
                  <label className="flex items-start gap-3 text-sm text-noir leading-relaxed">
                    <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0 accent-[#254893]" />
                    <span>J'ai lu l'intégralité du {mandat ? 'contrat' : "de l'avenant"} et j'en accepte les termes.</span>
                  </label>
                  {mandat && (
                    <label className="flex items-start gap-3 text-sm text-noir leading-relaxed">
                      <input type="checkbox" checked={renonciation} onChange={(e) => setRenonciation(e.target.checked)} className="mt-1 w-5 h-5 flex-shrink-0 accent-[#254893]" />
                      <span>
                        Je demande l'exécution immédiate du mandat (mise en vente dès aujourd'hui) et je renonce expressément au délai de
                        rétractation, dans la mesure où il s'appliquerait.
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <form onSubmit={signer} className="carte p-5 md:p-6 space-y-4" aria-labelledby="t-signer">
                <h2 id="t-signer" className="text-lg font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-bleu" aria-hidden="true" /> Signer
                </h2>
                <p className="text-sm text-gris">
                  Pour signer, nous vous envoyons un code à 6 chiffres à {contrat.email_masque}. Ce code vaut signature : ne le communiquez à personne.
                </p>
                {!codeEnvoye ? (
                  <Button type="button" size="lg" onClick={demanderCode} disabled={!pretACoder || !!envoi} className="w-full sm:w-auto">
                    {envoi ?? 'Recevoir mon code de signature'}
                  </Button>
                ) : (
                  <>
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-noir mb-2">Code reçu par e-mail</label>
                      <input
                        ref={champCode}
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9 ]*"
                        maxLength={7}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                        className="w-full sm:w-56 px-4 py-3 bg-white text-noir border-[1.5px] border-champ rounded-xl text-2xl tracking-[0.4em] tabular-nums focus:outline-none focus:border-bleu focus:ring-4 focus:ring-bleu/15"
                      />
                      <p className="text-xs text-gris mt-1">Valable 10 minutes. Pensez à regarder dans vos courriers indésirables.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="submit" size="lg" disabled={!pretACoder || !!envoi || code.length !== 6} className="w-full sm:w-auto">
                        {envoi ?? `Signer ${mandat ? 'le contrat' : "l'avenant"}`}
                      </Button>
                      <Button type="button" variant="outline" onClick={demanderCode} disabled={!!envoi || attente > 0} className="w-full sm:w-auto">
                        {attente > 0 ? `Renvoyer le code (${attente} s)` : 'Renvoyer le code'}
                      </Button>
                    </div>
                  </>
                )}
                {!pretACoder && <p className="text-xs text-gris">Cochez d'abord {mandat ? 'les deux cases' : 'la case'} ci-dessus.</p>}
                {message && (
                  <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{message}</div>
                )}
                {envoi && <p className="sr-only" role="status">{envoi}</p>}
              </form>

              <p className="text-sm text-gris">
                Une question avant de signer ? Appelez-nous au{' '}
                <a href={`tel:${tel.replace(/\s/g, '')}`} className="lien whitespace-nowrap">{tel}</a>.
              </p>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
