'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // SEGURO DE VIDA: Validamos que 'students' exista antes de filtrar
  const filteredStudents = (students || []).filter((student) => {
    if (!student) return false;

    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const searchTerm = search.toLowerCase();

    const matchesSearch = fullName.includes(searchTerm);
    const matchesStatus = statusFilter === 'All Status' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-white">Cargando datos de 1613 estudiantes...</div>;

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Alpha Math Dashboard</h1>
      
      {/* Buscador */}
      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          placeholder="Buscar estudiante..." 
          className="bg-slate-800 p-2 rounded w-64 border border-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="bg-slate-800 p-2 rounded border border-slate-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>At Risk</option>
          <option>Spinning</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="p-4">ID</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Progreso</th>
              <th className="p-4">XP Semanal</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="p-4">{student.id}</td>
                  <td className="p-4">{student.firstName} {student.lastName}</td>
                  <td className="p-4">{student.currentCourse?.progress || 0}%</td>
                  <td className="p-4">{student.activity?.xpAwarded || 0} XP</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">No se encontraron estudiantes</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
