// src/pages/CheckoutRoute.tsx
import React from "react";
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CheckoutPage from "@/pages/CheckoutPage";

function parsePrice(v: string | null) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function CheckoutRoute() {
  const { courseId } = useParams<{ courseId: string }>();
  const [sp] = useSearchParams();
  const courseTitle = sp.get("title") || "Corso";
  const priceEUR = useMemo(() => parsePrice(sp.get("price")) || 0, [sp]);
  // TODO: sostituire con address reale da web3/auth
  const studentAddress =
    localStorage.getItem("studentAddress") ||
    "0x0000000000000000000000000000000000000000";

  return (
    <CheckoutPage
      courseId={Number(courseId)}
      courseTitle={courseTitle}
      priceEUR={priceEUR}
      studentAddress={studentAddress}
      onProceed={(res) => {
        // Hook per Stripe/altro pagamento dopo applicazione sconto
        console.debug("Hybrid/Intent response:", res);
      }}
    />
  );
}
