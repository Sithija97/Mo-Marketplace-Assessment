import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login, ProductList, Register } from "./pages";
import { PrivateRoute } from "./components";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<PrivateRoute />}>
          <Route path="/products" element={<ProductList />} />

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
