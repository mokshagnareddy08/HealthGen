import type { User } from '@supabase/supabase-js';
import type {
  ActivityLevel,
  DietPreference,
  Goal,
  UserProfile,
  WeeklyDietPreferences,
  Weekday,
} from '../types/profile';
import { WEEK_DAYS } from '../types/profile';

const PROFILE_PREFIX = 'nutriexpo.profiles';
const ACTIVE_PROFILE_PREFIX = 'nutriexpo.activeProfile';
const MEAL_LOG_PREFIX = 'nutriexpo.mealLogs';
const WORKOUT_LOG_PREFIX = 'nutriexpo.workoutLogs';

const emptyWeeklyPreferences = (): WeeklyDietPreferences =>
  WEEK_DAYS.reduce((acc, day) => {
    acc[day] = '';
    return acc;
  }, {} as WeeklyDietPreferences);

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyProfile = (): UserProfile => ({
  id: createId(),
  name: '',
  relation: '',
  age: 0,
  gender: '',
  weight: 0,
  height: 0,
  goal: '',
  activityLevel: '',
  dietPreference: '',
  weeklyDietPreferences: emptyWeeklyPreferences(),
  healthConditions: [],
  allergies: [],
  strictAllergyMode: true,
  workoutPreferences: {
    daysPerWeek: 0,
    focus: '',
    equipmentAccess: '',
  },
});

const sanitizeStoredProfile = (raw: Partial<UserProfile> | null | undefined): UserProfile => ({
  ...createEmptyProfile(),
  ...raw,
  id: raw?.id || createId(),
  weeklyDietPreferences: {
    ...emptyWeeklyPreferences(),
    ...(raw?.weeklyDietPreferences || {}),
  },
  workoutPreferences: {
    daysPerWeek: 0,
    focus: '',
    equipmentAccess: '',
    ...(raw?.workoutPreferences || {}),
  },
  healthConditions: Array.isArray(raw?.healthConditions) ? raw!.healthConditions : [],
  allergies: Array.isArray(raw?.allergies) ? raw!.allergies : [],
  strictAllergyMode: raw?.strictAllergyMode ?? true,
});

const getProfilesKey = (userId: string) => `${PROFILE_PREFIX}.${userId}`;
const getActiveProfileKey = (userId: string) => `${ACTIVE_PROFILE_PREFIX}.${userId}`;
const getMealLogKey = (userId: string, profileId: string) => `${MEAL_LOG_PREFIX}.${userId}.${profileId}`;
const getWorkoutLogKey = (userId: string, profileId: string) => `${WORKOUT_LOG_PREFIX}.${userId}.${profileId}`;

export const getStoredProfiles = (userId?: string | null): UserProfile[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getProfilesKey(userId));
    if (!raw) return [];
    return (JSON.parse(raw) as Partial<UserProfile>[]).map(sanitizeStoredProfile).slice(0, 3);
  } catch (error) {
    console.error('Failed to parse stored profiles:', error);
    return [];
  }
};

export const saveStoredProfiles = (userId: string, profiles: UserProfile[]) => {
  localStorage.setItem(getProfilesKey(userId), JSON.stringify(profiles.slice(0, 3)));
};

export const upsertStoredProfile = (userId: string, profile: UserProfile) => {
  const profiles = getStoredProfiles(userId);
  const existingIndex = profiles.findIndex((item) => item.id === profile.id);
  if (existingIndex >= 0) profiles[existingIndex] = sanitizeStoredProfile(profile);
  else profiles.push(sanitizeStoredProfile(profile));
  saveStoredProfiles(userId, profiles);
};

export const deleteStoredProfile = (userId: string, profileId: string) => {
  const next = getStoredProfiles(userId).filter((profile) => profile.id !== profileId);
  saveStoredProfiles(userId, next);
  const activeId = getActiveProfileId(userId);
  if (activeId === profileId) {
    if (next[0]) setActiveProfileId(userId, next[0].id);
    else localStorage.removeItem(getActiveProfileKey(userId));
  }
};

export const setActiveProfileId = (userId: string, profileId: string) => {
  localStorage.setItem(getActiveProfileKey(userId), profileId);
};

export const getActiveProfileId = (userId?: string | null) => {
  if (!userId) return null;
  return localStorage.getItem(getActiveProfileKey(userId));
};

export const getActiveProfile = (userId?: string | null) => {
  if (!userId) return null;
  const profiles = getStoredProfiles(userId);
  if (!profiles.length) return null;
  const activeId = getActiveProfileId(userId);
  return profiles.find((profile) => profile.id === activeId) || profiles[0];
};

export const getInitialProfile = (user: User | null): UserProfile => {
  const active = getActiveProfile(user?.id);
  return active || createEmptyProfile();
};

export const clearStoredProfile = (userId?: string | null, profileId?: string) => {
  if (!userId || !profileId) return;
  deleteStoredProfile(userId, profileId);
};

const hasWeeklyPreferences = (weekly: WeeklyDietPreferences) =>
  WEEK_DAYS.every((day) => Boolean(weekly[day]));

export const isProfileComplete = (profile: UserProfile | null | undefined) =>
  Boolean(
    profile?.name.trim() &&
      profile.relation.trim() &&
      profile.age >= 15 &&
      profile.weight > 0 &&
      profile.height > 0 &&
      profile.gender &&
      profile.goal &&
      profile.activityLevel &&
      profile.dietPreference &&
      hasWeeklyPreferences(profile.weeklyDietPreferences) &&
      profile.workoutPreferences.daysPerWeek > 0,
  );

export const hasCompletedProfile = (user: User | null) => {
  if (!user) return false;
  return isProfileComplete(getActiveProfile(user.id));
};

export const formatGoal = (goal: Goal | '') => {
  const labels: Record<Goal, string> = {
    'weight-loss': 'Fat Loss',
    'weight-gain': 'Muscle Gain',
    maintenance: 'Maintenance',
  };
  return goal ? labels[goal] : 'Not set';
};

export const formatActivityLevel = (level: ActivityLevel | '') => {
  const labels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary',
    'lightly-active': 'Lightly Active',
    'moderately-active': 'Moderately Active',
    'very-active': 'Very Active',
    'extra-active': 'Extra Active',
  };
  return level ? labels[level] : 'Not set';
};

export const formatDietPreference = (diet: DietPreference | '') => {
  const labels: Record<DietPreference, string> = {
    veg: 'Vegetarian',
    'non-veg': 'Non-Vegetarian',
    vegan: 'Vegan',
    eggetarian: 'Eggetarian',
  };
  return diet ? labels[diet] : 'Not set';
};

export const calculateBmi = (weight: number, heightCm: number) => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
};

export const getBmiCategory = (bmi: number) => {
  if (!bmi) return 'Unknown';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const getSuggestedGoalFromBmi = (bmi: number): Goal | '' => {
  if (!bmi) return '';
  if (bmi < 18.5) return 'weight-gain';
  if (bmi >= 25) return 'weight-loss';
  return 'maintenance';
};

export const getGoalAdviceFromBmi = (bmi: number) => {
  const goal = getSuggestedGoalFromBmi(bmi);
  if (!goal) return '';
  if (goal === 'weight-gain') return 'Your BMI is low. A healthy gain goal is recommended.';
  if (goal === 'weight-loss') return 'Your BMI is above the healthy range. Fat loss is recommended.';
  return 'Your BMI is in the healthy range. Maintenance is recommended.';
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  'lightly-active': 1.375,
  'moderately-active': 1.55,
  'very-active': 1.725,
  'extra-active': 1.9,
};

export const calculateDailyCalories = (profile: UserProfile) => {
  if (!profile.gender || !profile.activityLevel || !profile.age || !profile.weight || !profile.height) return 0;
  const base =
    profile.gender === 'male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : profile.gender === 'female'
        ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
        : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 78;

  const tdee = base * ACTIVITY_MULTIPLIER[profile.activityLevel];

  if (profile.goal === 'weight-loss') return Math.round(tdee - 350);
  if (profile.goal === 'weight-gain') return Math.round(tdee + 300);
  return Math.round(tdee);
};

export const buildWelcomeName = (profile: UserProfile, fallbackEmail?: string | null) => {
  if (profile.name?.trim()) return firstWord(profile.name);
  const emailName = fallbackEmail?.split('@')[0];
  return toTitleCase(emailName || 'there');
};

export const getTodayDietPreference = (profile: UserProfile, day: Weekday) =>
  profile.weeklyDietPreferences[day] || profile.dietPreference;

export const getTargetWeight = (weight: number, goal: Goal | '') => {
  if (!weight) return 0;
  if (goal === 'weight-loss') return Number((weight - 4).toFixed(1));
  if (goal === 'weight-gain') return Number((weight + 3).toFixed(1));
  return Number(weight.toFixed(1));
};

const firstWord = (value: string) => value.trim().split(/\s+/)[0];

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

export interface MealLog {
  day: Weekday;
  date: string;
  slot: string;
  title: string;
  calories: number;
  protein: number;
  carbs?: number;
  fats?: number;
  loggedAt: string;
}

export const getMealLogs = (userId?: string | null, profileId?: string | null): MealLog[] => {
  if (!userId || !profileId) return [];
  try {
    return JSON.parse(localStorage.getItem(getMealLogKey(userId, profileId)) || '[]') as MealLog[];
  } catch {
    return [];
  }
};

export const saveMealLog = (userId: string, profileId: string, log: MealLog) => {
  const existing = getMealLogs(userId, profileId).filter((item) => !(item.date === log.date && item.slot === log.slot));
  existing.push(log);
  localStorage.setItem(getMealLogKey(userId, profileId), JSON.stringify(existing));
};

export const getLoggedMealCountForDate = (userId?: string | null, profileId?: string | null, date?: string) =>
  getMealLogs(userId, profileId).filter((item) => item.date === date).length;

export const getMealStreak = (userId?: string | null, profileId?: string | null) => {
  const logs = getMealLogs(userId, profileId);
  if (!logs.length) return 0;
  const completeDates = new Set<string>();
  const grouped = logs.reduce<Record<string, Set<string>>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = new Set();
    acc[item.date].add(item.slot);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([date, slots]) => {
    if (slots.size >= 4) completeDates.add(date);
  });

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completeDates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export interface WorkoutLog {
  day: Weekday;
  name: string;
  duration: number;
  caloriesBurned?: number;
  loggedAt: string;
}

export const getWorkoutLogs = (userId?: string | null, profileId?: string | null): WorkoutLog[] => {
  if (!userId || !profileId) return [];
  try {
    return JSON.parse(localStorage.getItem(getWorkoutLogKey(userId, profileId)) || '[]') as WorkoutLog[];
  } catch {
    return [];
  }
};

export const saveWorkoutLog = (userId: string, profileId: string, log: WorkoutLog) => {
  const existing = getWorkoutLogs(userId, profileId);
  existing.push(log);
  localStorage.setItem(getWorkoutLogKey(userId, profileId), JSON.stringify(existing));
};
