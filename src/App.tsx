import { useUnits } from './hooks/useUnits';
import UnitPage from "./components/UnitPage.tsx";

function App() {
    const { units, loading } = useUnits();

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {units.map(unit => (
                <UnitPage key={unit.id} unit={unit} />
            ))}
        </div>
    );
}

export default App;
