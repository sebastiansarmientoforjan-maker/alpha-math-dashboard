const API_KEY = process.env.NEXT_PUBLIC_MATH_ACADEMY_API_KEY;
const BASE_URL = 'https://mathacademy.com/api/beta6';

function getWeekRange(): { startDate: string; endDate: string } {
  const now = new Date(Date.now());
  
  const endDateObj = new Date(now.getTime());
  endDateObj.setDate(endDateObj.getDate() + 1);
  const endDate = endDateObj.toISOString().split('T')[0];

  const startDateObj = new Date(now.getTime());
  startDateObj.setDate(startDateObj.getDate() - 30);
  const startDate = startDateObj.toISOString().split('T')[0];

  console.log(`[mathAcademyAPI] getWeekRange():`, { startDate, endDate });

  return { startDate, endDate };
}

export async function getStudentData(studentId: string) {
  if (!API_KEY) {
    console.error('[mathAcademyAPI] Missing API_KEY');
    return null;
  }

  try {
    const profileRes = await fetch(`${BASE_URL}/students/${studentId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!profileRes.ok) {
      console.error(`[mathAcademyAPI] Profile fetch failed for ${studentId}:`, profileRes.status);
      return null;
    }
    
    const profileData = await profileRes.json();
    if (!profileData?.result || !profileData?.student) {
      console.error(`[mathAcademyAPI] Invalid profile data for ${studentId}`);
      return null;
    }
    
    const student = profileData.student;
    const { startDate, endDate } = getWeekRange();

    const activityRes = await fetch(`${BASE_URL}/students/${studentId}/activity`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Public-API-Key': API_KEY,
        'Start-Date': startDate,
        'End-Date': endDate
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    let activityMetrics = { 
      xpAwarded: 0, 
      time: 0, 
      questions: 0, 
      questionsCorrect: 0, 
      numTasks: 0, 
      tasks: [] as any[],
      totals: {}
    };

    if (activityRes.ok) {
      const activityData = await activityRes.json();
      const activity = activityData?.activity || activityData;
      
      if (activity) {
        const totals = activity.totals || {};
        const tasks = activity.tasks || [];
        
        let timeEngaged = totals.timeEngaged ?? 0;
        
        if (timeEngaged === 0 && tasks.length > 0) {
          timeEngaged = tasks.reduce((acc: number, task: any) => {
            return acc + (task.analysis?.timeEngaged ?? 0);
          }, 0);
        }

        activityMetrics = {
          xpAwarded: totals.xpAwarded ?? 0,
          time: timeEngaged,
          questions: totals.questions ?? 0,
          questionsCorrect: totals.questionsCorrect ?? 0,
          numTasks: totals.numTasks ?? tasks.length,
          
          tasks: tasks.map((task: any) => ({
            id: task.id,
            type: task.type,
            topic: task.topic,
            questions: task.questions ?? 0,
            questionsCorrect: task.questionsCorrect ?? 0,
            completedLocal: task.completedLocal,
            timeTotal: task.analysis?.timeEngaged ?? 0,
            smartScore: task.smartScore ?? 0,
            xpAwarded: task.xpAwarded ?? 0
          })),
          
          totals: {
            timeEngaged: timeEngaged,
            timeProductive: totals.timeProductive ?? 0,
            timeElapsed: totals.timeElapsed ?? 0,
            xpAwarded: totals.xpAwarded ?? 0,
            questions: totals.questions ?? 0,
            questionsCorrect: totals.questionsCorrect ?? 0,
            numTasks: totals.numTasks ?? tasks.length
          }
        };
      }
    }

    return { ...student, activity: activityMetrics };
    
  } catch (error) {
    console.error(`[mathAcademyAPI] Error fetching student ${studentId}:`, error);
    return null;
  }
}

export function debugGetWeekRange() {
  return getWeekRange();
}
