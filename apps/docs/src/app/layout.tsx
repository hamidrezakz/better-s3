import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Geist, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontSans = Geist({
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(fontSans.className, "font-sans", inter.variable)}
      suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          theme={{
            enabled: true,
          }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
