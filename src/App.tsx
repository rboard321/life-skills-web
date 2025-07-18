import { useUnits } from './hooks/useUnits';
import './index.css';
import UnitPage from './components/UnitPage';
import type {Unit} from './data/sampleUnits';
import { useState } from 'react';

function App() {
    const { units, loading, error } = useUnits();
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading units...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: {String(error)}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (units.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No units available</p>
                    <a 
                        href="/admin" 
                        className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Add Units in Admin
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-4xl font-bold text-center mb-8">Choose a Unit</h1>
            
            <div className="max-w-md mx-auto mb-8">
                <select
                    className="w-full p-3 border rounded"
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

            {selectedUnit && <UnitPage unit={selectedUnit} />}
        </div>
    );
}

export default App;
