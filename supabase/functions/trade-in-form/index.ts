import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Attachment {
  filename: string;
  path: string;
  size: number;
  mime_type: string;
}

interface TradeInFormData {
  name: string;
  email: string;
  phone: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  condition: string;
  comments: string;
  consent: boolean;
  attachments?: Attachment[];
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = getSecretKey();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData: TradeInFormData = await req.json();

    if (!formData.name || !formData.email || !formData.phone || !formData.brand || !formData.model || !formData.year || !formData.mileage || !formData.condition) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Tous les champs requis doivent être remplis",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!formData.consent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vous devez accepter la politique de confidentialité",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { error: dbError } = await supabase.from("trade_in_submissions").insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      mileage: formData.mileage,
      condition: formData.condition,
      comments: formData.comments || '',
      attachments: formData.attachments || [],
      submitted_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Erreur lors de l'enregistrement de la demande");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demande envoyée avec succès",
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
    console.error("Error processing trade-in form:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Une erreur est survenue lors de l'envoi du formulaire",
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