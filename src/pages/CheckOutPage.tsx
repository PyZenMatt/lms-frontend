// src/pages/CheckoutPage.tsx
import React, { useMemo } from "react";
import TeoDiscountWidget from "@/components/teo/TeoDiscountWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showToast } from "@/lib/api";

type Props = {
  courseId: number;
  courseTitle: string;
  priceEUR: number;
  studentAddress: string;
  onProceed?: (payload: any) => void; // es. avvio Stripe
};

export default function CheckoutPage({ courseId, courseTitle, priceEUR, studentAddress, onProceed }: Props) {
  const priceStr = useMemo(() => `€ ${priceEUR.toFixed(2)}`, [priceEUR]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Checkout — {courseTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border p-4 text-sm dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>Prezzo corso</div>
              <div className="text-lg font-semibold">{priceStr}</div>
            </div>
          </div>

          <TeoDiscountWidget
            courseId={courseId}
            priceEUR={priceEUR}
            studentAddress={studentAddress}
            onApplied={(res) => {
              showToast({ variant: "success", title: "Step successivo", message: "Procedi con il pagamento." });
              onProceed?.(res);
            }}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 active:translate-y-px"
              onClick={() => showToast({ variant: "info", message: "Scegli un metodo di pagamento per concludere." })}
            >
              Continua
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
