import { NextRequest, NextResponse } from 'next/server';
import { fetchAllStudents } from '@/lib/mathAcademyAPI';
import { calculateMetrics, calculateCohortMetrics } from '@/lib/metrics';

const STUDENT_IDS = [
  '22710', '29509', '29437', '29441', '29442', '29494', '20848', '10866', '21931', '22729',
  '21936', '21949', '21958', '30668', '30679', '21799', '21833', '21971', '21972', '21961',
  '21962', '21947', '22237', '17191', '17330', '18215', '22260', '22177', '21921', '21856',
  '21844', '24293', '22195', '22162', '22267', '22196', '22122', '22154', '22126', '22200',
  '21929', '22038', '22043', '22044', '26605', '22318', '25677', '29038', '5436', '22893',
  '22733', '22732', '29035', '17331', '22740', '22731', '22730'
];

export async function POST(request: NextRequest) {
  try {
    console.log('Fetching student data from Math Academy API...');
    
    // Fetch all student data
    const rawData = await fetchAllStudents(STUDENT_IDS);
    
    // Calculate metrics
    const studentsWithMetrics = rawData.map(student => calculateMetrics(student));
    
    // Calculate cohort metrics
    const cohortMetrics = calculateCohortMetrics(studentsWithMetrics);
    
    // TODO: Save to Firestore (will implement after deployment)
    // For now, return data directly
    
    return NextResponse.json({
      success: true,
      students: studentsWithMetrics,
      cohortMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating students:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
