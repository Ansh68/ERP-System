import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import "./App.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: "#ffffff",
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13.5px",
                    fontWeight: "500",
                    borderRadius: "8px",
                    padding: "12px 16px",
                },
                success: {
                    iconTheme: {
                        primary: "#10b981",
                        secondary: "#ffffff",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#ffffff",
                    },
                },
            }}
        />
    </StrictMode>
);
