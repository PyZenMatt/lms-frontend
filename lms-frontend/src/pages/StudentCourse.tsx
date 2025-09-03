// src/pages/StudentCourse.tsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseViewer } from "@/components/figma/CourseViewer";

export default function StudentCourse() {
  const { id } = useParams<{ id: string }>();
  const courseId = String(id ?? "");
  const navigate = useNavigate();

  if (!courseId) return <div className="p-6">ID corso non valido.</div>;

  return (
    <div className="p-0">
      <CourseViewer
        courseId={courseId}
        onBack={() => navigate(-1)}
        onNavigateToPage={(page) => {
          if (page === "peer-review") return navigate(`/courses/${courseId}/peer-review`);
          navigate(`/${page}`);
        }}
      />
    </div>
  );
}
