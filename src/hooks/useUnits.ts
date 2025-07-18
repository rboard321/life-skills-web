import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type {Unit} from '../data/sampleUnits';

export const useUnits = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUnits = async () => {
            const querySnapshot = await getDocs(collection(db, 'units'));
            const data = querySnapshot.docs.map(doc => doc.data() as Unit);
            setUnits(data);
            setLoading(false);
        };

        fetchUnits();
    }, []);

    return { units, loading };
};
