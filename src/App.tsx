import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import PublicOnlyRoute from "./features/auth/components/PublicOnlyRoute";
import NotFound from "./pages/OtherPage/NotFound";
import AppLoader from "./components/common/AppLoader";

const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const SignIn = lazy(() => import("./features/auth/pages/SignIn"));
const SignUp = lazy(() => import("./features/auth/pages/SignUp"));
const DashboardPage = lazy(() => import("./features/dashboard/pages/DashboardPage"));
const ProductsPage = lazy(() => import("./features/products/pages/ProductsPage"));
const ProductEditorPage = lazy(() => import("./features/products/pages/ProductEditorPage"));
const CategoriesPage = lazy(() => import("./features/categories/pages/CategoriesPage"));
const CategoryDetailsPage = lazy(() => import("./features/categories/pages/CategoryDetailsPage"));
const CategoryProductsPage = lazy(() => import("./features/categories/pages/CategoryProductsPage"));
const SubCategoriesPage = lazy(() => import("./features/sub-categories/pages/SubCategoriesPage"));
const SubCategoryDetailsPage = lazy(() => import("./features/sub-categories/pages/SubCategoryDetailsPage"));
const BrandsPage = lazy(() => import("./features/brands/pages/BrandsPage"));
const BrandDetailsPage = lazy(() => import("./features/brands/pages/BrandDetailsPage"));
const SizesPage = lazy(() => import("./features/sizes/pages/SizesPage"));
const InventoryPage = lazy(() => import("./features/inventory/pages/InventoryPage"));
const InventoryDetailsPage = lazy(() => import("./features/inventory/pages/InventoryDetailsPage"));
const OrdersPage = lazy(() => import("./features/orders/pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./features/orders/pages/OrderDetailPage"));
const ReturnsPage = lazy(() => import("./features/returns/pages/ReturnsPage"));
const ReturnDetailPage = lazy(() => import("./features/returns/pages/ReturnDetailPage"));
const PaymentsPage = lazy(() => import("./features/payments/pages/PaymentsPage"));
const CouponsPage = lazy(() => import("./features/coupons/pages/CouponsPage"));
const CustomersPage = lazy(() => import("./features/customers/pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./features/customers/pages/CustomerDetailPage"));
const ReviewsPage = lazy(() => import("./features/reviews/pages/ReviewsPage"));
const UsersPage = lazy(() => import("./features/users/pages/UsersPage"));
const UserDetailPage = lazy(() => import("./features/users/pages/UserDetailPage"));
const RolesPage = lazy(() => import("./features/roles/pages/RolesPage"));
const RoleDetailPage = lazy(() => import("./features/roles/pages/RoleDetailPage"));
const PermissionsPage = lazy(() => import("./features/permissions/pages/PermissionsPage"));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const ProfilePage = lazy(() => import("./features/profile/pages/ProfilePage"));
const SecurityPage = lazy(() => import("./features/profile/pages/SecurityPage"));
const DevicesPage = lazy(() => import("./features/profile/pages/DevicesPage"));

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<AppLoader message="Starting your store…" />}>
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
            <Route index path="/" element={<DashboardPage />} />
            <Route path="/catalog/products" element={<ProductsPage />} />
            <Route path="/catalog/products/new" element={<ProductEditorPage />} />
            <Route path="/catalog/products/:id" element={<ProductEditorPage />} />
            <Route path="/catalog/categories" element={<CategoriesPage />} />
            <Route path="/catalog/categories/:id" element={<CategoryDetailsPage />} />
            <Route path="/catalog/categories/:id/products" element={<CategoryProductsPage />} />
            <Route path="/catalog/browse" element={<CategoryProductsPage />} />
            <Route path="/catalog/browse/:id" element={<CategoryProductsPage />} />
            <Route path="/catalog/sub-categories" element={<SubCategoriesPage />} />
            <Route path="/catalog/sub-categories/:id" element={<SubCategoryDetailsPage />} />
            <Route path="/catalog/brands" element={<BrandsPage />} />
            <Route path="/catalog/brands/:id" element={<BrandDetailsPage />} />
            <Route path="/catalog/sizes" element={<SizesPage />} />
            <Route path="/catalog/inventory" element={<InventoryPage />} />
            <Route path="/catalog/inventory/:variantId" element={<InventoryDetailsPage />} />

            <Route path="/sales/orders" element={<OrdersPage />} />
            <Route path="/sales/orders/:id" element={<OrderDetailPage />} />
            <Route path="/sales/returns" element={<ReturnsPage />} />
            <Route path="/sales/returns/:id" element={<ReturnDetailPage />} />
            <Route path="/sales/returns/:returnNumber" element={<ReturnDetailPage />} />
            <Route path="/sales/payments" element={<PaymentsPage />} />
            <Route path="/sales/coupons" element={<CouponsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/reviews" element={<ReviewsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/system/users" element={<UsersPage />} />
            <Route path="/system/users/:id" element={<UserDetailPage />} />
            <Route path="/system/roles" element={<RolesPage />} />
            <Route path="/system/roles/:id" element={<RoleDetailPage />} />
            <Route path="/system/permissions" element={<PermissionsPage />} />
            <Route path="/system/settings" element={<SettingsPage />} />

            {/* Others Page */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/security" element={<SecurityPage />} />
            <Route path="/profile/security/devices" element={<DevicesPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/auth/login" element={<SignIn />} />
            <Route path="/auth/register" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}
