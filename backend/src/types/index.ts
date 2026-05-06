export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  goal: 'weight-loss' | 'weight-gain' | 'maintenance';
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active' | 'extra-active';
  dietPreference: 'veg' | 'non-veg' | 'vegan' | 'eggetarian';
  diseases: string[]; // List of diseases like ["Diabetes", "Hypertension"]
  allergies?: string[];
  weeklyDietPreferences?: Record<string, 'veg' | 'non-veg' | 'vegan' | 'eggetarian'>;
  strictAllergyMode?: boolean;
  workoutPreferences?: {
    daysPerWeek: number;
    focus: string;
    equipmentAccess: string;
  };
  pinCode?: string; // Optional PIN for the specific profile
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface MealOption {
  name: string;
  description: string;
  macros: MacroNutrients;
  highlights: string[];
}

export interface DailyMealPlan {
  breakfast: MealOption[];
  lunch: MealOption[];
  snacks: MealOption[];
  dinner: MealOption[];
  dailyTotal: MacroNutrients;
  date?: string;
}

export interface WorkoutRoutine {
  day: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    description: string;
  }[];
}

export interface ActivityLog {
  activity: string;
  duration: number;
  caloriesBurnt: number;
}
