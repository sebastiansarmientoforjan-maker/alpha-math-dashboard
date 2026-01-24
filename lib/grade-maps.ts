// lib/grade-maps.ts
// Mapeo de topics de Math Academy a niveles académicos (K-8, HS, AP)

export const TOPIC_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  // ==========================================
  // K-8 FUNDAMENTALS
  // ==========================================
  "Counting": "K-8",
  "Addition": "K-8",
  "Subtraction": "K-8",
  "Multiplication": "K-8",
  "Division": "K-8",
  "Fractions": "K-8",
  "Decimals": "K-8",
  "Percentages": "K-8",
  "Ratios": "K-8",
  "Proportions": "K-8",
  "Integers": "K-8",
  "Order of Operations": "K-8",
  "Basic Geometry": "K-8",
  "Perimeter": "K-8",
  "Area": "K-8",
  "Volume": "K-8",
  "Mean": "K-8",
  "Median": "K-8",
  "Mode": "K-8",
  "Prime": "K-8",
  "Factor": "K-8",
  "GCD": "K-8",
  "LCM": "K-8",
  
  // ==========================================
  // HIGH SCHOOL CORE
  // ==========================================
  "Algebra": "HS",
  "Linear Equations": "HS",
  "Linear": "HS",
  "Quadratic": "HS",
  "Quadratic Equations": "HS",
  "Polynomials": "HS",
  "Polynomial": "HS",
  "Factoring": "HS",
  "Functions": "HS",
  "Function": "HS",
  "Geometry": "HS",
  "Trigonometry": "HS",
  "Trigonometric": "HS",
  "Sine": "HS",
  "Cosine": "HS",
  "Tangent": "HS",
  "Exponential": "HS",
  "Logarithm": "HS",
  "Logarithmic": "HS",
  "Systems of Equations": "HS",
  "Systems": "HS",
  "Inequalities": "HS",
  "Inequality": "HS",
  "Complex Numbers": "HS",
  "Complex": "HS",
  "Absolute Value": "HS",
  "Rational Expressions": "HS",
  "Radical": "HS",
  "Radicals": "HS",
  "Sequences": "HS",
  "Series": "HS",
  "Arithmetic Sequence": "HS",
  "Geometric Sequence": "HS",
  "Conic Sections": "HS",
  "Circle": "HS",
  "Ellipse": "HS",
  "Parabola": "HS",
  "Hyperbola": "HS",
  "Matrices": "HS",
  "Matrix": "HS",
  "Determinant": "HS",
  "Probability": "HS",
  "Statistics": "HS",
  "Combinatorics": "HS",
  "Permutation": "HS",
  "Combination": "HS",
  
  // ==========================================
  // AP / CALCULUS
  // ==========================================
  "Precalculus": "HS", // Nota: Precalc es HS, no AP
  "Calculus": "AP",
  "Derivatives": "AP",
  "Derivative": "AP",
  "Differentiation": "AP",
  "Integrals": "AP",
  "Integral": "AP",
  "Integration": "AP",
  "Limits": "AP",
  "Limit": "AP",
  "Continuity": "AP",
  "L'Hôpital": "AP",
  "Chain Rule": "AP",
  "Product Rule": "AP",
  "Quotient Rule": "AP",
  "Implicit Differentiation": "AP",
  "Related Rates": "AP",
  "Optimization": "AP",
  "Riemann": "AP",
  "Fundamental Theorem": "AP",
  "U-Substitution": "AP",
  "Integration by Parts": "AP",
  "Partial Fractions": "AP",
  "Differential Equations": "AP",
  "Separable": "AP",
  "Slope Fields": "AP",
  "Euler's Method": "AP",
  "Taylor Series": "AP",
  "Maclaurin": "AP",
  "Power Series": "AP",
  "Convergence": "AP",
  "Divergence": "AP",
  "Vectors": "AP",
  "Vector": "AP",
  "Parametric": "AP",
  "Polar": "AP"
};

/**
 * Mapeo de cursos a niveles académicos
 */
const COURSE_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  // K-8
  'Pre Algebra': 'K-8',
  'Pre-Algebra': 'K-8',
  'Math 6': 'K-8',
  'Math 7': 'K-8',
  'Math 8': 'K-8',
  
  // High School
  'Algebra I': 'HS',
  'Algebra 1': 'HS',
  'Geometry': 'HS',
  'Algebra II': 'HS',
  'Algebra 2': 'HS',
  'Precalculus': 'HS',
  'Pre-Calculus': 'HS',
  'SAT Fundamentals': 'HS',
  'SAT Math': 'HS',
  'IM1': 'HS',
  'IM1 Honors': 'HS',
  'IM2': 'HS',
  'IM2 Honors': 'HS',
  'IM3': 'HS',
  'IM3 Honors': 'HS',
  
  // AP / Calculus
  'AP Calculus AB': 'AP',
  'AP Calculus BC': 'AP',
  'Calculus I': 'AP',
  'Calculus II': 'AP',
  'Calculus III': 'AP',
  'AP Statistics': 'AP',
  'Multivariable Calculus': 'AP',
  'Differential Equations': 'AP'
};

/**
 * Determina el nivel académico de un topic basándose en:
 * 1. Mapeo explícito del topic
 * 2. Mapeo del curso
 * 3. Keywords en nombre combinado
 * 4. Fallback conservador a HS
 * 
 * @param courseName - Nombre del curso (ej: "Algebra II", "AP Calculus BC")
 * @param topicName - Nombre del topic (ej: "Quadratic Equations", "Integration")
 * @returns Nivel académico: 'K-8', 'HS', o 'AP'
 */
export function getTopicGrade(courseName: string, topicName: string): 'K-8' | 'HS' | 'AP' {
  if (!courseName || !topicName) return 'HS'; // Fallback seguro
  
  const combined = (courseName + " " + topicName).toLowerCase();
  
  // 1. Buscar match exacto en mapa de topics
  for (const [key, grade] of Object.entries(TOPIC_GRADE_MAP)) {
    if (topicName.toLowerCase().includes(key.toLowerCase())) {
      return grade;
    }
  }
  
  // 2. Buscar en mapa de cursos
  if (COURSE_GRADE_MAP[courseName]) {
    return COURSE_GRADE_MAP[courseName];
  }
  
  // 3. Reglas por keywords (fallback heurístico)
  if (combined.includes('calculus') || 
      combined.includes(' ap ') || 
      combined.includes('derivative') ||
      combined.includes('integral') ||
      combined.includes('limit')) {
    return 'AP';
  }
  
  if (combined.includes('pre-algebra') || 
      combined.includes('grade') ||
      combined.includes('elementary') ||
      combined.includes('middle school')) {
    return 'K-8';
  }
  
  // 4. Fallback conservador
  return 'HS';
}

/**
 * Helper para obtener descripción legible del nivel
 */
export function getGradeDescription(grade: 'K-8' | 'HS' | 'AP'): string {
  switch (grade) {
    case 'K-8': return 'Elementary/Middle School';
    case 'HS': return 'High School';
    case 'AP': return 'AP/College Level';
  }
}
