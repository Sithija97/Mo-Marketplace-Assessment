import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  CreateProduct,
  Login,
  ProductDetail,
  ProductList,
  Profile,
  Register,
} from "./pages";
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
              <Route path="/products/create" element={<CreateProduct />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* <Route path="/profile" element={<Profile />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/create" element={<CreateProduct />} /> */}
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/products" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
