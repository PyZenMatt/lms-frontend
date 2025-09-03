import { Navigate } from "react-router-dom";

// This page has been retired in favor of the sidebar inbox (TeacherDecisionNav).
// Keep a lightweight redirect so any existing routes/imports don't break.

export default function TeacherChoicesPage() {
  return <Navigate to="/teacher" replace />;
}

export function TeacherChoicesPageLegacy() {
  return <Navigate to="/teacher" replace />;
}
