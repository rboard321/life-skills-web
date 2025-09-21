import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import VideoProgression from './VideoProgression';

const LessonPage: React.FC = () => {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const { units, loading, error } = useUnits();

  const unitIdNum = unitId ? parseInt(unitId, 10) : null;
  const lessonIdNum = lessonId ? parseInt(lessonId, 10) : null;

  const unit = units.find(u => u.id === unitIdNum);
  const lesson = unit?.lessons?.find(l => l.id === lessonIdNum);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading lesson</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!unitIdNum || !lessonIdNum || !unit || !lesson) {
    return <Navigate to="/" replace />;
  }

  const sortedLessons = [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order);
  const currentLessonIndex = sortedLessons.findIndex(l => l.id === lesson.id);
  const nextLesson = currentLessonIndex < sortedLessons.length - 1 ? sortedLessons[currentLessonIndex + 1] : null;

  const backToUnitUrl = `/unit/${unit.id}`;
  const nextLessonUrl = nextLesson ? `/unit/${unit.id}/lesson/${nextLesson.id}` : undefined;
  const nextLessonTitle = nextLesson?.title;

  return (
    <div>
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto p-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span>→</span>
            <Link to={`/unit/${unit.id}`} className="hover:text-blue-600">{unit.title}</Link>
            <span>→</span>
            <span className="text-gray-900 font-medium">{lesson.title}</span>
          </nav>
        </div>
      </div>

      <VideoProgression
        videoUrl={lesson.videoUrl}
        captionsUrl={lesson.captionsUrl}
        activities={lesson.activities || []}
        nextLessonUrl={nextLessonUrl}
        nextLessonTitle={nextLessonTitle}
        backToUnitUrl={backToUnitUrl}
        lessonTitle={lesson.title}
      />
    </div>
  );
};

export default LessonPage;
