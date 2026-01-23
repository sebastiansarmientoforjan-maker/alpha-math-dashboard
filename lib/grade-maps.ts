export const TOPIC_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  "Counting": "K-8", "Addition": "K-8", "Subtraction": "K-8", "Multiplication": "K-8",
  "Division": "K-8", "Fractions": "K-8", "Decimals": "K-8", "Percentages": "K-8",
  "Ratios": "K-8", "Integers": "K-8", "Order of Operations": "K-8",
  "Algebra": "HS", "Geometry": "HS", "Trigonometry": "HS", "Precalculus": "HS",
  "Calculus": "AP", "Derivatives": "AP", "Integrals": "AP", "Limits": "AP"
};

export function getTopicGrade(courseName: string, topicName: string): 'K-8' | 'HS' | 'AP' {
  const combined = (courseName + " " + topicName).toLowerCase();
  if (combined.includes('calculus') || combined.includes('ap ')) return 'AP';
  for (const [key, grade] of Object.entries(TOPIC_GRADE_MAP)) {
    if (topicName.toLowerCase().includes(key.toLowerCase())) return grade;
  }
  return combined.includes('grade') || combined.includes('prealgebra') ? 'K-8' : 'HS';
}
