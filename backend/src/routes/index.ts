import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { NutritionController } from '../controllers/nutrition.controller';
import { FitnessController } from '../controllers/fitness.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth & Profiles
router.post('/auth/signup', AuthController.signup);
router.post('/auth/login', AuthController.login);
router.get('/auth/profiles', authenticate, AuthController.getProfiles);
router.post('/auth/profiles', authenticate, AuthController.createProfile);

// Nutrition (Protected)
router.post('/nutrition/generate-meal-plan', authenticate, NutritionController.generateMealPlan);
router.post('/nutrition/regenerate-slot', authenticate, NutritionController.regenerateSlot);
router.post('/nutrition/log-meal', authenticate, NutritionController.logMeal);

// Fitness (Protected)
router.post('/fitness/log-activity', authenticate, FitnessController.logActivity);
router.post('/fitness/suggest-workouts', authenticate, FitnessController.suggestWorkouts);
router.get('/fitness/daily-stats', authenticate, FitnessController.getDailyStats);
router.get('/fitness/weight-history', authenticate, FitnessController.getWeightHistory);

export default router;
