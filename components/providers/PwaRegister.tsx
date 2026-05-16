"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { registrarPushApi } from "@/lib/api/client";

export default function PwaRegister() {
  const ciudadano = useAppStore((s) => s.ciudadano);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);

  useEffect(() => {
    if (!ciudadano || !("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    async function subscribe() {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
              "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
          ),
        }));

      await registrarPushApi(ciudadano!.telefono, sub.toJSON());
    }

    void subscribe().catch(() => {
      /* push opcional en MVP */
    });
  }, [ciudadano]);

  return null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
