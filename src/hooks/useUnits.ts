import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Unit, UserProgress } from '../data/sampleUnits';
import { sampleUnits } from '../data/sampleUnits';
import { StudentAccess, TeacherAssignmentManager } from '../utils/teacherAssignments';

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
                        // Use the new teacher assignment system
                        const studentData = await StudentAccess.getStudentAssignedUnits(currentUser.uid);

                        if (studentData.units.length > 0) {
                            // Replace allUnits with the teacher-assigned units
                            allUnits = studentData.units;
                        } else {
                            // If no assignments, show empty array
                            allUnits = [];
                        }

                        // For now, load legacy progress data
                        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                        const userData = userDoc.data();
                        setUserProgress(userData?.completedUnits || []);
                    } catch (userError) {
                        console.warn('Could not fetch user assignments, showing empty list:', userError);
                        allUnits = [];
                    }
                } else if (role === 'teacher') {
                    // For teachers, show all available units
                    try {
                        const teacherUnits = await TeacherAssignmentManager.getAllUnits();
                        allUnits = teacherUnits;
                    } catch (teacherError) {
                        console.warn('Could not fetch units for teacher:', teacherError);
                    }
                }

                // Sort by order if available, otherwise by title
                allUnits.sort((a, b) => {
                    if (a.order !== undefined && b.order !== undefined) {
                        return a.order - b.order;
                    }
                    return a.title.localeCompare(b.title);
                });
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
