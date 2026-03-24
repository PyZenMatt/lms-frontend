// src/pages/AdminAnalytics.tsx
import React from "react";

export default function AdminAnalytics() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-3">
          <div className="text-6xl">📊</div>
          <h1 className="text-3xl font-bold">Analytics in Arrivo</h1>
          <p className="text-muted-foreground text-lg">
            La dashboard admin con analytics su portfolio, learning process, peer reviews e molto altro sta arrivando presto.
          </p>
        </div>

        <div className="space-y-2 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground font-medium">In primo piano:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Portfolio Analytics</li>
            <li>✓ Learning Progress Overview</li>
            <li>✓ Peer Review Health</li>
            <li>✓ TeoCoin Metrics</li>
            <li>✓ Content Moderation</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Implementazione dopo le feature per student e teacher.
        </p>
      </div>
    </div>
  );
}
