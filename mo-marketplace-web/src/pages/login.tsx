import { useState } from "react";
import { login } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await login({ email, password });

    setAccessToken(res.data.accessToken);
    navigate("/products");
  };

  return (
    <>
      <input onChange={(e) => setEmail(e.target.value)} />
      <input type="password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </>
  );
};
