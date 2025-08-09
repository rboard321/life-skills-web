import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import VideoPlayer from './VideoPlayer';
import ActivityEmbed from './ActivityEmbed';

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
          <Link to="/" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!unitIdNum || !lessonIdNum || !unit || !lesson) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <Link to={`/unit/${unit.id}`} className="hover:text-blue-600">{unit.title}</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{lesson.title}</span>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
        {lesson.description && <p className="text-gray-600 mb-6">{lesson.description}</p>}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Watch the Video</h2>
        <VideoPlayer url={lesson.videoUrl} captionsUrl={lesson.captionsUrl} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Complete the Activities</h2>
        <div className="space-y-6">
          {lesson.activities.map(activity => (
            <ActivityEmbed key={activity.id} activity={activity} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Link
          to={`/unit/${unit.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Unit
        </Link>
        {(() => {
          const nextLesson = unit.lessons?.sort((a, b) => a.order - b.order).find(l => l.order > lesson.order);
          return nextLesson ? (
            <Link
              to={`/unit/${unit.id}/lesson/${nextLesson.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              Next Lesson: {nextLesson.title} →
            </Link>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-green-600 text-sm font-medium text-white hover:bg-green-700"
            >
              Back to Dashboard →
            </Link>
          );
        })()}
      </div>
    </div>
  );
};

export default LessonPage;
