import './App.css'

import UnitPage from './components/UnitPage';
import { sampleUnits } from './data/sampleUnits';

function App() {
    return (
        <div>
            <UnitPage unit={sampleUnits[0]} />
        </div>
    );
}

export default App;
