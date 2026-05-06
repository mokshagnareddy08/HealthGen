import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { UserProfile, DailyMealPlan, MealOption } from '../types';
import medicalRestrictions from '../data/medical_restrictions.json';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export class GeminiService {
  static async generateMealPlan(profile: UserProfile, targetCalories: number, frequency: 'daily' | 'weekly' = 'daily'): Promise<DailyMealPlan | DailyMealPlan[]> {
    const restrictions = profile.diseases.map(d => (medicalRestrictions as any)[d]?.avoid || []).flat();
    const recommendations = profile.diseases.map(d => (medicalRestrictions as any)[d]?.recommend || []).flat();

    const prompt = `
      You are an expert Indian Nutritionist and Medical Dietitian. Generate a ${frequency} meal plan for:
      Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}, Weight: ${profile.weight}kg, Height: ${profile.height}cm, 
      Goal: ${profile.goal}, Diet Preference: ${profile.dietPreference}.
      Medical Conditions: ${profile.diseases.join(', ') || 'None'}.
      STRICTLY AVOID: ${restrictions.join(', ')}.
      RECOMMENDED: ${recommendations.join(', ')}.
      Target Calories per day: ${targetCalories} kcal.

      Requirements:
      1. Provide 4 meal slots: Breakfast, Lunch, Snacks, Dinner.
      2. For EACH slot, provide 3 alternate meal options.
      3. For EACH alternate option, provide:
         - Name (Prefer Indian dishes)
         - Brief description
         - Macros: calories, protein, carbs, fats, fiber
         - Highlights: tags like "Fiber-Rich", "Diabetic-Friendly", etc.
      4. Ensure the daily total of the first options matches ${targetCalories} kcal (~5% margin).
      5. Format as JSON. If weekly, return an array of 7 daily plans.
      
      Structure:
      ${frequency === 'daily' ? '{ "breakfast": [...], ... }' : '[{ "date": "Day 1", "breakfast": [...] }, ...]'}
      
      Ensure response is ONLY the JSON.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const jsonStr = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (error) {
      throw new Error('Invalid AI response format');
    }
  }

  static async regenerateMealSlot(profile: UserProfile, mealType: string): Promise<MealOption[]> {
    const restrictions = profile.diseases.map(d => (medicalRestrictions as any)[d]?.avoid || []).flat();
    const prompt = `
      Generate 3 alternate Indian meal options for ${mealType} for ${profile.name} (${profile.age}y, ${profile.gender}).
      Conditions: ${profile.diseases.join(', ')}.
      AVOID: ${restrictions.join(', ')}.
      Format as JSON array of objects with keys: name, description, macros, highlights.
    `;

    const result = await model.generateContent(prompt);
    try {
      const jsonStr = result.response.text().match(/\[[\s\S]*\]/)?.[0];
      return JSON.parse(jsonStr || '[]');
    } catch (error) {
      throw new Error('Failed to regenerate meal slot');
    }
  }

  static async generateWorkout(profile: UserProfile): Promise<any> {
    const prompt = `
      Create a 7-day workout routine for ${profile.name} (${profile.age}y, ${profile.gender}) with goal ${profile.goal}.
      Format as JSON: [{"day": "Day 1", "exercises": [...]}]
    `;
    const result = await model.generateContent(prompt);
    try {
      const jsonStr = result.response.text().match(/\[[\s\S]*\]/)?.[0];
      return JSON.parse(jsonStr || '[]');
    } catch (error) {
      throw new Error('Failed to generate workout');
    }
  }

  static async analyzeProgress(weightHistory: any[]): Promise<string> {
    const prompt = `Analyze weight history and give 3 bullet points: ${JSON.stringify(weightHistory)}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
