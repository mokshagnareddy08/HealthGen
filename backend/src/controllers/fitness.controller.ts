import { Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import { supabase } from '../config/supabase';

export class FitnessController {
  static async logActivity(req: Request, res: Response) {
    const { profile_id, activity_name, duration, calories_burnt } = req.body;
    const user = (req as any).user;

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        profile_id,
        activity_name,
        duration,
        calories_burnt,
        date: new Date().toISOString().split('T')[0]
      });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Activity logged', data });
  }

  static async getDailyStats(req: Request, res: Response) {
    const { profile_id } = req.query;
    const user = (req as any).user;
    const today = new Date().toISOString().split('T')[0];

    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_id', profile_id)
      .eq('date', today);

    const { data: activities } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_id', profile_id)
      .eq('date', today);

    const totalIntake = meals?.reduce((acc, m) => acc + m.calories, 0) || 0;
    const totalBurnt = activities?.reduce((acc, a) => acc + a.calories_burnt, 0) || 0;

    // Streak Logic
    const isCompleted = (meals?.length || 0) >= 4; // Breakfast, Lunch, Snacks, Dinner
    
    // Fetch last 30 days to calculate streak
    const { data: history } = await supabase
      .from('meal_logs')
      .select('date')
      .eq('user_id', user.id)
      .eq('profile_id', profile_id)
      .order('date', { ascending: false });

    let streak = 0;
    const dates = [...new Set(history?.map(h => h.date))];
    let checkDate = new Date();
    
    for (const d of dates) {
      if (d === checkDate.toISOString().split('T')[0]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ totalIntake, totalBurnt, meals, activities, isCompleted, streak });
  }

  static async getWeightHistory(req: Request, res: Response) {
    const { profile_id } = req.query;
    const user = (req as any).user;

    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_id', profile_id)
      .order('date', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    
    let analysis = '';
    if (data && data.length > 1) {
      analysis = await GeminiService.analyzeProgress(data);
    }

    res.json({ history: data, analysis });
  }


  static async suggestWorkouts(req: Request, res: Response) {
    const { profile, day } = req.body;

    if (!profile?.goal || !profile?.activityLevel) {
      return res.status(400).json({ error: 'Incomplete profile data for workout suggestion' });
    }

    const lowImpact = (profile.healthConditions || []).some((condition: string) =>
      ['knee pain', 'arthritis', 'back pain', 'hypertension'].includes(String(condition).toLowerCase()),
    );

    const baseExercises = profile.goal === 'weight-gain'
      ? [
          { name: 'Squats', sets: 4, reps: '8-10', duration: 12, caloriesBurnEstimate: 90 },
          { name: 'Push-ups', sets: 4, reps: '10-12', duration: 10, caloriesBurnEstimate: 70 },
          { name: 'Rows', sets: 4, reps: '10-12', duration: 10, caloriesBurnEstimate: 75 },
        ]
      : profile.goal === 'weight-loss'
        ? [
            { name: lowImpact ? 'Incline walk' : 'Brisk walk', sets: 1, reps: '25 min', duration: 25, caloriesBurnEstimate: 140 },
            { name: lowImpact ? 'Chair squats' : 'Bodyweight circuit', sets: 3, reps: '12 reps each', duration: 18, caloriesBurnEstimate: 120 },
            { name: 'Mobility stretch', sets: 1, reps: '10 min', duration: 10, caloriesBurnEstimate: 35 },
          ]
        : [
            { name: 'Full body mobility', sets: 2, reps: '8 moves', duration: 15, caloriesBurnEstimate: 60 },
            { name: 'Core work', sets: 3, reps: '45 sec', duration: 12, caloriesBurnEstimate: 55 },
            { name: 'Easy cardio', sets: 1, reps: '20 min', duration: 20, caloriesBurnEstimate: 110 },
          ];

    res.json({
      workoutPlan: {
        day,
        summary: `${profile.goal} workout for ${day}`,
        notes: `Built for ${profile.workoutPreferences?.focus || 'general fitness'} with ${profile.workoutPreferences?.equipmentAccess || 'available equipment'}.`,
        strictConditions: profile.healthConditions || [],
        exercises: baseExercises,
      },
    });
  }

}
