import { useRef } from 'react';
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
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = sheetRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
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
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fiche de vente - ${vehicle.brand} ${vehicle.model}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const conditionLabels: Record<string, string> = {
    excellent: 'Excellent',
    bon: 'Bon',
    correct: 'Correct',
    'a-reviser': 'À réviser',
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handlePrint}
        className="flex items-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Générer la fiche de vente
      </Button>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div ref={sheetRef} className="sales-sheet">
          <div className="header">
            <div className="logo">{siteConfig.name}</div>
            <div className="tagline">Votre spécialiste moto & scooter</div>
          </div>

          {vehicle.images.length > 0 && (
            <img
              src={vehicle.images[0].url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="vehicle-image"
            />
          )}

          <div className="content">
            <h1 className="vehicle-title">
              {vehicle.brand} {vehicle.model}
            </h1>
            <div className="vehicle-year">{vehicle.year}</div>

            <div className="price">{formatPrice(vehicle.price)}</div>

            <div className="specs-grid">
              <div className="spec-item">
                <div className="spec-label">Kilométrage</div>
                <div className="spec-value">{formatMileage(vehicle.mileage)}</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Cylindrée</div>
                <div className="spec-value">{vehicle.displacement} cc</div>
              </div>
              <div className="spec-item">
                <div className="spec-label">Type</div>
                <div className="spec-value" style={{ textTransform: 'capitalize' }}>
                  {vehicle.type}
                </div>
              </div>
              <div className="spec-item">
                <div className="spec-label">État</div>
                <div className="spec-value">
                  {conditionLabels[vehicle.condition] || vehicle.condition}
                </div>
              </div>
            </div>

            {vehicle.features.length > 0 && (
              <div className="features">
                <h2 className="section-title">Équipements</h2>
                <div className="features-list">
                  {vehicle.features.slice(0, 8).map((feature, index) => (
                    <div key={index} className="feature-item">
                      <span className="feature-bullet"></span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vehicle.description && (
              <div>
                <h2 className="section-title">Description</h2>
                <div className="description">{vehicle.description}</div>
              </div>
            )}

            {vehicle.warranty && (
              <div className="warranty">
                <div className="warranty-icon">🛡️ GARANTIE</div>
                <div className="warranty-text">{vehicle.warranty}</div>
              </div>
            )}
          </div>

          <div className="footer">
            <div className="contact-info">
              77 Rue d'Argenteuil - Asnières sur Seine
              <br />
              Tél: {siteConfig.contact.phone} | Email: {siteConfig.contact.email}
            </div>
            <div className="contact-highlight">Visitez-nous ou contactez-nous !</div>
          </div>
        </div>
      </div>
    </>
  );
}
