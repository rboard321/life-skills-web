import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import { optimizeYouTubeUrl } from '../utils/youtube';
import DragDropActivity from './activities/DragDropActivity';
import { ProgressTracker } from '../utils/progressTracker';
import { useStudentAuth } from '../contexts/StudentAuthContext';

const UnitLearning: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { units, loading } = useUnits(true);
  const { studentId, teacherId } = useStudentAuth();

  const [currentStep, setCurrentStep] = useState<'video' | 'activity'>('video');
  const [activityStartedAt, setActivityStartedAt] = useState<Date | null>(null);
  const [activityCompleted, setActivityCompleted] = useState(false);

  const unitId = id ?? null;
  const unit = units.find(u => String(u.id) === unitId);
  const activityData = unit?.activityData;
  const activityAvailable = Boolean(activityData);
  const canTrackProgress = Boolean(studentId && teacherId && unit);

  useEffect(() => {
    setActivityStartedAt(null);
    setActivityCompleted(false);
  }, [unitId]);

  useEffect(() => {
    if (!canTrackProgress || !unit) return;

    ProgressTracker.initializeProgress(studentId as string, unit.id, teacherId as string)
      .catch(error => console.error('Error initializing progress:', error));
  }, [canTrackProgress, studentId, teacherId, unit?.id]);

  useEffect(() => {
    if (currentStep !== 'activity' || activityStartedAt || !canTrackProgress) {
      return;
    }

    setActivityStartedAt(new Date());
  }, [currentStep, activityStartedAt, canTrackProgress]);

  const handleActivityComplete = async (result?: {
    percent: number;
    correctCount: number;
    totalCount: number;
    attempts: number;
  }) => {
    if (!canTrackProgress || !unit) return;

    try {
      const startedAt = activityStartedAt ?? new Date();
      const timeSeconds = Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
      await ProgressTracker.updateActivityProgress(studentId as string, unit.id, timeSeconds, startedAt);
      await ProgressTracker.completeActivity(studentId as string, unit.id, result);
      setActivityCompleted(true);
    } catch (error) {
      console.error('Error saving activity progress:', error);
    }
  };

  // Simple navigation helper
  const goBackToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unit Not Found</h2>
          <p className="text-gray-600 mb-4">
            This unit doesn't exist or isn't assigned to you.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBackToDashboard}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="text-sm text-gray-500">Unit {unit.order}</div>
              <h1 className="text-2xl font-bold text-gray-900">{unit.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setCurrentStep('video')}
              className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${
                currentStep === 'video' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="font-medium">Watch Video</span>
            </button>

            <div className="w-16 h-0.5 bg-gray-300"></div>

            <button
              onClick={() => setCurrentStep('activity')}
              className={`flex items-center gap-3 hover:opacity-80 transition-opacity ${
                currentStep === 'activity' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'activity' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="font-medium">Interactive Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'video' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Watch the Video
              </h2>
              <p className="text-gray-600 mb-6">
                {unit.description}
              </p>

              {/* Simple YouTube iframe */}
              <div className="aspect-video mb-6">
                <iframe
                  src={optimizeYouTubeUrl(unit.videoUrl)}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allowFullScreen
                  title={unit.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              </div>

              {/* Activity Button - Always Available */}
              <div className="mt-6">
                <button
                  onClick={() => setCurrentStep('activity')}
                  className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 w-full justify-center"
                >
                  🎯 Go to Activity
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'activity' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Interactive Activity
                  </h2>
                  <p className="text-gray-600">
                    Complete this activity to practice what you learned in the video.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('video')}
                  className="ml-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Video
                </button>
              </div>
            </div>

            <div className="p-6">
              {activityAvailable && activityData ? (
                <DragDropActivity
                  activity={activityData}
                  onComplete={handleActivityComplete}
                />
              ) : (
                <div className="text-center text-gray-600 py-8">
                  This unit doesn't have an activity yet. Please check back later.
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {activityCompleted ? '✅ Activity completed! Great work.' : 'Finish the activity to record your score.'}
                </div>
                <button
                  onClick={goBackToDashboard}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitLearning;
