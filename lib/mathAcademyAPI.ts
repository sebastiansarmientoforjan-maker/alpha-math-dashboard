import axios from 'axios';

const API_BASE_URL = 'https://mathacademy.com/api/beta6';
const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

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

export async function fetchAllStudents(studentIds: string[]): Promise<any[]> {
  const results = [];
  
  for (const id of studentIds) {
    const student = await fetchStudent(id);
    if (student) {
      // Get activity for last 7 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const activity = await fetchStudentActivity(id, startDate, endDate);
      
      results.push({
        ...student,
        activity,
      });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
