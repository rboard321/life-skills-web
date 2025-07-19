import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProgress } from '../contexts/ProgressContext';
import { useUnits } from '../hooks/useUnits';
import VideoPlayer from './VideoPlayer';
import ActivityEmbed from './ActivityEmbed';

const LessonPage: React.FC = () => {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const { getUnitProgress } = useProgress();
  const { units, loading, error } = useUnits();
  const [videoCompleted, setVideoCompleted] = useState(false);

  const unitIdNum = unitId ? parseInt(unitId, 10) : null;
  const lessonIdNum = lessonId ? parseInt(lessonId, 10) : null;

  const unit = units.find(u => u.id === unitIdNum);
  const lesson = unit?.lessons?.find(l => l.id === lessonIdNum);

  const unitProgress = getUnitProgress(unitIdNum || 0);
  const lessonProgress = unitProgress?.lessonsProgress[lessonIdNum || 0];
  const isVideoCompleted = lessonProgress?.videoCompleted || videoCompleted;

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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${isVideoCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span>Video {isVideoCompleted ? 'Completed' : 'In Progress'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {lessonProgress?.activitiesCompleted.length || 0}/{lesson.activities.length} Activities
              </span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${lessonProgress?.completedAt ? 'bg-green-100 text-green-800' : isVideoCompleted ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                {lessonProgress?.completedAt ? 'Lesson Complete' : isVideoCompleted ? 'In Progress' : 'Not Started'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Watch the Video</h2>
        <VideoPlayer url={lesson.videoUrl} unitId={unit.id} lessonId={lesson.id} onCompleted={() => setVideoCompleted(true)} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Complete the Activities</h2>
        <div className="space-y-6">
          {lesson.activities.map(activity => (
            <ActivityEmbed key={activity.id} activity={activity} unitId={unit.id} lessonId={lesson.id} isUnlocked={isVideoCompleted} />
          ))}
        </div>
      </div>

      {lessonProgress?.completedAt && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Congratulations! You've completed this lesson!
          </h3>
          <p className="text-green-700 mb-4">Completed on {lessonProgress.completedAt.toLocaleDateString()}</p>
          <div className="flex justify-center space-x-4">
            <Link to={`/unit/${unit.id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Back to Unit
            </Link>
            <Link to="/" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Link to={`/unit/${unit.id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
          ← Back to Unit
        </Link>
        {(() => {
          const nextLesson = unit.lessons?.sort((a, b) => a.order - b.order).find(l => l.order > lesson.order);
          return nextLesson ? (
            <Link to={`/unit/${unit.id}/lesson/${nextLesson.id}`} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">
              Next Lesson: {nextLesson.title} →
            </Link>
          ) : (
            <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-green-600 text-sm font-medium text-white hover:bg-green-700">
              Back to Dashboard →
            </Link>
          );
        })()}
      </div>
    </div>
  );
};

export default LessonPage;
