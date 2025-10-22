import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFICATION_EMAIL = 'salasvega@gmail.com';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  type: 'contact' | 'financing' | 'trade_in' | 'custom_search';
  record: any;
}

function formatContactEmail(record: any): string {
  return `
    <h2>Nouveau message de contact</h2>
    <p><strong>Nom:</strong> ${record.name}</p>
    <p><strong>Email:</strong> ${record.email}</p>
    <p><strong>Téléphone:</strong> ${record.phone || 'Non renseigné'}</p>
    <p><strong>Message:</strong></p>
    <p>${record.message}</p>
    <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString('fr-FR')}</p>
  `;
}

function formatFinancingEmail(record: any): string {
  return `
    <h2>Nouvelle demande de financement</h2>
    <p><strong>Nom:</strong> ${record.last_name} ${record.first_name}</p>
    <p><strong>Email:</strong> ${record.email}</p>
    <p><strong>Téléphone:</strong> ${record.phone}</p>
    <p><strong>Date de naissance:</strong> ${record.birth_date}</p>
    <p><strong>Montant souhaité:</strong> ${record.desired_amount}€</p>
    <p><strong>Durée:</strong> ${record.duration} mois</p>
    <p><strong>Apport:</strong> ${record.down_payment}€</p>
    <p><strong>Situation professionnelle:</strong> ${record.employment_status}</p>
    <p><strong>Revenus mensuels:</strong> ${record.monthly_income}€</p>
    ${record.comments ? `<p><strong>Commentaires:</strong> ${record.comments}</p>` : ''}
    <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString('fr-FR')}</p>
  `;
}

function formatTradeInEmail(record: any): string {
  return `
    <h2>Nouvelle demande de reprise</h2>
    <p><strong>Nom:</strong> ${record.name}</p>
    <p><strong>Email:</strong> ${record.email}</p>
    <p><strong>Téléphone:</strong> ${record.phone}</p>
    <h3>Véhicule à reprendre:</h3>
    <p><strong>Marque:</strong> ${record.vehicle_brand}</p>
    <p><strong>Modèle:</strong> ${record.vehicle_model}</p>
    <p><strong>Année:</strong> ${record.vehicle_year}</p>
    <p><strong>Kilométrage:</strong> ${record.vehicle_mileage} km</p>
    <p><strong>État:</strong> ${record.vehicle_condition}</p>
    ${record.message ? `<p><strong>Message:</strong> ${record.message}</p>` : ''}
    <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString('fr-FR')}</p>
  `;
}

function formatCustomSearchEmail(record: any): string {
  return `
    <h2>Nouvelle recherche personnalisée</h2>
    <p><strong>Nom:</strong> ${record.name}</p>
    <p><strong>Email:</strong> ${record.email}</p>
    <p><strong>Téléphone:</strong> ${record.phone}</p>
    <h3>Critères de recherche:</h3>
    <p><strong>Type:</strong> ${record.vehicle_type}</p>
    <p><strong>Marque:</strong> ${record.vehicle_brand || 'Non spécifié'}</p>
    <p><strong>Budget min:</strong> ${record.min_budget}€</p>
    <p><strong>Budget max:</strong> ${record.max_budget}€</p>
    <p><strong>Année min:</strong> ${record.min_year || 'Non spécifié'}</p>
    <p><strong>Kilométrage max:</strong> ${record.max_mileage ? record.max_mileage + ' km' : 'Non spécifié'}</p>
    <p><strong>Carburant:</strong> ${record.fuel_type || 'Non spécifié'}</p>
    <p><strong>Transmission:</strong> ${record.transmission || 'Non spécifié'}</p>
    ${record.additional_criteria ? `<p><strong>Critères supplémentaires:</strong> ${record.additional_criteria}</p>` : ''}
    <p><strong>Date:</strong> ${new Date(record.created_at).toLocaleString('fr-FR')}</p>
  `;
}

function getEmailContent(type: string, record: any): { subject: string; html: string } {
  switch (type) {
    case 'contact':
      return {
        subject: `Nouveau message de ${record.name}`,
        html: formatContactEmail(record)
      };
    case 'financing':
      return {
        subject: `Nouvelle demande de financement - ${record.first_name} ${record.last_name}`,
        html: formatFinancingEmail(record)
      };
    case 'trade_in':
      return {
        subject: `Nouvelle demande de reprise - ${record.vehicle_brand} ${record.vehicle_model}`,
        html: formatTradeInEmail(record)
      };
    case 'custom_search':
      return {
        subject: `Nouvelle recherche personnalisée - ${record.name}`,
        html: formatCustomSearchEmail(record)
      };
    default:
      return {
        subject: 'Nouvelle notification',
        html: '<p>Nouvelle soumission reçue</p>'
      };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const payload: NotificationPayload = await req.json();
    const { type, record } = payload;

    const { subject, html } = getEmailContent(type, record);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'notifications@yourdomain.com',
        to: [NOTIFICATION_EMAIL],
        subject: subject,
        html: html
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});