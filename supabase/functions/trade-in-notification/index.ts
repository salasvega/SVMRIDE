import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

// Adresses des notifications (domaine svmride.com vérifié chez Resend le 16/10/2026).
// COPIE_DEV : copie cachée au développeur pendant les tests ; vider la liste pour l'arrêter.
const EXPEDITEUR = "SVM Ride <contact@svmride.com>";
const DESTINATAIRE = "contact@svmride.com";
const COPIE_DEV: string[] = ["salasvega@gmail.com"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Attachment {
  filename: string;
  path: string;
  size: number;
  mime_type: string;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    name: string;
    email: string;
    phone: string;
    brand: string;
    model: string;
    year: string;
    mileage: string;
    condition: string;
    comments: string;
    attachments?: Attachment[];
    submitted_at: string;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = getSecretKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const resendAttachments = [];

    if (record.attachments && record.attachments.length > 0) {
      for (const attachment of record.attachments) {
        try {
          const { data, error } = await supabase.storage
            .from('form-attachments')
            .download(attachment.path);

          if (!error && data) {
            const buffer = await data.arrayBuffer();
            const base64Content = btoa(
              new Uint8Array(buffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
              )
            );

            resendAttachments.push({
              filename: attachment.filename,
              content: base64Content,
            });
          }
        } catch (err) {
          console.error(`Error processing attachment ${attachment.filename}:`, err);
        }
      }
    }

    let attachmentsHtml = '';
    if (record.attachments && record.attachments.length > 0) {
      attachmentsHtml = '<p><strong>Pi\u00e8ces jointes:</strong></p><ul>';
      for (const attachment of record.attachments) {
        const sizeKB = (attachment.size / 1024).toFixed(2);
        attachmentsHtml += `<li>${attachment.filename} (${sizeKB} KB)</li>`;
      }
      attachmentsHtml += '</ul>';
    }

    const emailHtml = `
      <p><strong>Nom:</strong> ${record.name}</p>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Téléphone:</strong> ${record.phone}</p>
      <p><strong>Marque:</strong> ${record.brand}</p>
      <p><strong>Modèle:</strong> ${record.model}</p>
      <p><strong>Année:</strong> ${record.year}</p>
      <p><strong>Kilométrage:</strong> ${record.mileage} km</p>
      <p><strong>État:</strong> ${record.condition}</p>
      ${record.comments ? `<p><strong>Commentaires:</strong> ${record.comments}</p>` : ''}
      ${attachmentsHtml}
      <p><strong>Date de soumission:</strong> ${new Date(record.submitted_at).toLocaleString('fr-FR')}</p>
    `;

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
        subject: `Nouvelle demande de reprise - ${record.brand} ${record.model}`,
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