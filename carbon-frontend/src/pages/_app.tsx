// pages/_app.tsx
import "@/styles/globals.css"; // Pastikan path ini benar
import type { AppProps } from "next/app";
import { AuthProvider } from '@/contexts/AuthContext'; // Pastikan path ini benar

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}