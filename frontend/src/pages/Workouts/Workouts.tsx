import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import CircularProgress from '../../components/ui/CircularProgress';
import { useAuth } from '../../context/AuthContext';
import { getInitialProfile, getWorkoutLogs, saveWorkoutLog } from '../../services/profileStorage';
import { suggestWorkouts } from '../../services/api';
import { WEEK_DAYS, type Weekday } from '../../types/profile';
import { Dumbbell, Sparkles, Activity } from 'lucide-react';

const today = WEEK_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const fallbackWorkout = (profile: ReturnType<typeof getInitialProfile>, day: Weekday) => ({
  day,
  summary: `${profile.goal || 'general fitness'} workout built from your profile`,
  notes: `Designed for ${profile.workoutPreferences.focus || 'balanced fitness'} with ${profile.workoutPreferences.equipmentAccess || 'available equipment'}.`,
  exercises:
    profile.goal === 'weight-gain'
      ? [
          { name: 'Goblet squats', sets: 4, reps: '8-10', duration: 12, caloriesBurnEstimate: 90 },
          { name: 'Push-ups', sets: 4, reps: '10-12', duration: 10, caloriesBurnEstimate: 70 },
          { name: 'Rows', sets: 4, reps: '10-12', duration: 10, caloriesBurnEstimate: 70 },
        ]
      : [
          { name: 'Brisk walk', sets: 1, reps: '25 min', duration: 25, caloriesBurnEstimate: 140 },
          { name: 'Bodyweight circuit', sets: 3, reps: '12 reps each', duration: 18, caloriesBurnEstimate: 120 },
          { name: 'Stretching', sets: 1, reps: '10 min', duration: 10, caloriesBurnEstimate: 35 },
        ],
});

const Workouts = () => {
  const { user } = useAuth();
  const profile = useMemo(() => getInitialProfile(user), [user]);
  const workoutLogs = useMemo(() => getWorkoutLogs(user?.id, profile.id), [user, profile]);
  const [selectedDay, setSelectedDay] = useState<Weekday>(today);
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [durationOverrides, setDurationOverrides] = useState<Record<string, number>>({});

  useEffect(() => {
    setWorkoutPlan(null);
    setMessage('');
  }, [selectedDay]);

  const todayKey = toDateKey();
  const todayBurned = workoutLogs
    .filter((log) => (log.loggedAt || '').slice(0, 10) === todayKey)
    .reduce((sum, log) => sum + (log.caloriesBurned || Math.round((log.duration || 0) * 6)), 0);
  const weeklyBurned = workoutLogs
    .filter((log) => {
      const d = new Date(log.loggedAt || todayKey);
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return d >= start;
    })
    .reduce((sum, log) => sum + (log.caloriesBurned || Math.round((log.duration || 0) * 6)), 0);

  const generate = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await suggestWorkouts(profile, selectedDay);
      setWorkoutPlan(response.data.workoutPlan);
      setMessage('Workout suggestions generated from the active user profile.');
    } catch (error) {
      setWorkoutPlan(fallbackWorkout(profile, selectedDay));
      setMessage('Backend workout API was unavailable, so a local profile-based workout was shown instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleLog = (exercise: any) => {
    if (!user?.id) return;
    const duration = durationOverrides[exercise.name] || exercise.duration || 20;
    const caloriesBurned = exercise.caloriesBurnEstimate || Math.round(duration * 6);
    saveWorkoutLog(user.id, profile.id, {
      name: exercise.name,
      duration,
      caloriesBurned,
      day: selectedDay,
      loggedAt: new Date().toISOString(),
    } as any);
    setMessage(`Workout logged. ${caloriesBurned} calories burned added to today's dashboard.`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Workout Planner</h1>
          <p className="text-slate-500 mt-1">Workout suggestions now adapt to the active profile, goal, conditions, and workout preference.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <Badge variant="info">{profile.workoutPreferences.daysPerWeek} days/week</Badge>
          <Badge variant="success">{workoutLogs.length} workouts logged</Badge>
        </div>
      </div>

      {message && <div className="rounded-2xl border border-brand-100 bg-brand-50/80 px-4 py-3 text-sm text-brand-700">{message}</div>}

      <div className="grid lg:grid-cols-[0.9fr,1.1fr] gap-6 items-start">
        <CircularProgress value={todayBurned} target={Math.max(250, Math.round((profile.weight || 60) * 4))} label="Calories burned today" unit="kcal" strokeColor="#22c55e" subtitle="Only from logged workouts" className="rounded-[32px]" />
        <Card className="space-y-4 rounded-[32px] border-0 bg-gradient-to-br from-white/70 to-sky-50/70">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-900 text-lg">Generate for {selectedDay}</h3>
          </div>
          <p className="text-sm text-slate-600">Focus: {profile.workoutPreferences.focus || 'Not set'} · Equipment: {profile.workoutPreferences.equipmentAccess || 'Not set'} · Conditions: {profile.healthConditions.join(', ') || 'None listed'}</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/70 border border-white/80 p-4"><span className="text-slate-400">Today burned</span><p className="font-black text-slate-900 text-2xl mt-1">{todayBurned} kcal</p></div>
            <div className="rounded-2xl bg-white/70 border border-white/80 p-4"><span className="text-slate-400">Last 7 days</span><p className="font-black text-slate-900 text-2xl mt-1">{weeklyBurned} kcal</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => (
              <button key={day} onClick={() => setSelectedDay(day)} className={`px-4 py-2 rounded-xl text-sm font-medium ${selectedDay === day ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/70 text-slate-600 border border-white/80'}`}>
                {day}
              </button>
            ))}
          </div>
          <Button onClick={generate} disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Suggest Workout'}
          </Button>
        </Card>
      </div>

      {!workoutPlan ? (
        <Card className="text-center py-14 rounded-[28px] border-0 shadow-xl shadow-slate-100/50">
          <h3 className="text-xl font-bold text-slate-900">No workout generated yet</h3>
          <p className="text-slate-500 mt-2">The page waits for the user to request a workout instead of assuming one in advance.</p>
        </Card>
      ) : (
        <>
          <Card className="rounded-[28px] border-0 shadow-xl shadow-emerald-100/20 space-y-2 bg-gradient-to-br from-white/70 to-emerald-50/70">
            <h3 className="text-xl font-bold text-slate-900">{workoutPlan.summary}</h3>
            <p className="text-sm text-slate-600">{workoutPlan.notes}</p>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {workoutPlan.exercises.map((exercise: any) => (
              <Card key={exercise.name} className="space-y-4 rounded-[28px] border-0 bg-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{exercise.name}</h3>
                    <p className="text-sm text-slate-500">{exercise.sets} sets · {exercise.reps}</p>
                  </div>
                  <Badge variant="success">{exercise.caloriesBurnEstimate || 0} kcal</Badge>
                </div>
                <Input
                  label="Duration (min)"
                  type="number"
                  min="1"
                  value={durationOverrides[exercise.name] ?? exercise.duration ?? 20}
                  onChange={(e) => setDurationOverrides((prev) => ({ ...prev, [exercise.name]: Number(e.target.value) }))}
                />
                <Button onClick={() => handleLog(exercise)}>
                  <Activity className="w-4 h-4 mr-2" />
                  Log Workout
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Workouts;
