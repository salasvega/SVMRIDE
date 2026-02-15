import { Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatPrice, formatMileage } from '../../utils/vehicle-filters';
import { siteConfig } from '../../config/site';

interface VehicleSalesSheetProps {
  vehicle: {
    brand: string;
    model: string;
    year: number;
    type: string;
    displacement: number;
    price: number;
    mileage: number;
    condition: string;
    description: string;
    images: Array<{ url: string; path: string }>;
    features: string[];
    warranty: string;
  };
}

export function VehicleSalesSheet({ vehicle }: VehicleSalesSheetProps) {
  const conditionLabels: Record<string, string> = {
    excellent: 'Excellent',
    bon: 'Bon',
    correct: 'Correct',
    'a-reviser': 'À réviser',
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const featuresHTML = vehicle.features.length > 0 ? `
      <div class="features">
        <h2 class="section-title">Équipements</h2>
        <div class="features-list">
          ${vehicle.features.slice(0, 8).map(feature => `
            <div class="feature-item">
              <span class="feature-bullet"></span>
              ${feature}
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const descriptionHTML = vehicle.description ? `
      <div>
        <h2 class="section-title">Description</h2>
        <div class="description">${vehicle.description}</div>
      </div>
    ` : '';

    const warrantyHTML = vehicle.warranty ? `
      <div class="warranty">
        <div class="warranty-icon">🛡️ GARANTIE</div>
        <div class="warranty-text">${vehicle.warranty}</div>
      </div>
    ` : '';

    const imageHTML = vehicle.images.length > 0 ? `
      <img
        src="${vehicle.images[0].url}"
        alt="${vehicle.brand} ${vehicle.model}"
        class="vehicle-image"
      />
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fiche de vente - ${vehicle.brand} ${vehicle.model}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: white;
              padding: 20px;
            }
            .sales-sheet {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              border: 3px solid #D10000;
              border-radius: 16px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #D10000 0%, #A00000 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 8px;
              letter-spacing: 2px;
            }
            .tagline {
              font-size: 14px;
              opacity: 0.9;
            }
            .vehicle-image {
              width: 100%;
              height: 350px;
              object-fit: cover;
              border-bottom: 3px solid #D10000;
            }
            .content {
              padding: 30px;
            }
            .vehicle-title {
              font-size: 36px;
              font-weight: bold;
              color: #111111;
              margin-bottom: 8px;
              line-height: 1.2;
            }
            .vehicle-year {
              font-size: 24px;
              color: #666666;
              margin-bottom: 20px;
            }
            .price {
              font-size: 56px;
              font-weight: bold;
              color: #D10000;
              margin: 20px 0;
              text-align: center;
              padding: 20px;
              background: #FFF5F5;
              border-radius: 12px;
              border: 2px dashed #D10000;
            }
            .specs-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin: 30px 0;
            }
            .spec-item {
              padding: 16px;
              background: #F9F9F9;
              border-radius: 8px;
              border-left: 4px solid #D10000;
            }
            .spec-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #666666;
              font-weight: 600;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .spec-value {
              font-size: 20px;
              font-weight: bold;
              color: #111111;
            }
            .features {
              margin: 30px 0;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              color: #111111;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #D10000;
            }
            .features-list {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            .feature-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: #444444;
            }
            .feature-bullet {
              width: 8px;
              height: 8px;
              background: #D10000;
              border-radius: 50%;
              flex-shrink: 0;
            }
            .description {
              margin: 20px 0;
              padding: 20px;
              background: #F9F9F9;
              border-radius: 8px;
              color: #444444;
              font-size: 14px;
              line-height: 1.6;
            }
            .warranty {
              margin: 20px 0;
              padding: 16px;
              background: #FFF5F5;
              border: 2px solid #D10000;
              border-radius: 8px;
              text-align: center;
            }
            .warranty-icon {
              font-size: 18px;
              font-weight: bold;
              color: #D10000;
              margin-bottom: 8px;
            }
            .warranty-text {
              font-size: 16px;
              color: #111111;
              font-weight: 600;
            }
            .footer {
              background: #111111;
              color: white;
              padding: 24px 30px;
              text-align: center;
            }
            .contact-info {
              font-size: 16px;
              line-height: 1.6;
            }
            .contact-highlight {
              font-size: 20px;
              font-weight: bold;
              color: #D10000;
              margin-top: 8px;
            }
            @media print {
              body {
                padding: 0;
              }
              .sales-sheet {
                border: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="sales-sheet">
            <div class="header">
              <div class="logo">${siteConfig.name}</div>
              <div class="tagline">Votre spécialiste moto & scooter</div>
            </div>

            ${imageHTML}

            <div class="content">
              <h1 class="vehicle-title">
                ${vehicle.brand} ${vehicle.model}
              </h1>
              <div class="vehicle-year">${vehicle.year}</div>

              <div class="price">${formatPrice(vehicle.price)}</div>

              <div class="specs-grid">
                <div class="spec-item">
                  <div class="spec-label">Kilométrage</div>
                  <div class="spec-value">${formatMileage(vehicle.mileage)}</div>
                </div>
                <div class="spec-item">
                  <div class="spec-label">Cylindrée</div>
                  <div class="spec-value">${vehicle.displacement} cc</div>
                </div>
                <div class="spec-item">
                  <div class="spec-label">Type</div>
                  <div class="spec-value" style="text-transform: capitalize;">
                    ${vehicle.type}
                  </div>
                </div>
                <div class="spec-item">
                  <div class="spec-label">État</div>
                  <div class="spec-value">
                    ${conditionLabels[vehicle.condition] || vehicle.condition}
                  </div>
                </div>
              </div>

              ${featuresHTML}

              ${descriptionHTML}

              ${warrantyHTML}
            </div>

            <div class="footer">
              <div class="contact-info">
                77 Rue d'Argenteuil - Asnières sur Seine
                <br />
                Tél: ${siteConfig.contact.phone} | Email: ${siteConfig.contact.email}
              </div>
              <div class="contact-highlight">Visitez-nous ou contactez-nous !</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePrint}
      className="flex items-center gap-2"
    >
      <Printer className="w-4 h-4" />
      Générer la fiche de vente
    </Button>
  );
}
