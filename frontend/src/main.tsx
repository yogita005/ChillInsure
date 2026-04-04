import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clean up service workers to prevent caching issues in development
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
