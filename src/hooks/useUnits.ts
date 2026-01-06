import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import type { Unit } from '../data/sampleUnits';
import { sampleUnits } from '../data/sampleUnits';
import { TeacherAssignmentManager, type Unit as FirebaseUnit } from '../utils/teacherAssignments';

const convertFirebaseUnit = (firebaseUnit: FirebaseUnit): Unit => {
  const parsedId = typeof firebaseUnit.id === 'string' ? Number.parseInt(firebaseUnit.id, 10) : firebaseUnit.id;
  const normalizedId = typeof firebaseUnit.id === 'string' && Number.isNaN(parsedId)
    ? firebaseUnit.id
    : parsedId;

  return {
    ...firebaseUnit,
    id: normalizedId,
    order: firebaseUnit.order || 1
  };
};

export const useUnits = (assignedOnly: boolean = false) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { role } = useAuth();
  const { teacherId } = useStudentAuth();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);

        let allUnits: Unit[] = [];

        try {
          const querySnapshot = await getDocs(collection(db, 'units'));
          if (querySnapshot.empty) {
            allUnits = [...sampleUnits];
          } else {
            allUnits = querySnapshot.docs.map((doc) => {
              const docData = doc.data();
              return {
                id: docData.id || parseInt(doc.id, 10),
                title: docData.title || '',
                description: docData.description || '',
                videoUrl: docData.videoUrl || '',
                activityType: docData.activityType || 'drag-drop',
                activityData: docData.activityData || undefined,
                order: docData.order || 1,
                isActive: docData.isActive,
                createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
                updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
              };
            }) as Unit[];

            if (role === 'student') {
              allUnits = allUnits.filter(unit => unit.isActive === true);
            }
          }
        } catch (firestoreError) {
          console.warn('Firebase unavailable, using sample data:', firestoreError);
          allUnits = [...sampleUnits];
        }

        if (assignedOnly && teacherId) {
          try {
            const assignedUnits = await TeacherAssignmentManager.getAssignedUnits(teacherId);
            allUnits = assignedUnits.map(convertFirebaseUnit);
          } catch (userError) {
            console.warn('Could not fetch assigned units, showing empty list:', userError);
            allUnits = [];
          }
        } else if (role === 'teacher') {
          try {
            const teacherUnits = await TeacherAssignmentManager.getAllUnits();
            allUnits = teacherUnits.map(convertFirebaseUnit);
          } catch (teacherError) {
            console.warn('Could not fetch units for teacher:', teacherError);
          }
        }

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
        setUnits([...sampleUnits]);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [role, assignedOnly, teacherId]);

  return { units, loading, error };
};
