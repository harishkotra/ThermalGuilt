import type { Metadata } from "next";
import "@solana/wallet-adapter-react-ui/styles.css";
import { SolanaProvider } from "../components/solana-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thermal Guilt",
  description: "Peer pressure + AI + token rewards for HVAC efficiency"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
