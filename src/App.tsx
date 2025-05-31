import { useUnits } from './hooks/useUnits';
import './index.css';
import UnitPage from './components/UnitPage';
import type {Unit} from './data/sampleUnits';
import { useState } from 'react';

function App() {
    const { units, loading } = useUnits();
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    if (loading) return <div>Loading...</div>;
    if (units.length === 0) return <div>No units available</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold text-blue-700 mb-6 text-center">
                    Choose a Unit
                </h1>

                <div className="mb-8 text-center">
                    <label htmlFor="unit-select" className="block text-lg font-medium text-gray-700 mb-2">
                        Select a unit
                    </label>
                    <select
                        id="unit-select"
                        className="w-full max-w-md mx-auto block px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={selectedUnit?.id || ''}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            const unit = units.find((u) => u.id === id) || null;
                            setSelectedUnit(unit);
                        }}
                    >
                        <option value="">-- Select a unit --</option>
                        {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.title}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedUnit && (
                    <div className="mt-10">
                        <UnitPage unit={selectedUnit} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
