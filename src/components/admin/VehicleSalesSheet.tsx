import { useState } from 'react';
import { createPortal } from 'react-dom';
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

  const SheetContent = () => (
    <div style={{ maxWidth: '210mm', margin: '0 auto' }}>
      {vehicle.images.length > 0 && (
        <img
          src={vehicle.images[0].url}
          alt={`${vehicle.brand} ${vehicle.model}`}
          style={{ width: '100%', height: '220px', objectFit: 'cover', borderBottom: '3px solid #D10000', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
        />
      )}

      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111111', marginBottom: '3px', lineHeight: 1.2 }}>
          {vehicle.brand} {vehicle.model}
        </h1>
        <div style={{ fontSize: '18px', color: '#666666', marginBottom: '10px' }}>
          {vehicle.year}
        </div>

        <div style={{
          fontSize: '38px',
          fontWeight: 'bold',
          color: '#D10000',
          margin: '10px 0',
          textAlign: 'center',
          padding: '10px',
          background: '#FFF5F5',
          borderRadius: '12px',
          border: '2px dashed #D10000'
        }}>
          {formatPrice(vehicle.price)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '12px 0' }}>
          <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px', borderLeft: '4px solid #D10000' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, marginBottom: '2px' }}>
              Kilométrage
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111111' }}>
              {formatMileage(vehicle.mileage)}
            </div>
          </div>

          <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px', borderLeft: '4px solid #D10000' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, marginBottom: '2px' }}>
              Cylindrée
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111111' }}>
              {vehicle.displacement} cc
            </div>
          </div>

          <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px', borderLeft: '4px solid #D10000' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, marginBottom: '2px' }}>
              Type
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111111', textTransform: 'capitalize' }}>
              {vehicle.type}
            </div>
          </div>

          <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px', borderLeft: '4px solid #D10000' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666666', fontWeight: 600, marginBottom: '2px' }}>
              État
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111111' }}>
              {conditionLabels[vehicle.condition] || vehicle.condition}
            </div>
          </div>
        </div>

        {vehicle.features.length > 0 && (
          <div style={{ margin: '12px 0' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111111',
              marginBottom: '8px',
              paddingBottom: '5px',
              borderBottom: '2px solid #D10000'
            }}>
              Équipements
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '5px' }}>
              {vehicle.features.slice(0, 8).map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#444444' }}>
                  <span style={{ width: '5px', height: '5px', background: '#D10000', borderRadius: '50%' }}></span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        {vehicle.description && (
          <div style={{ margin: '12px 0' }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#111111',
              marginBottom: '8px',
              paddingBottom: '5px',
              borderBottom: '2px solid #D10000'
            }}>
              Description
            </h2>
            <div style={{ padding: '10px', background: '#F9F9F9', borderRadius: '8px', color: '#444444', fontSize: '12px', lineHeight: 1.4 }}>
              {vehicle.description}
            </div>
          </div>
        )}

        {vehicle.warranty && (
          <div style={{
            margin: '10px 0',
            padding: '8px',
            background: '#FFF5F5',
            border: '2px solid #D10000',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#D10000', marginBottom: '3px' }}>
              🛡️ GARANTIE
            </div>
            <div style={{ fontSize: '13px', color: '#111111', fontWeight: 600 }}>
              {vehicle.warranty}
            </div>
          </div>
        )}
      </div>

      <div style={{
        background: '#111111',
        color: 'white',
        padding: '12px 16px',
        textAlign: 'center',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px'
      }}>
        <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
          77 Rue d'Argenteuil - Asnières sur Seine | Tél: {siteConfig.contact.phone} | Email: {siteConfig.contact.email}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#D10000', marginTop: '4px' }}>
          Visitez-nous ou contactez-nous !
        </div>
      </div>
    </div>
  );

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
            @media screen {
              .sales-sheet-printable {
                display: none !important;
              }
            }

            @media print {
              body * {
                visibility: hidden !important;
              }

              .sales-sheet-printable,
              .sales-sheet-printable * {
                visibility: visible !important;
              }

              .sales-sheet-printable {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
              }
            }

            @page {
              size: A4;
              margin: 8mm;
            }
          `}</style>

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <div className="mx-auto bg-white border-4 border-[#D10000] rounded-2xl overflow-hidden">
                  <SheetContent />
                </div>
              </div>
            </div>
          </div>

          {createPortal(
            <div className="sales-sheet-printable">
              <div style={{ border: '4px solid #D10000', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
                <SheetContent />
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
