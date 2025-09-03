// src/pages/TeacherDashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { TeacherDashboard as FigmaTeacherDashboard } from "@/components/figma/TeacherDashboard";

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <FigmaTeacherDashboard onViewCourse={(courseId: string) => navigate(`/courses/${courseId}`)} />
    </div>
  );
}
