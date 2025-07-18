import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Unit } from '../data/sampleUnits';
import { sampleUnits } from '../data/sampleUnits';

export const useUnits = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'units'));
                const data = querySnapshot.docs.map((doc) => ({
                    ...(doc.data() as Omit<Unit, 'id'>),
                    id: parseInt(doc.id, 10),
                })) as Unit[];
                if (data.length > 0) {
                    setUnits(data);
                } else {
                    setUnits(sampleUnits);
                }
            } catch (err) {
                console.error('Failed to fetch units:', err);
                setError(err as Error);
                setUnits(sampleUnits);
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, []);

    return { units, loading, error };
};
