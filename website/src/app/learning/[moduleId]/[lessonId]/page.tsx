import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSONS_DATABASE, Lesson } from "@/data/lessons";
import { MODULES_DATA } from "@/data/modules";
import { LessonViewerClient } from "./lesson-client";

interface PageProps {
  params: Promise<{
    moduleId: string;
    lessonId: string;
  }>;
}

export async function generateStaticParams() {
  return LESSONS_DATABASE.map((lesson) => ({
    moduleId: lesson.moduleId,
    lessonId: lesson.id,
  }));
}

export default async function LessonPage({ params }: PageProps) {
  const { moduleId, lessonId } = await params;

  const lesson = LESSONS_DATABASE.find(
    (l) => l.moduleId === moduleId && l.id === lessonId
  );

  const moduleTrack = MODULES_DATA.find((m) => m.id === moduleId);

  if (!lesson || !moduleTrack) {
    notFound();
  }

  // Find prev and next lesson
  const currentIdx = moduleTrack.topics.findIndex((t) => t.id === lessonId);
  const prevTopic = currentIdx > 0 ? moduleTrack.topics[currentIdx - 1] : null;
  const nextTopic =
    currentIdx >= 0 && currentIdx < moduleTrack.topics.length - 1
      ? moduleTrack.topics[currentIdx + 1]
      : null;

  return (
    <LessonViewerClient
      lesson={lesson}
      moduleTrack={moduleTrack}
      prevTopic={prevTopic}
      nextTopic={nextTopic}
    />
  );
}
