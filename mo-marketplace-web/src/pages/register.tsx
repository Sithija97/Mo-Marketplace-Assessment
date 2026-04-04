import { useState } from "react";
import { register } from "../api/auth.api";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    await register({ email, password });
    alert("Registered!");
  };

  return (
    <>
      <input onChange={(e) => setEmail(e.target.value)} />
      <input type="password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSubmit}>Register</button>
    </>
  );
};
