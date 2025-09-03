// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";
import AppQueryProvider from "./lib/queryClient";
import { BrowserRouter } from "react-router-dom";
// Explicit import order to ensure Preflight (base) -> tokens -> components/utilities -> overrides
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppQueryProvider>
        <AuthProvider>
          <Web3Provider>
            <App />
          </Web3Provider>
        </AuthProvider>
      </AppQueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
