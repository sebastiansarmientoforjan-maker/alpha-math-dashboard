import axios from 'axios';

const API_BASE_URL = 'https://mathacademy.com/api/beta6';
const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

// Interfaces para que TypeScript no se queje
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  createdLocal: string;
  deactivated: boolean;
  currentCourse: {
    name: string;
    startDate: string;
    progress: number;
    xpRemaining: number;
    grade: number;
    letterGrade: string;
  };
  schedule: {
    monGoal: number;
    tueGoal: number;
    wedGoal: number;
    thuGoal: number;
    friGoal: number;
    satGoal: number;
    sunGoal: number;
  };
  league: {
    name: string;
    level: number;
  } | null;
}

interface Activity {
  time: number;
  numTasks: number;
  xpAwarded: number;
  questions: number;
  questionsCorrect: number;
}

// 1. Función para obtener datos básicos del estudiante
export async function fetchStudent(studentId: string): Promise<Student | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
      },
    });
    return response.data.student;
  } catch (error) {
    console.error(`Error fetching student ${studentId}:`, error);
    return null;
  }
}

// 2. Función para obtener actividad
export async function fetchStudentActivity(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<Activity | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/activity`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate,
      },
    });
    return response.data.activity.totals;
  } catch (error) {
    console.error(`Error fetching activity for student ${studentId}:`, error);
    return null;
  }
}

// 3. ESTA ES LA FUNCIÓN CLAVE QUE NECESITA EL ROUTE.TS
// Combina los datos básicos con la actividad de los últimos 7 días
export async function getStudentData(studentId: string) {
  const student = await fetchStudent(studentId);
  if (!student) return null;

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const activity = await fetchStudentActivity(studentId, startDate, endDate);

  return {
    ...student,
    activity
  };
}
