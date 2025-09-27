import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Unit, UserProgress } from '../data/sampleUnits';
import { sampleUnits } from '../data/sampleUnits';

export const useUnits = (assignedOnly: boolean = false) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
    const { currentUser, role } = useAuth();

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                setLoading(true);

                // For Phase 1, we'll use sample data if Firebase is empty
                // Later phases will migrate data to Firebase
                let allUnits: Unit[] = [];

                try {
                    const querySnapshot = await getDocs(collection(db, 'units'));
                    if (querySnapshot.empty) {
                        // Use sample data if no units in Firebase
                        allUnits = [...sampleUnits];
                    } else {
                        allUnits = querySnapshot.docs.map((doc) => {
                            const docData = doc.data();
                            return {
                                id: docData.id || parseInt(doc.id, 10),
                                title: docData.title || '',
                                description: docData.description || '',
                                videoUrl: docData.videoUrl || '',
                                activityUrl: docData.activityUrl || '',
                                activityType: docData.activityType || 'h5p',
                                order: docData.order || 1,
                                isActive: docData.isActive,
                                createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
                                updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
                            };
                        }) as Unit[];

                        // Filter to only show active units for students
                        if (role === 'student') {
                            allUnits = allUnits.filter(unit => unit.isActive === true);
                        }
                    }
                } catch (firestoreError) {
                    console.warn('Firebase unavailable, using sample data:', firestoreError);
                    allUnits = [...sampleUnits];
                }

                // Filter units based on user role and assignments
                if (assignedOnly && currentUser && role === 'student') {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                        const userData = userDoc.data();
                        const assignedUnits = userData?.assignedUnits || [];

                        if (assignedUnits.length > 0) {
                            allUnits = allUnits.filter(unit => assignedUnits.includes(unit.id));
                        }

                        // Load user progress
                        setUserProgress(userData?.completedUnits || []);
                    } catch (userError) {
                        console.warn('Could not fetch user assignments, showing all units:', userError);
                    }
                }

                // Sort by order
                allUnits.sort((a, b) => a.order - b.order);
                setUnits(allUnits);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch units:', err);
                setError(err as Error);
                // Fallback to sample data
                setUnits([...sampleUnits]);
            } finally {
                setLoading(false);
            }
        };

        fetchUnits();
    }, [currentUser, role, assignedOnly]);

    return { units, loading, error, userProgress };
};
