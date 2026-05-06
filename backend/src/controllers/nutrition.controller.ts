import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import { calculateTDEE, calculateTargetMacros } from '../utils/nutrition';
import { supabase } from '../config/supabase';
import medicalRestrictions from '../data/medical_restrictions.json';

export class NutritionController {
  static async generateMealPlan(req: Request, res: Response) {
    const { profile, frequency } = req.body;
    const tdee = calculateTDEE(profile);
    const targets = calculateTargetMacros(tdee, profile.goal);

    let mealPlan;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        mealPlan = await GeminiService.generateMealPlan(profile, targets.calories, frequency);
        
        // Medical Verification
        const avoidList = profile.diseases.map((d: string) => (medicalRestrictions as any)[d]?.avoid || []).flat();
        const planStr = JSON.stringify(mealPlan).toLowerCase();
        const hasRestricted = avoidList.some((item: string) => planStr.includes(item.toLowerCase()));

        if (!hasRestricted) break;
        
        console.warn(`Attempt ${attempts + 1}: Restricted food found in AI plan. Regenerating...`);
      } catch (error) {
        console.error('Gemini Error:', error);
      }
      attempts++;
    }

    if (!mealPlan) {
      return res.status(500).json({ error: 'Failed to generate a safe meal plan' });
    }

    res.json({ mealPlan, targets });
  }

  static async regenerateSlot(req: Request, res: Response) {
    const { profile, mealType } = req.body;
    try {
      const alternates = await GeminiService.regenerateMealSlot(profile, mealType);
      res.json({ alternates });
    } catch (error) {
      res.status(500).json({ error: 'Failed to regenerate slot' });
    }
  }

  static async logMeal(req: Request, res: Response) {
    const { profile_id, meal_type, macros, date } = req.body;
    const user = (req as any).user;

    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return res.status(403).json({ error: 'Cannot log future meals' });
    }

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        profile_id: profile_id,
        meal_type,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fats: macros.fats,
        fiber: macros.fiber,
        date: date || today
      });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Meal logged successfully', data });
  }
}
