import { Route, Routes, Navigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout.jsx";
import { ProtectedRoute } from "../components/layout/ProtectedRoute.jsx";
import { OAuthCallbackPage } from "../pages/auth/OAuthCallbackPage.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { CatalogPage } from "../pages/CatalogPage.jsx";
import { CategoryPage } from "../pages/CategoryPage.jsx";
import { ProductPage } from "../pages/ProductPage.jsx";
import { SearchPage } from "../pages/SearchPage.jsx";
import { PromotionsPage } from "../pages/PromotionsPage.jsx";
import { CartPage } from "../pages/CartPage.jsx";
import { CheckoutPage } from "../pages/checkout/CheckoutPage.jsx";
import { PaymentPage } from "../pages/checkout/PaymentPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage.jsx";
import { AccountPage } from "../pages/account/AccountPage.jsx";
import { OrdersPage } from "../pages/account/OrdersPage.jsx";
import { OrderDetailPage } from "../pages/account/OrderDetailPage.jsx";
import { NotFoundPage } from "../pages/errors/NotFoundPage.jsx";

// Admin imports
import { AdminLayout } from "../components/admin/AdminLayout.jsx";
import { ProtectedAdminRoute } from "../components/admin/ProtectedAdminRoute.jsx";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage.jsx";
import { AdminForgotPasswordPage } from "../pages/admin/AdminForgotPasswordPage.jsx";
import { AdminResetPasswordPage } from "../pages/admin/AdminResetPasswordPage.jsx";
import { DashboardPage } from "../pages/admin/DashboardPage.jsx";
import { ProductsListPage } from "../pages/admin/products/ProductsListPage.jsx";
import { ProductFormPage } from "../pages/admin/products/ProductFormPage.jsx";
import { CampaignsListPage } from "../pages/admin/campaigns/CampaignsListPage.jsx";
import { CampaignFormPage } from "../pages/admin/campaigns/CampaignFormPage.jsx";
import { SiteTextsPage } from "../pages/admin/site-texts/SiteTextsPage.jsx";
import { BannersPage } from "../pages/admin/banners/BannersPage.jsx";
import { ReportsPage } from "../pages/admin/reports/ReportsPage.jsx";
import { OrdersListPage } from "../pages/admin/orders/OrdersListPage.jsx";
import { OrderDetailAdminPage } from "../pages/admin/orders/OrderDetailAdminPage.jsx";
import { ReviewsPage } from "../pages/admin/reviews/ReviewsPage.jsx";
import { ContactsPage } from "../pages/admin/contacts/ContactsPage.jsx";
import { PreviewPage } from "../pages/admin/PreviewPage.jsx";
import { PlacementPage } from "../pages/admin/placement/PlacementPage.jsx";

export const App = () => (
  <Routes>
    {/* ------------------------------------------------------------------ */}
    {/* Customer-facing site                                                 */}
    {/* ------------------------------------------------------------------ */}
    <Route element={<MainLayout />} path="/">
      <Route index element={<HomePage />} />
      <Route element={<CatalogPage />} path="produtos" />
      <Route element={<CategoryPage />} path="categoria/:slug" />
      <Route element={<ProductPage />} path="produto/:slug" />
      <Route element={<SearchPage />} path="pesquisa" />
      <Route element={<PromotionsPage />} path="promocoes" />
      <Route element={<CartPage />} path="carrinho" />
      <Route element={<LoginPage />} path="login" />
      <Route element={<RegisterPage />} path="registo" />
      <Route element={<OAuthCallbackPage />} path="oauth/callback" />
      <Route element={<ForgotPasswordPage />} path="recuperar-conta" />
      <Route element={<ResetPasswordPage />} path="repor-palavra-passe" />

      <Route element={<ProtectedRoute roles={["customer", "admin"]} />}>
        <Route element={<CheckoutPage />} path="checkout" />
        <Route element={<PaymentPage />} path="metodos-pagamento" />
        <Route element={<AccountPage />} path="conta" />
        <Route element={<OrdersPage />} path="conta/pedidos" />
        <Route element={<OrderDetailPage />} path="conta/pedidos/:id" />
      </Route>

      <Route element={<NotFoundPage />} path="404" />
      <Route element={<NotFoundPage />} path="*" />
    </Route>

    {/* ------------------------------------------------------------------ */}
    {/* Admin — public auth pages (no layout wrapping)                       */}
    {/* ------------------------------------------------------------------ */}
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin/recuperar" element={<AdminForgotPasswordPage />} />
    <Route path="/admin/repor-senha" element={<AdminResetPasswordPage />} />

    {/* ------------------------------------------------------------------ */}
    {/* Admin — protected panel                                              */}
    {/* ------------------------------------------------------------------ */}
    <Route path="/admin" element={<ProtectedAdminRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate replace to="/admin/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Products */}
        <Route path="produtos" element={<ProductsListPage />} />
        <Route path="produtos/novo" element={<ProductFormPage />} />
        <Route path="produtos/:id" element={<ProductFormPage />} />

        {/* Campaigns */}
        <Route path="campanhas" element={<CampaignsListPage />} />
        <Route path="campanhas/nova" element={<CampaignFormPage />} />
        <Route path="campanhas/:id" element={<CampaignFormPage />} />

        {/* CMS */}
        <Route path="textos" element={<SiteTextsPage />} />
        <Route path="banners" element={<BannersPage />} />

        {/* Orders */}
        <Route path="encomendas" element={<OrdersListPage />} />
        <Route path="encomendas/:id" element={<OrderDetailAdminPage />} />

        {/* Reviews */}
        <Route path="avaliacoes" element={<ReviewsPage />} />

        {/* Contacts */}
        <Route path="contactos" element={<ContactsPage />} />

        {/* Reports */}
        <Route path="relatorios" element={<ReportsPage />} />

        {/* Placement */}
        <Route path="colocacao" element={<PlacementPage />} />

        {/* Preview */}
        <Route path="preview" element={<PreviewPage />} />

        {/* Catch-all inside admin */}
        <Route path="*" element={<Navigate replace to="/admin/dashboard" />} />
      </Route>
    </Route>
  </Routes>
);
