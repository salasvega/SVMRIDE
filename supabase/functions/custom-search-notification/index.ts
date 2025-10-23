import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    name: string;
    email: string;
    phone: string;
    type: string;
    brand: string;
    displacement: string;
    year_min: string;
    budget_max: string;
    deadline: string;
    comments: string;
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

    const emailHtml = `
      <h2>Nouvelle Recherche Personnalisée</h2>
      <p><strong>Nom:</strong> ${record.name}</p>
      <p><strong>Email:</strong> ${record.email}</p>
      <p><strong>Téléphone:</strong> ${record.phone}</p>
      <p><strong>Type:</strong> ${record.type}</p>
      ${record.brand ? `<p><strong>Marque:</strong> ${record.brand}</p>` : ''}
      ${record.displacement ? `<p><strong>Cylindrée:</strong> ${record.displacement}</p>` : ''}
      ${record.year_min ? `<p><strong>Année minimum:</strong> ${record.year_min}</p>` : ''}
      <p><strong>Budget maximum:</strong> ${record.budget_max} €</p>
      <p><strong>Délai:</strong> ${record.deadline}</p>
      ${record.comments ? `<p><strong>Commentaires:</strong> ${record.comments}</p>` : ''}
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
        subject: `Nouvelle recherche personnalisée - ${record.type}`,
        html: emailHtml,
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