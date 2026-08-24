import type { Metadata } from "next";
import { Overlock } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
// import AdminLayout from "./components/layout/AdminLayout";

// the same two faces the public site uses. the blog preview renders in them so
// what an editor sees matches what a visitor gets, the panel chrome keeps its
// own default
const overlock = Overlock({
  variable: "--font-overlock",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const optimusPrinceps = localFont({
  variable: "--font-optimus-princeps",
  src: [
    { path: "./fonts/OptimusPrinceps.ttf", weight: "400", style: "normal" },
    {
      path: "./fonts/OptimusPrincepsSemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "India Gate CMS",
  description: "Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${overlock.variable} ${optimusPrinceps.variable}`}
    >
      <body>
        <AuthProvider>
          <Toaster position="top-right" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
