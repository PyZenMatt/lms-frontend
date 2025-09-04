// src/pages/CoursesList.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LearningPaths } from "@/components/figma/LearningPaths";

export default function CoursesList() {
  const navigate = useNavigate();

  return (
    <div>
      <LearningPaths
        onContinueCourse={(courseId: string) => {
          // navigate to the learning player for enrolled courses
          navigate(`/learn/${courseId}`);
        }}
      />
    </div>
  );
}
