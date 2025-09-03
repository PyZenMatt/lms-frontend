// src/pages/HomePage.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Benvenuto</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Usa i link qui sotto per provare i flussi:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li><Link className="underline" to="/wallet">Wallet</Link></li>
        <li>
          <Link className="underline" to="/checkout/1?title=Corso%20Disegno&price=49.00">
            Checkout (Corso Disegno — €49.00)
          </Link>
        </li>
      </ul>
    </div>
  );
}
