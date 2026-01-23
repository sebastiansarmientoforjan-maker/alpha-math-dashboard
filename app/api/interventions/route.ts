import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, 'interventions'), {
      ...body,
      status: 'active',
      createdAt: serverTimestamp()
    });
    return NextResponse.json({ id: docRef.id });
  } catch (e) { return NextResponse.json({ error: 'Log failed' }, { status: 500 }); }
}

export async function GET() {
  try {
    const q = query(collection(db, 'interventions'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    const interventions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ interventions });
  } catch (e) { return NextResponse.json({ error: 'Fetch failed' }, { status: 500 }); }
}
