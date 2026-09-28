"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4500,
          style: { fontSize: "1.05rem", fontWeight: 600, borderRadius: "1rem", padding: "14px 18px", maxWidth: 480 },
          success: { iconTheme: { primary: "#059669", secondary: "#fff" } },
        }}
      />
    </SessionProvider>
  );
}
