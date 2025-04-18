"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Auth, useTurnkey, TurnkeyProvider } from "@turnkey/sdk-react";
import "./index.css";
import { useRouter } from "next/navigation";
import Navbar from "./components/Navbar";
import { Toaster, toast } from "sonner";

interface SocialConfig {
  enabled: boolean;
  providers: {
    google: boolean;
    apple: boolean;
    facebook: boolean;
  };
}

interface Config {
  email: boolean;
  passkey: boolean;
  phone: boolean;
  wallet: boolean;
  socials: SocialConfig;
}

export default function AuthPage() {
  const router = useRouter();
  const { turnkey, authIframeClient } = useTurnkey();
  const [configOrder] = useState([
    "socials",
    "email",
    "phone",
    "passkey",
    "wallet",
  ]);

  const [config] = useState<Config>({
    email: true,
    phone: false,
    passkey: false,
    wallet: false,
    socials: {
      enabled: false,
      providers: {
        google: false,
        apple: false,
        facebook: false,
      },
    },
  });

  const handleAuthSuccess = async () => {
    router.push("/chat");
  };

  useEffect(() => {
    const manageSession = async () => {
      if (turnkey) {
        const session = await turnkey?.getSession();
        if (session && Date.now() < session.expiry) {
          router.push("/chat");
        }
        else {
          await turnkey?.logout();
        }
      }
    };
    manageSession();
  }, [turnkey, router]);

  const authConfig = {
    emailEnabled: config.email,
    passkeyEnabled: config.passkey,
    phoneEnabled: config.phone,
    walletEnabled: config.wallet,
    appleEnabled: config.socials.providers.apple,
    googleEnabled: config.socials.providers.google,
    facebookEnabled: config.socials.providers.facebook,
  };

  return (
    <TurnkeyProvider config={{
      apiBaseUrl: process.env.NEXT_PUBLIC_BASE_URL as string,
      defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID as string,
    }}>
      <main className="main">
        <Navbar />
        <div className="authComponent">
          <Auth
            authConfig={authConfig}
            configOrder={configOrder}
            onAuthSuccess={handleAuthSuccess}
            onError={(errorMessage: string) => toast.error(errorMessage)}
            customSmsMessage={"Your Turnkey Demo OTP is {{.OtpCode}}"}
          />
        </div>
        <div>
          <Toaster
            position="bottom-right"
            toastOptions={{ className: "sonner-toaster", duration: 2500 }}
          />
        </div>
      </main>
    </TurnkeyProvider>
  );
}