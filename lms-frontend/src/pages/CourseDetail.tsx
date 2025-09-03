// src/pages/CourseDetail.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseDetails } from "@/components/figma/CourseDetails";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = id ?? "";
  const navigate = useNavigate();

  if (!courseId) return <div className="p-6">ID corso non valido.</div>;

  return (
    <div className="p-0">
      <CourseDetails
        courseId={String(courseId)}
        onBack={() => navigate(-1)}
        onEdit={() => navigate(`/studio/courses/${courseId}/edit`)}
      />
    </div>
  );
}
