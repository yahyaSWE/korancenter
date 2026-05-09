"use client";

import { useState } from "react";

type Props = {
  enrollmentId: string;
  courseTitle: string;
  isSubscription: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasStripeSubscription: boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

export default function SubscriptionCard({
  enrollmentId,
  courseTitle,
  isSubscription,
  subscriptionStatus,
  currentPeriodEnd,
  hasStripeSubscription,
}: Props) {
  const [canceling, setCanceling] = useState(false);
  const [canceled, setCanceled] = useState(subscriptionStatus === "cancel_at_period_end");
  const [error, setError] = useState("");

  const isCanceledAtEnd = canceled || subscriptionStatus === "cancel_at_period_end";
  const isPastDue = subscriptionStatus === "past_due";

  const handleCancel = async () => {
    if (!confirm(`Vill du avsluta prenumerationen på "${courseTitle}"? Du behåller tillgång till kursen till ${currentPeriodEnd ? fmtDate(currentPeriodEnd) : "periodens slut"}.`)) return;

    setCanceling(true);
    setError("");
    const res = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    });
    setCanceling(false);

    if (res.ok) {
      setCanceled(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Något gick fel");
    }
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${isPastDue ? "border-amber-200" : "border-gray-100"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">{courseTitle}</p>
          {isSubscription && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isCanceledAtEnd
                ? "bg-amber-50 text-amber-600"
                : isPastDue
                ? "bg-red-50 text-red-500"
                : "bg-green-50 text-green-600"
            }`}>
              {isCanceledAtEnd ? "Avslutas" : isPastDue ? "Betalning misslyckad" : "Aktiv prenumeration"}
            </span>
          )}
        </div>

        {isSubscription && currentPeriodEnd && (
          <p className="text-xs text-gray-500">
            {isCanceledAtEnd
              ? `Tillgång till och med ${fmtDate(currentPeriodEnd)}`
              : `Nästa betalning: ${fmtDate(currentPeriodEnd)}`}
          </p>
        )}

        {isPastDue && (
          <p className="text-xs text-amber-600 mt-0.5">
            Vänligen uppdatera din betalningsmetod i Stripe-portalen.
          </p>
        )}

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {isSubscription && hasStripeSubscription && !isCanceledAtEnd && !isPastDue && (
        <button
          onClick={handleCancel}
          disabled={canceling}
          className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
        >
          {canceling ? "Avslutar..." : "Avsluta prenumeration"}
        </button>
      )}
    </div>
  );
}
