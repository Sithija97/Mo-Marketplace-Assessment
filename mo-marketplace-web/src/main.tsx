import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppWrapper from "./AppWrapper.tsx";
import { Toaster } from "./components";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper />
    <Toaster position="top-right" />
  </StrictMode>,
);
