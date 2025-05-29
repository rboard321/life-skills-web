import { useUnits } from './hooks/useUnits';
import UnitPage from './components/UnitPage';
import type {Unit} from './data/sampleUnits';
import { useState } from 'react';

function App() {
    const { units, loading } = useUnits();
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    if (loading) return <div>Loading...</div>;
    if (units.length === 0) return <div>No units available</div>;

    return (
        <div className="container">
            <h1>Choose a Unit</h1>
            <label htmlFor="unit-select">Select a unit</label>
            <select
                id="unit-select"
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

            {selectedUnit && (
                <div style={{ marginTop: '2rem' }}>
                    <UnitPage unit={selectedUnit} />
                </div>
            )}
        </div>
    );
}

export default App;
