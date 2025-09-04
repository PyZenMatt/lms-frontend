import React from "react";
import { Profile as FigmaProfile } from "@/components/figma/Profile";
// navigation handled by higher-level app; this wrapper only mounts figma Profile

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <FigmaProfile />
    </div>
  );
}
