import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Unit } from '../data/sampleUnits';

export const useUnits = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'units'));
                const data = querySnapshot.docs.map((doc) => {
                    const docData = doc.data();
                    return {
                        ...docData,
                        id: docData.id || parseInt(doc.id, 10),
                        lessons: docData.lessons || [],
                        totalLessons: docData.totalLessons || 0,
                    };
                }) as Unit[];

                // Sort by order
                data.sort((a, b) => a.order - b.order);
                setUnits(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch units:', err);
                setError(err as Error);
                // Don't set fallback data, let the components handle empty state
                setUnits([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, []);

    return { units, loading, error };
};
