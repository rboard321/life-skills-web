import React, { useMemo, useRef, useState } from 'react';
import type { DragDropActivity as DragDropActivityType, DragDropPair } from '../../data/sampleUnits';

interface DragDropActivityProps {
  activity: DragDropActivityType;
  onComplete?: (result?: {
    percent: number;
    correctCount: number;
    totalCount: number;
    attempts: number;
  }) => void;
}

const DragDropActivity: React.FC<DragDropActivityProps> = ({ activity, onComplete }) => {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    return activity.pairs.reduce((acc: Record<string, string | null>, pair: DragDropPair) => {
      acc[pair.id] = null;
      return acc;
    }, {} as Record<string, string | null>);
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState(0);
  const completedRef = useRef(false);

  const items = useMemo(() => {
    const shuffled = [...activity.pairs];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [activity.pairs]);

  const assignItemToTarget = (targetId: string, itemId: string) => {
    setAssignments(prev => {
      const next = { ...prev };
      // Ensure each item can only be used once
      Object.keys(next).forEach(key => {
        if (next[key] === itemId) {
          next[key] = null;
        }
      });
      next[targetId] = itemId;
      return next;
    });
    setChecked(false);
    setResults({});
  };

  const handleDrop = (targetId: string, itemId: string) => {
    assignItemToTarget(targetId, itemId);
  };

  const handleCheck = () => {
    const nextResults: Record<string, boolean> = {};
    let allCorrect = true;
    let correctCount = 0;

    activity.pairs.forEach((pair: DragDropPair) => {
      const isCorrect = assignments[pair.id] === pair.id;
      nextResults[pair.id] = isCorrect;
      if (!isCorrect) {
        allCorrect = false;
      } else {
        correctCount += 1;
      }
    });

    setResults(nextResults);
    setChecked(true);
    setAttempts(prev => prev + 1);

    if (allCorrect && !completedRef.current) {
      completedRef.current = true;
      const totalCount = activity.pairs.length;
      const percent = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
      onComplete?.({
        percent,
        correctCount,
        totalCount,
        attempts: attempts + 1
      });
    }
  };

  const handleReset = () => {
    const cleared = activity.pairs.reduce((acc: Record<string, string | null>, pair: DragDropPair) => {
      acc[pair.id] = null;
      return acc;
    }, {} as Record<string, string | null>);
    setAssignments(cleared);
    setSelectedItemId(null);
    setChecked(false);
    setResults({});
    completedRef.current = false;
    setAttempts(0);
  };

  const allAssigned = activity.pairs.every(pair => assignments[pair.id]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-medium">{activity.prompt}</p>
        <p className="text-xs text-blue-700 mt-1">Tip: tap an item, then tap a target if drag isn’t working.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Items</h3>
          {items.map(item => {
            const isPlaced = Object.values(assignments).includes(item.id);
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  isPlaced
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
                draggable={!isPlaced}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', item.id);
                }}
                onClick={() => {
                  if (isPlaced) return;
                  setSelectedItemId(prev => (prev === item.id ? null : item.id));
                }}
                disabled={isPlaced}
              >
                <span className="font-medium">{item.item}</span>
                {isPlaced && <span className="ml-2 text-xs">(Placed)</span>}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Targets</h3>
          {activity.pairs.map((pair: DragDropPair) => {
            const assignedItemId = assignments[pair.id];
            const assignedItem = activity.pairs.find((item: DragDropPair) => item.id === assignedItemId);
            const hasResult = checked && results[pair.id] !== undefined;
            const isCorrect = results[pair.id];

            return (
              <div
                key={pair.id}
                className={`rounded-lg border-2 border-dashed p-4 transition ${
                  hasResult
                    ? isCorrect
                      ? 'border-green-400 bg-green-50'
                      : 'border-red-400 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const itemId = event.dataTransfer.getData('text/plain');
                  if (itemId) {
                    handleDrop(pair.id, itemId);
                    setSelectedItemId(null);
                  }
                }}
                onClick={() => {
                  if (selectedItemId) {
                    handleDrop(pair.id, selectedItemId);
                    setSelectedItemId(null);
                  }
                }}
              >
                <div className="text-sm font-semibold text-gray-800 mb-2">{pair.target}</div>
                <div className="text-sm text-gray-600 min-h-[24px]">
                  {assignedItem ? assignedItem.item : 'Drop an item here'}
                </div>
                {assignedItem && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssignments(prev => ({ ...prev, [pair.id]: null }));
                      setChecked(false);
                      setResults({});
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allAssigned}
          className="px-4 py-2 rounded-md bg-green-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
        >
          Reset
        </button>
        {checked && allAssigned && (
          <div className="text-sm text-gray-600 flex items-center">
            {Object.values(results).every(Boolean)
              ? '✅ Great job! All matches are correct.'
              : '❌ Some matches are incorrect. Try again.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DragDropActivity;
