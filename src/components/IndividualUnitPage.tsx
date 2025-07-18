import React from 'react';
import { useParams } from 'react-router-dom';
import { useUnits } from '../hooks/useUnits';
import UnitPage from './UnitPage';

const IndividualUnitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { units, loading, error } = useUnits();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Failed to load unit</p>
      </div>
    );
  }

  const unit = units.find(u => u.id === Number(id));

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Unit not found</p>
      </div>
    );
  }

  return <UnitPage unit={unit} />;
};

export default IndividualUnitPage;
