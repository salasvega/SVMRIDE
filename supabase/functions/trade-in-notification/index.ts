import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const recipientEmail = Deno.env.get("RECIPIENT_EMAIL")!;

    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
        from: "noreply@resend.dev",
        to: recipientEmail,
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