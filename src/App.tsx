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
import { Financing } from './pages/Financing';
import { FinancingProfile } from './pages/FinancingProfile';
import { CustomSearch } from './pages/CustomSearch';
import { Contact } from './pages/Contact';
import { LegalNotice } from './pages/LegalNotice';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { Sitemap } from './pages/Sitemap';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { VehiclesList } from './pages/admin/VehiclesList';
import { VehicleForm } from './pages/admin/VehicleForm';
import SubmissionsList from './pages/admin/SubmissionsList';
import FinancingProfilesList from './pages/admin/FinancingProfilesList';
import { SalesFoldersList } from './pages/admin/SalesFoldersList';
import { SalesFolderForm } from './pages/admin/SalesFolderForm';
import { SalesFolderDetails } from './pages/admin/SalesFolderDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
                    <Route path="/financement" element={<Financing />} />
                    <Route path="/financement/dossier" element={<FinancingProfile />} />
                    <Route path="/recherche-personnalisee" element={<CustomSearch />} />
                    <Route path="/contact" element={<Contact />} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
