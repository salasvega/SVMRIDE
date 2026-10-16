import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Adresses des notifications (domaine svmride.com vérifié chez Resend le 16/10/2026).
// Pas de copie au développeur ici : cet e-mail joint les pièces du client
// (identité, fiches de paie, RIB), qui ne doivent pas sortir de la boîte SVM Ride.
const EXPEDITEUR = "SVM Ride <contact@svmride.com>";
const DESTINATAIRE = "contact@svmride.com";
const COPIE_DEV: string[] = [];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    user_email: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    birth_date: string;
    birth_postal_code: string;
    current_address: string;
    housing_status: string;
    housing_entry_date: string;
    rent_or_credit_amount: number;
    job_title: string;
    contract_type: string;
    employment_start_date: string;
    monthly_net_salary: number;
    marital_status: string;
    dependents_count: number;
    vehicle_to_finance: string;
    desired_duration: number;
    other_charges_or_credits?: string;
    other_income_sources?: string;
    comments?: string;
    id_card_front?: string;
    id_card_back?: string;
    driver_license_front?: string;
    driver_license_back?: string;
    proof_of_residence?: string;
    payslip_1?: string;
    payslip_2?: string;
    payslip_3?: string;
    tax_notice?: string;
    rib?: string;
    hosting_certificate?: string;
    host_id_card?: string;
    submitted_at: string;
    status: string;
  };
}


// Clé secrète Supabase (sb_secret_…) fournie automatiquement par la plateforme.
// Repli sur l'ancienne clé tant que les clés legacy sont actives.
function getSecretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch (_) { /* ignore */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

// Seuls les déclencheurs de la base (qui envoient la clé secrète dans l'en-tête apikey)
// peuvent appeler cette fonction.
function isAuthorizedCaller(req: Request): boolean {
  const apikey = req.headers.get("apikey") ?? "";
  if (!apikey) return false;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return Object.values(keys).includes(apikey);
  } catch (_) {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }


  if (!isAuthorizedCaller(req)) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    console.log("Received financing profile submission:", {
      id: record.id,
      email: record.user_email,
      submitted_at: record.submitted_at,
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = getSecretKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const documentFields = [
      { key: 'id_card_front', label: 'Carte d\'identité (recto)' },
      { key: 'id_card_back', label: 'Carte d\'identité (verso)' },
      { key: 'driver_license_front', label: 'Permis de conduire (recto)' },
      { key: 'driver_license_back', label: 'Permis de conduire (verso)' },
      { key: 'proof_of_residence', label: 'Justificatif de domicile' },
      { key: 'payslip_1', label: 'Bulletin de salaire 1' },
      { key: 'payslip_2', label: 'Bulletin de salaire 2' },
      { key: 'payslip_3', label: 'Bulletin de salaire 3' },
      { key: 'tax_notice', label: 'Avis d\'imposition' },
      { key: 'rib', label: 'RIB' },
      { key: 'hosting_certificate', label: 'Attestation d\'hébergement' },
      { key: 'host_id_card', label: 'Pièce d\'identité hébergeur' },
    ];

    let documentsHtml = '<h3>Documents fournis:</h3><ul>';
    const resendAttachments = [];

    for (const field of documentFields) {
      const filePath = record[field.key as keyof typeof record] as string | undefined;
      
      if (filePath) {
        documentsHtml += `<li>${field.label}</li>`;
        
        try {
          const { data, error } = await supabase.storage
            .from('financing-documents')
            .download(filePath);

          if (!error && data) {
            const buffer = await data.arrayBuffer();
            const base64Content = btoa(
              new Uint8Array(buffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );

            const fileName = filePath.split('/').pop() || filePath;
            resendAttachments.push({
              filename: fileName,
              content: base64Content,
            });
          }
        } catch (err) {
          console.error(`Error downloading ${field.key}:`, err);
        }
      }
    }

    documentsHtml += '</ul>';

    const emailHtml = `
      <h2>Nouveau dossier de financement soumis</h2>
      
      <h3>Informations personnelles</h3>
      <p><strong>Nom:</strong> ${record.last_name}</p>
      <p><strong>Prénom:</strong> ${record.first_name}</p>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Téléphone:</strong> ${record.phone_number}</p>
      <p><strong>Date de naissance:</strong> ${new Date(record.birth_date).toLocaleDateString('fr-FR')}</p>
      <p><strong>Code postal de naissance:</strong> ${record.birth_postal_code}</p>
      <p><strong>Adresse actuelle:</strong> ${record.current_address}</p>
      
      <h3>Situation de logement</h3>
      <p><strong>Statut:</strong> ${record.housing_status}</p>
      <p><strong>Date d'entrée:</strong> ${new Date(record.housing_entry_date).toLocaleDateString('fr-FR')}</p>
      <p><strong>Montant loyer/crédit:</strong> ${record.rent_or_credit_amount} €</p>
      
      <h3>Situation professionnelle</h3>
      <p><strong>Poste:</strong> ${record.job_title}</p>
      <p><strong>Type de contrat:</strong> ${record.contract_type}</p>
      <p><strong>Date de début:</strong> ${new Date(record.employment_start_date).toLocaleDateString('fr-FR')}</p>
      <p><strong>Salaire mensuel net:</strong> ${record.monthly_net_salary} €</p>
      ${record.other_income_sources ? `<p><strong>Autres revenus:</strong> ${record.other_income_sources}</p>` : ''}
      ${record.other_charges_or_credits ? `<p><strong>Autres charges/crédits:</strong> ${record.other_charges_or_credits}</p>` : ''}
      
      <h3>Situation personnelle</h3>
      <p><strong>Situation maritale:</strong> ${record.marital_status}</p>
      <p><strong>Personnes à charge:</strong> ${record.dependents_count}</p>
      
      <h3>Projet de financement</h3>
      <p><strong>Véhicule:</strong> ${record.vehicle_to_finance}</p>
      <p><strong>Durée souhaitée:</strong> ${record.desired_duration} mois</p>
      ${record.comments ? `<p><strong>Commentaires:</strong> ${record.comments}</p>` : ''}

      ${documentsHtml}
      
      <p><strong>Date de soumission:</strong> ${new Date(record.submitted_at).toLocaleString('fr-FR')}</p>
      <p><strong>Statut:</strong> ${record.status}</p>
      
      <hr>
      <p><em>Identifiant du dossier: ${record.id}</em></p>
    `;

    console.log("Sending email with", resendAttachments.length, "attachments");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: DESTINATAIRE,
        ...(COPIE_DEV.length ? { bcc: COPIE_DEV } : {}),
        subject: `Nouveau dossier de financement - ${record.first_name} ${record.last_name}`,
        html: emailHtml,
        attachments: resendAttachments,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});