import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { UserContract, MockUser, ContractPlanDetails } from '@/lib/types';

export async function createUserProfile(uid: string, data: { email: string; fullName?: string }) {
  await setDoc(doc(db, 'users', uid), {
    email: data.email,
    fullName: data.fullName || '',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<MockUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    email: d.email || '',
    fullName: d.fullName || '',
    passportNumber: d.passportNumber || '',
    phoneNumber: d.phoneNumber || '',
    address: d.address || '',
  };
}

export async function updateUserProfile(uid: string, data: Partial<MockUser>) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function addContract(contract: UserContract & { paymentStatus?: string }) {
  await setDoc(doc(db, 'contracts', contract.policyNumber), {
    ...contract,
    createdAt: serverTimestamp(),
  });
}

export async function getContractByPolicyNumberWithStatus(policyNumber: string): Promise<(UserContract & { paymentStatus?: string }) | null> {
  const snap = await getDoc(doc(db, 'contracts', policyNumber));
  if (!snap.exists()) return null;
  return snap.data() as UserContract & { paymentStatus?: string };
}

export async function getContractsByEmail(userEmail: string): Promise<UserContract[]> {
  const q = query(collection(db, 'contracts'), where('userEmail', '==', userEmail));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserContract);
}

export async function getContractByPolicyNumber(policyNumber: string): Promise<UserContract | null> {
  const snap = await getDoc(doc(db, 'contracts', policyNumber));
  if (!snap.exists()) return null;
  return snap.data() as UserContract;
}

export async function updateContract(policyNumber: string, data: Partial<UserContract>) {
  await updateDoc(doc(db, 'contracts', policyNumber), data);
}

export async function userHasContract(userEmail: string, policyNumber: string): Promise<boolean> {
  const q = query(
    collection(db, 'contracts'),
    where('userEmail', '==', userEmail),
    where('policyNumber', '==', policyNumber)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
