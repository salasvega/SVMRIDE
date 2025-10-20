import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CustomSearchFormData {
  name: string;
  email: string;
  phone: string;
  type: string;
  brand?: string;
  displacement?: string;
  yearMin?: string;
  budgetMax: string;
  deadline: string;
  comments?: string;
  consent: boolean;
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData: CustomSearchFormData = await req.json();

    if (!formData.name || !formData.email || !formData.phone || !formData.type || !formData.budgetMax || !formData.deadline) {
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

    const { error: dbError } = await supabase.from("custom_search_submissions").insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      brand: formData.brand || '',
      displacement: formData.displacement || '',
      year_min: formData.yearMin || '',
      budget_max: formData.budgetMax,
      deadline: formData.deadline,
      comments: formData.comments || '',
      submitted_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Erreur lors de l'enregistrement de la recherche");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recherche envoyée avec succès",
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
    console.error("Error processing custom search form:", error);
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
