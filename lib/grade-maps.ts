// lib/grade-maps.ts

/**
 * US K-12 MATH CURRICULUM MAP
 * Clasificación de temas para el cálculo de "Academic Debt" (DER).
 * * K-8: Deuda Académica (Si aparece en High School, es remedial).
 * HS:  High School (Nivel esperado para 9-12).
 * AP:  Advanced Placement (Nivel universitario/avanzado).
 */

export const TOPIC_GRADE_MAP: Record<string, 'K-8' | 'HS' | 'AP'> = {
  // --- K-5 ELEMENTARY (Arithmetic & Foundations) ---
  "Counting": "K-8",
  "Addition": "K-8",
  "Subtraction": "K-8",
  "Multiplication": "K-8",
  "Division": "K-8",
  "Place Value": "K-8",
  "Rounding": "K-8",
  "Estimation": "K-8",
  "Fractions": "K-8",
  "Decimals": "K-8",
  "Mixed Numbers": "K-8",
  "Factors": "K-8",
  "Multiples": "K-8",
  "Divisibility": "K-8",
  "Prime Numbers": "K-8",
  "Shapes": "K-8",
  "Perimeter": "K-8",
  "Area of Rectangles": "K-8",
  "Measurement": "K-8",
  "Time": "K-8",
  "Money": "K-8",
  "Data Graphs": "K-8", // Bar graphs, pictographs

  // --- 6-8 MIDDLE SCHOOL (Pre-Algebra & Basic Geometry) ---
  "Ratios": "K-8",
  "Proportions": "K-8",
  "Rates": "K-8",
  "Percentages": "K-8",
  "Integers": "K-8", // Negative numbers
  "Absolute Value": "K-8",
  "Exponents": "K-8", // Basic powers
  "Square Roots": "K-8", // Perfect squares
  "Scientific Notation": "K-8",
  "Order of Operations": "K-8", // PEMDAS
  "Variables": "K-8",
  "Expressions": "K-8",
  "One-Step Equations": "K-8",
  "Two-Step Equations": "K-8",
  "Inequalities": "K-8", // Basic
  "Coordinate Plane": "K-8", // Plotting points
  "Slope": "K-8", // Introduction to slope
  "Linear Functions": "K-8", // y = mx + b basic
  "Pythagorean Theorem": "K-8",
  "Volume": "K-8", // Cylinders, cones, spheres
  "Surface Area": "K-8",
  "Transformations": "K-8", // Translations, reflections, rotations
  "Probability": "K-8", // Simple events
  "Mean Median Mode": "K-8",

  // --- HIGH SCHOOL: ALGEBRA I ---
  "Systems of Equations": "HS",
  "Systems of Inequalities": "HS",
  "Polynomials": "HS",
  "Factoring": "HS", // Quadratics
  "Quadratic Equations": "HS",
  "Quadratic Formula": "HS",
  "Completing the Square": "HS",
  "Exponential Functions": "HS", // Growth/Decay
  "Radical Expressions": "HS",
  "Rational Expressions": "HS",
  "Domain and Range": "HS",
  "Function Notation": "HS",
  "Sequences": "HS", // Arithmetic/Geometric

  // --- HIGH SCHOOL: GEOMETRY ---
  "Proofs": "HS",
  "Logic": "HS",
  "Congruence": "HS",
  "Similarity": "HS",
  "Right Triangles": "HS", // Trigonometry intro
  "Trigonometric Ratios": "HS", // SOH CAH TOA
  "Circles": "HS", // Chords, secants, tangents
  "Arc Length": "HS",
  "Sector Area": "HS",
  "Polygons": "HS", // Interior/Exterior angles
  "Solids": "HS", // Advanced volume/surface area

  // --- HIGH SCHOOL: ALGEBRA II / PRECALCULUS ---
  "Complex Numbers": "HS",
  "Logarithms": "HS",
  "Natural Logarithms": "HS",
  "Polynomial Functions": "HS", // Higher degree
  "Rational Functions": "HS", // Asymptotes
  "Radical Functions": "HS",
  "Inverse Functions": "HS",
  "Conic Sections": "HS", // Ellipses, Hyperbolas
  "Matrices": "HS",
  "Vectors": "HS",
  "Unit Circle": "HS",
  "Trigonometric Identities": "HS",
  "Law of Sines": "HS",
  "Law of Cosines": "HS",
  "Polar Coordinates": "HS",
  "Parametric Equations": "HS",
  "Series": "HS", // Sigma notation
  "Binomial Theorem": "HS",

  // --- AP / ADVANCED (Calculus & Stats) ---
  "Limits": "AP",
  "Continuity": "AP",
  "Derivatives": "AP",
  "Differentiation": "AP",
  "Rates of Change": "AP",
  "Integrals": "AP",
  "Integration": "AP",
  "Riemann Sums": "AP",
  "Differential Equations": "AP",
  "Series Convergence": "AP", // Taylor/Maclaurin
  "Hypothesis Testing": "AP",
  "Confidence Intervals": "AP",
  "Regression Analysis": "AP",
  "Distributions": "AP" // Normal, Chi-Square, t-dist
};

/**
 * Determina el nivel académico de un tema basándose en su nombre y el curso.
 * Prioriza el diccionario, luego heurísticas de palabras clave.
 */
export function getTopicGrade(courseName: string, topicName: string): 'K-8' | 'HS' | 'AP' {
    // 1. Normalización para búsqueda insensible a mayúsculas
    const combined = (courseName + " " + topicName).toLowerCase();
    
    // 2. Filtros de Nivel Superior (AP tiene prioridad)
    if (combined.includes('calculus') || combined.includes('ap ') || combined.includes('derivative') || combined.includes('integral')) {
        return 'AP';
    }

    // 3. Búsqueda directa en el Mapa Exhaustivo (Por Topic Name)
    // Buscamos si alguna clave del mapa está contenida en el nombre del tema
    for (const [key, grade] of Object.entries(TOPIC_GRADE_MAP)) {
        if (topicName.toLowerCase().includes(key.toLowerCase())) {
            return grade;
        }
    }

    // 4. Heurísticas de Respaldo (Fallback Heuristics)
    
    // Palabras clave de K-8 (Deuda)
    const k8Keywords = [
        'grade', 'arithmetic', 'prealgebra', 'elementary', 'middle',
        'fraction', 'decimal', 'percent', 'ratio', 'integer',
        'addition', 'subtraction', 'multiplication', 'division',
        'shape', 'measurement', 'graphing lines'
    ];

    if (k8Keywords.some(keyword => combined.includes(keyword))) {
        return 'K-8';
    }

    // Palabras clave de High School (Nivel Esperado)
    const hsKeywords = [
        'algebra', 'geometry', 'function', 'quadratic', 'linear', 
        'polynomial', 'exponent', 'logarithm', 'trig', 'proof', 
        'theorem', 'matrix', 'vector', 'complex'
    ];

    if (hsKeywords.some(keyword => combined.includes(keyword))) {
        return 'HS';
    }

    // 5. Default seguro: Si es un curso de Math Academy y no detectamos K-8, asumimos HS.
    return 'HS';
}
