import "@/styles/globals.css";
import type { AppProps } from "next/app";
import 'leaflet/dist/leaflet.css'; 
import { AuthProvider } from '@/contexts/AuthContext';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], 
  variable: '--font-poppins',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className={`${poppins.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}