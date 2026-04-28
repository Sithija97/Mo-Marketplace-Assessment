import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login, ProductDetail, ProductList, Profile, Register } from "./pages";
import { AdminRoute, PrivateRoute, ProtectedLayout } from "./components";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<PrivateRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route element={<AdminRoute />}>
              {/* Create product is now handled by the drawer on /products */}
            </Route>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/products" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
