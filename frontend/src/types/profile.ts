export type Gender = 'male' | 'female' | 'other';
export type Goal = 'weight-loss' | 'weight-gain' | 'maintenance';
export type ActivityLevel =
  | 'sedentary'
  | 'lightly-active'
  | 'moderately-active'
  | 'very-active'
  | 'extra-active';
export type DietPreference = 'veg' | 'non-veg' | 'vegan' | 'eggetarian';
export type Weekday =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const WEEK_DAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type WeeklyDietPreferences = Record<Weekday, DietPreference | ''>;

export interface WorkoutPreferences {
  daysPerWeek: number;
  focus: string;
  equipmentAccess: string;
}

export interface UserProfile {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: Gender | '';
  weight: number;
  height: number;
  goal: Goal | '';
  activityLevel: ActivityLevel | '';
  dietPreference: DietPreference | '';
  weeklyDietPreferences: WeeklyDietPreferences;
  healthConditions: string[];
  allergies: string[];
  strictAllergyMode: boolean;
  workoutPreferences: WorkoutPreferences;
}
