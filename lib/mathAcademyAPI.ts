import axios from 'axios';

const API_BASE_URL = 'https://mathacademy.com/api/beta6';
const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;

export async function fetchStudent(studentId: string) {
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
    return null;
  }
}

export async function fetchStudentActivity(studentId: string, start: string, end: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/students/${studentId}/activity`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': start,
        'End-Date': end,
      },
    });
    return response.data.activity.totals;
  } catch (error) {
    return null;
  }
}

export async function getStudentData(studentId: string) {
  const student = await fetchStudent(studentId);
  if (!student) return null;

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const activity = await fetchStudentActivity(studentId, startDate, endDate);

  return { ...student, activity };
}
