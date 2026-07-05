import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/lib/auth-context";
import { syncNow } from "@/lib/dataSync";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

// Sync data from server (silent fail if server offline — app works standalone)
syncNow().then((synced) => {
  if (synced) console.log("[Sync] Shared storage connected: data syncs across all devices");
});

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
