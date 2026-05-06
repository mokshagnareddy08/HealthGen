import React, { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import CircularProgress from '../../components/ui/CircularProgress';
import {
  Flame,
  Footprints,
  Minus,
  Sparkles,
  Target,
  Utensils,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  buildWelcomeName,
  calculateDailyCalories,
  getInitialProfile,
  getMealLogs,
  getMealStreak,
  getStoredProfiles,
  getWorkoutLogs,
} from '../../services/profileStorage';

const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useMemo(() => getInitialProfile(user), [user]);
  const profiles = useMemo(() => getStoredProfiles(user?.id), [user]);
  const dailyCalories = calculateDailyCalories(profile);
  const welcomeName = buildWelcomeName(profile, user?.email);
  const streak = getMealStreak(user?.id, profile.id);
  const mealLogs = getMealLogs(user?.id, profile.id);
  const workoutLogs = getWorkoutLogs(user?.id, profile.id);

  const todayKey = toDateKey();
  const todayMeals = mealLogs.filter((log) => log.date === todayKey);
  const caloriesEatenToday = todayMeals.reduce((sum, log) => sum + (log.calories || 0), 0);
  const proteinToday = todayMeals.reduce((sum, log) => sum + (log.protein || 0), 0);
  const carbsToday = todayMeals.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const fatsToday = todayMeals.reduce((sum, log) => sum + (log.fats || 0), 0);
  const caloriesBurnedToday = workoutLogs
    .filter((log) => (log.loggedAt || '').slice(0, 10) === todayKey)
    .reduce((sum, log: any) => sum + (log.caloriesBurned || Math.round((log.duration || 0) * 6)), 0);
  const netCalories = caloriesEatenToday - caloriesBurnedToday;

  const proteinTarget = profile.weight ? Math.round(profile.weight * (profile.goal === 'weight-gain' ? 1.8 : profile.goal === 'weight-loss' ? 1.5 : 1.3)) : 120;
  const fatsTarget = dailyCalories ? Math.round((dailyCalories * 0.25) / 9) : 50;
  const carbsTarget = dailyCalories ? Math.max(80, Math.round((dailyCalories - proteinTarget * 4 - fatsTarget * 9) / 4)) : 180;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <section className="rounded-[36px] overflow-hidden bg-gradient-to-br from-rose-50/95 via-white/90 to-sky-50/95 border border-white/80 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-6 p-6 md:p-8 lg:p-10 items-center">
          <div className="space-y-5">
            <Badge variant="success" className="bg-emerald-100/90 text-emerald-700 border border-emerald-200">{profiles.length} profiles on this email</Badge>
            <div>
              <p className="text-slate-500 text-sm uppercase tracking-[0.26em] font-bold">Meals your way</p>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-3 leading-tight">Welcome back, {welcomeName}</h1>
              <p className="text-slate-500 text-lg mt-4 max-w-xl">HealthGen gives you personalized meals, workout ideas, and real logged tracking in a soft pastel glass dashboard.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl px-6" onClick={() => navigate('/meals')}>Open Smart Meals</Button>
              <Button variant="outline" className="rounded-2xl px-6 bg-white/60" onClick={() => navigate('/workouts')}>Open Workouts</Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-[28px] bg-white/70 backdrop-blur-xl p-5 shadow-lg border border-white/80">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center"><Utensils className="w-6 h-6" /></div>
              <p className="text-slate-500 mt-4 text-sm">Calories eaten today</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{caloriesEatenToday}</h3>
              <p className="text-xs text-slate-400 mt-1">{todayMeals.length} meals logged</p>
            </div>
            <div className="rounded-[28px] bg-white/70 backdrop-blur-xl p-5 shadow-lg border border-white/80">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center"><Dumbbell className="w-6 h-6" /></div>
              <p className="text-slate-500 mt-4 text-sm">Calories burned today</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{caloriesBurnedToday}</h3>
              <p className="text-xs text-slate-400 mt-1">From workout logs</p>
            </div>
            <div className="rounded-[28px] bg-white/70 backdrop-blur-xl p-5 shadow-lg border border-white/80">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center"><Minus className="w-6 h-6" /></div>
              <p className="text-slate-500 mt-4 text-sm">Net calories</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{netCalories}</h3>
              <p className="text-xs text-slate-400 mt-1">Eaten minus burned</p>
            </div>
            <div className="rounded-[28px] bg-white/70 backdrop-blur-xl p-5 shadow-lg border border-white/80">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
              <p className="text-slate-500 mt-4 text-sm">Meal streak</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{streak} day{streak === 1 ? '' : 's'}</h3>
              <p className="text-xs text-slate-400 mt-1">4 meals logged completes a day</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr,0.85fr] gap-6">
        <Card className="rounded-[32px] border-0 p-6 md:p-7 bg-gradient-to-br from-white/70 to-rose-50/70">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400 font-bold">Live progress</p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Today's logged nutrition</h2>
            </div>
            <Badge variant="info">Target {dailyCalories} kcal</Badge>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <CircularProgress value={caloriesEatenToday} target={dailyCalories || 2000} label="Calories" unit="kcal" strokeColor="#fb923c" subtitle="From logged meals" />
            <CircularProgress value={proteinToday} target={proteinTarget} label="Protein" unit="g" strokeColor="#34d399" subtitle="From logged meals" />
            <CircularProgress value={carbsToday} target={carbsTarget} label="Carbs" unit="g" strokeColor="#60a5fa" subtitle="From logged meals" />
            <CircularProgress value={fatsToday} target={fatsTarget} label="Fats" unit="g" strokeColor="#c084fc" subtitle="From logged meals" />
          </div>
        </Card>

        <div className="space-y-6">
          <CircularProgress value={caloriesBurnedToday} target={Math.max(250, Math.round(dailyCalories * 0.18) || 250)} label="Workout calories burned" unit="kcal" strokeColor="#22c55e" subtitle="From logged workouts" className="rounded-[32px]" />

          <Card className="rounded-[32px] border-0 p-6 bg-gradient-to-br from-white/70 to-sky-50/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-black text-slate-900">Safety snapshot</h3>
            </div>
            <div className="space-y-3 mt-5 text-sm">
              <div className="rounded-2xl bg-white/70 p-4 border border-white/80"><strong>Strict allergy mode:</strong> {profile.strictAllergyMode ? 'Enabled' : 'Disabled'}</div>
              <div className="rounded-2xl bg-white/70 p-4 border border-white/80"><strong>Allergies:</strong> {profile.allergies.join(', ') || 'None listed'}</div>
              <div className="rounded-2xl bg-white/70 p-4 border border-white/80"><strong>Goal:</strong> {profile.goal ? profile.goal.replace('-', ' ') : 'Not set'}</div>
            </div>
          </Card>

          <Card className="rounded-[32px] border-0 p-6 bg-gradient-to-br from-rose-50/90 via-white/80 to-sky-50/90 text-slate-900">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 font-bold">Quick actions</p>
            <h3 className="text-2xl font-black mt-3">Log meals and workouts faster</h3>
            <p className="text-slate-500 mt-2 text-sm">Meal circles update only from logged meals. Workout burn updates only from logged workouts.</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Button onClick={() => navigate('/meals')}>Go to Meals</Button>
              <Button variant="outline" className="bg-white/60" onClick={() => navigate('/workouts')}>Go to Workouts</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
