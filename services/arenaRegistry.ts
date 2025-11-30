import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, getDoc } from 'firebase/firestore';
import { db, firebaseEnabled } from './firebase';

export type ArenaStatus = 'waiting' | 'active' | 'ended';

export interface ArenaRecord {
  roomId: string;
  hostPeerId: string;
  hostName: string;
  status: ArenaStatus;
  playerCount: number;
  capacity: number;
  buyIn: number;
  discussionTime?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION = 'arenas';

const noop = () => {};

const arenaDoc = (roomId: string) => (db ? doc(db, COLLECTION, roomId) : null);

export const registerArena = async (record: ArenaRecord) => {
  if (!firebaseEnabled || !db) return;
  const target = arenaDoc(record.roomId);
  if (!target) return;
  await setDoc(target, {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateArena = async (roomId: string, data: Partial<Omit<ArenaRecord, 'roomId'>>) => {
  if (!firebaseEnabled || !db) return;
  const target = arenaDoc(roomId);
  if (!target) return;
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  await updateDoc(target, {
    ...cleanData,
    updatedAt: serverTimestamp()
  });
};

export const setArenaStatus = async (roomId: string, status: ArenaStatus) => {
  await updateArena(roomId, { status });
};

export const getArena = async (roomId: string): Promise<ArenaRecord | null> => {
  if (!firebaseEnabled || !db) return null;
  const target = arenaDoc(roomId);
  if (!target) return null;
  const snap = await getDoc(target);
  if (!snap.exists()) return null;
  return snap.data() as ArenaRecord;
};

export const subscribeToArenas = (
  status: ArenaStatus,
  onChange: (arenas: ArenaRecord[]) => void
) => {
  if (!firebaseEnabled || !db) return noop;
  const arenasRef = collection(db, COLLECTION);
  const q = query(arenasRef, where('status', '==', status));
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs
        .map((docSnap) => {
          const payload = docSnap.data() as Record<string, any>;
          const normalizeTimestamp = (value: any) =>
            value && typeof value.toDate === 'function' ? value.toDate() : value;

          return {
            roomId: docSnap.id,
            ...payload,
            createdAt: normalizeTimestamp(payload.createdAt),
            updatedAt: normalizeTimestamp(payload.updatedAt)
          } as ArenaRecord;
        })
        .sort((a, b) => {
          const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
          const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
          return bTime - aTime;
        });

      onChange(data);
    },
    (error) => {
      console.warn('Arena subscription failed', error);
      onChange([]);
    }
  );
};
