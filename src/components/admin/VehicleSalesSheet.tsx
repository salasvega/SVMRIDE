import { useState } from 'react';
import { Printer, X } from 'lucide-react';
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
  const [showModal, setShowModal] = useState(false);

  const conditionLabels: Record<string, string> = {
    excellent: 'Excellent',
    bon: 'Bon',
    correct: 'Correct',
    'a-reviser': 'À réviser',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Générer la fiche de vente
      </Button>

      {showModal && (
        <>
          <style>{`
            @media print {
              .no-print {
                display: none !important;
              }

              body * {
                visibility: hidden;
              }

              .sales-sheet-print,
              .sales-sheet-print * {
                visibility: visible;
              }

              .sales-sheet-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }

            .sales-sheet-header {
              background: linear-gradient(135deg, #D10000 0%, #A00000 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-top-left-radius: 16px;
              border-top-right-radius: 16px;
            }

            .sales-sheet-logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 8px;
              letter-spacing: 2px;
            }

            .sales-sheet-tagline {
              font-size: 14px;
              opacity: 0.9;
            }

            .sales-sheet-image {
              width: 100%;
              height: 350px;
              object-fit: cover;
              border-bottom: 3px solid #D10000;
            }

            .sales-sheet-content {
              padding: 30px;
            }

            .sales-sheet-title {
              font-size: 36px;
              font-weight: bold;
              color: #111111;
              margin-bottom: 8px;
              line-height: 1.2;
            }

            .sales-sheet-year {
              font-size: 24px;
              color: #666666;
              margin-bottom: 20px;
            }

            .sales-sheet-price {
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

            .sales-sheet-specs {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin: 30px 0;
            }

            .sales-sheet-spec-item {
              padding: 16px;
              background: #F9F9F9;
              border-radius: 8px;
              border-left: 4px solid #D10000;
            }

            .sales-sheet-spec-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #666666;
              font-weight: 600;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }

            .sales-sheet-spec-value {
              font-size: 20px;
              font-weight: bold;
              color: #111111;
            }

            .sales-sheet-section {
              margin: 30px 0;
            }

            .sales-sheet-section-title {
              font-size: 20px;
              font-weight: bold;
              color: #111111;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #D10000;
            }

            .sales-sheet-features {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }

            .sales-sheet-feature-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: #444444;
            }

            .sales-sheet-feature-bullet {
              width: 8px;
              height: 8px;
              background: #D10000;
              border-radius: 50%;
              flex-shrink: 0;
            }

            .sales-sheet-description {
              margin: 20px 0;
              padding: 20px;
              background: #F9F9F9;
              border-radius: 8px;
              color: #444444;
              font-size: 14px;
              line-height: 1.6;
            }

            .sales-sheet-warranty {
              margin: 20px 0;
              padding: 16px;
              background: #FFF5F5;
              border: 2px solid #D10000;
              border-radius: 8px;
              text-align: center;
            }

            .sales-sheet-warranty-icon {
              font-size: 18px;
              font-weight: bold;
              color: #D10000;
              margin-bottom: 8px;
            }

            .sales-sheet-warranty-text {
              font-size: 16px;
              color: #111111;
              font-weight: 600;
            }

            .sales-sheet-footer {
              background: #111111;
              color: white;
              padding: 24px 30px;
              text-align: center;
              border-bottom-left-radius: 16px;
              border-bottom-right-radius: 16px;
            }

            .sales-sheet-contact-info {
              font-size: 16px;
              line-height: 1.6;
            }

            .sales-sheet-contact-highlight {
              font-size: 20px;
              font-weight: bold;
              color: #D10000;
              margin-top: 8px;
            }
          `}</style>

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  Aperçu de la fiche de vente
                </h2>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </Button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="sales-sheet-print mx-auto bg-white border-4 border-[#D10000] rounded-2xl overflow-hidden" style={{ maxWidth: '210mm' }}>
                  <div className="sales-sheet-header">
                    <div className="sales-sheet-logo">{siteConfig.name}</div>
                    <div className="sales-sheet-tagline">Votre spécialiste moto & scooter</div>
                  </div>

                  {vehicle.images.length > 0 && (
                    <img
                      src={vehicle.images[0].url}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="sales-sheet-image"
                    />
                  )}

                  <div className="sales-sheet-content">
                    <h1 className="sales-sheet-title">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <div className="sales-sheet-year">{vehicle.year}</div>

                    <div className="sales-sheet-price">{formatPrice(vehicle.price)}</div>

                    <div className="sales-sheet-specs">
                      <div className="sales-sheet-spec-item">
                        <div className="sales-sheet-spec-label">Kilométrage</div>
                        <div className="sales-sheet-spec-value">{formatMileage(vehicle.mileage)}</div>
                      </div>

                      <div className="sales-sheet-spec-item">
                        <div className="sales-sheet-spec-label">Cylindrée</div>
                        <div className="sales-sheet-spec-value">{vehicle.displacement} cc</div>
                      </div>

                      <div className="sales-sheet-spec-item">
                        <div className="sales-sheet-spec-label">Type</div>
                        <div className="sales-sheet-spec-value" style={{ textTransform: 'capitalize' }}>
                          {vehicle.type}
                        </div>
                      </div>

                      <div className="sales-sheet-spec-item">
                        <div className="sales-sheet-spec-label">État</div>
                        <div className="sales-sheet-spec-value">
                          {conditionLabels[vehicle.condition] || vehicle.condition}
                        </div>
                      </div>
                    </div>

                    {vehicle.features.length > 0 && (
                      <div className="sales-sheet-section">
                        <h2 className="sales-sheet-section-title">Équipements</h2>
                        <div className="sales-sheet-features">
                          {vehicle.features.slice(0, 8).map((feature, index) => (
                            <div key={index} className="sales-sheet-feature-item">
                              <span className="sales-sheet-feature-bullet"></span>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {vehicle.description && (
                      <div className="sales-sheet-section">
                        <h2 className="sales-sheet-section-title">Description</h2>
                        <div className="sales-sheet-description">{vehicle.description}</div>
                      </div>
                    )}

                    {vehicle.warranty && (
                      <div className="sales-sheet-warranty">
                        <div className="sales-sheet-warranty-icon">🛡️ GARANTIE</div>
                        <div className="sales-sheet-warranty-text">{vehicle.warranty}</div>
                      </div>
                    )}
                  </div>

                  <div className="sales-sheet-footer">
                    <div className="sales-sheet-contact-info">
                      77 Rue d'Argenteuil - Asnières sur Seine
                      <br />
                      Tél: {siteConfig.contact.phone} | Email: {siteConfig.contact.email}
                    </div>
                    <div className="sales-sheet-contact-highlight">
                      Visitez-nous ou contactez-nous !
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
