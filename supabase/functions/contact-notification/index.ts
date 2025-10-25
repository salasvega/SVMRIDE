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
    subject: string;
    message: string;
    attachments?: Attachment[];
    submitted_at: string;
  };
  schema: string;
  old_record: null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Service d'emailing non configuré",
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

    const payload: WebhookPayload = await req.json();
    console.log("Webhook received:", payload);

    if (payload.type !== "INSERT") {
      return new Response(
        JSON.stringify({ success: true, message: "Event ignored" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { name, email, subject, message, attachments, submitted_at } = payload.record;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const resendAttachments = [];

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
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
    if (attachments && attachments.length > 0) {
      attachmentsHtml = '<p><strong>Pi\u00e8ces jointes:</strong></p><ul>';
      for (const attachment of attachments) {
        const sizeKB = (attachment.size / 1024).toFixed(2);
        attachmentsHtml += `<li>${attachment.filename} (${sizeKB} KB)</li>`;
      }
      attachmentsHtml += '</ul>';
    }

    const emailHtml = `
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Sujet:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${message.replace(/\n/g, '<br>')}</p>
      ${attachmentsHtml}
      <p><strong>Date de soumission:</strong> ${new Date(submitted_at).toLocaleString('fr-FR')}</p>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "SVM Ride <contact@axsdesign.com>",
        to: ["salasvega@gmail.com"],
        subject: `Nouveau contact: ${subject}`,
        html: emailHtml,
        reply_to: email,
        attachments: resendAttachments,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Erreur lors de l'envoi de l'email: ${errorData.message}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de notification envoyé",
        emailId: emailData.id,
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
    console.error("Error in contact-notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
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
