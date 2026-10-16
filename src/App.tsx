import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CookieBanner } from './components/CookieBanner';
import { DegradeOrDefs } from './components/ui/DegradeOrDefs';
import { Home } from './pages/Home';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { TradeIn } from './pages/TradeIn';
import { VendreMaMoto } from './pages/VendreMaMoto';
import { Financing } from './pages/Financing';
import { CustomSearch } from './pages/CustomSearch';
import { Contact } from './pages/Contact';
import { LegalNotice } from './pages/LegalNotice';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { Sitemap } from './pages/Sitemap';
import { NotFound } from './pages/NotFound';
// Espace admin et dossier de financement chargés à la demande : ils ne pèsent
// plus sur le chargement des pages publiques (vitesse = référencement).
const nomme = <K extends string>(charger: () => Promise<Record<K, React.ComponentType>>, nom: K) =>
  lazy(() => charger().then((m) => ({ default: m[nom] })));
const FinancingProfile = nomme(() => import('./pages/FinancingProfile'), 'FinancingProfile');
const Equipe = nomme(() => import('./pages/Equipe'), 'Equipe');
const AdminLogin = nomme(() => import('./pages/admin/AdminLogin'), 'AdminLogin');
const AdminDashboard = nomme(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const VehiclesList = nomme(() => import('./pages/admin/VehiclesList'), 'VehiclesList');
const VehicleForm = nomme(() => import('./pages/admin/VehicleForm'), 'VehicleForm');
const SubmissionsList = lazy(() => import('./pages/admin/SubmissionsList'));
const FinancingProfilesList = lazy(() => import('./pages/admin/FinancingProfilesList'));
const SalesFoldersList = nomme(() => import('./pages/admin/SalesFoldersList'), 'SalesFoldersList');
const SalesFolderForm = nomme(() => import('./pages/admin/SalesFolderForm'), 'SalesFolderForm');
const DepotDemandesList = nomme(() => import('./pages/admin/DepotDemandesList'), 'DepotDemandesList');
const SalesFolderDetails = nomme(() => import('./pages/admin/SalesFolderDetails'), 'SalesFolderDetails');

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-fond" aria-busy="true" />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <ProtectedRoute>
                <VehiclesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles/new"
            element={
              <ProtectedRoute>
                <VehicleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles/edit/:id"
            element={
              <ProtectedRoute>
                <VehicleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute>
                <SubmissionsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financing-profiles"
            element={
              <ProtectedRoute>
                <FinancingProfilesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/depot-vente"
            element={
              <ProtectedRoute>
                <DepotDemandesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-folders"
            element={
              <ProtectedRoute>
                <SalesFoldersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-folders/new"
            element={
              <ProtectedRoute>
                <SalesFolderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-folders/edit/:id"
            element={
              <ProtectedRoute>
                <SalesFolderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales-folders/:id"
            element={
              <ProtectedRoute>
                <SalesFolderDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="site min-h-screen flex flex-col">
                <DegradeOrDefs />
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/vehicules" element={<Vehicles />} />
                    <Route path="/vehicules/:slug" element={<VehicleDetail />} />
                    <Route path="/reprises" element={<TradeIn />} />
                    <Route path="/vendre-ma-moto" element={<VendreMaMoto />} />
                    <Route path="/financement" element={<Financing />} />
                    <Route path="/financement/dossier" element={<FinancingProfile />} />
                    <Route path="/recherche-personnalisee" element={<CustomSearch />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/mentions-legales" element={<LegalNotice />} />
                    <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
                    <Route path="/politique-cookies" element={<CookiePolicy />} />
                    <Route path="/plan-du-site" element={<Sitemap />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <CookieBanner />
              </div>
            }
          />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
