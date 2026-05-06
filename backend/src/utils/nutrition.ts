import { UserProfile, MacroNutrients } from '../types';

export const calculateTDEE = (profile: UserProfile): number => {
  const { age, gender, weight, height, activityLevel } = profile;
  
  // Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    'sedentary': 1.2,
    'lightly-active': 1.375,
    'moderately-active': 1.55,
    'very-active': 1.725,
    'extra-active': 1.9
  };

  const tdee = bmr * activityMultipliers[activityLevel];
  return Math.round(tdee);
};

export const calculateTargetMacros = (tdee: number, goal: UserProfile['goal']): MacroNutrients => {
  let targetCalories = tdee;

  if (goal === 'weight-loss') {
    targetCalories -= 500;
  } else if (goal === 'weight-gain') {
    targetCalories += 500;
  }

  // Balanced Split: 30% Protein, 40% Carbs, 30% Fats
  const protein = (targetCalories * 0.30) / 4;
  const carbs = (targetCalories * 0.40) / 4;
  const fats = (targetCalories * 0.30) / 9;
  const fiber = (targetCalories / 1000) * 14; // ~14g per 1000 calories

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
    fiber: Math.round(fiber)
  };
};
