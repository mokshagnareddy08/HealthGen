import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Heart,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  calculateBmi,
  clearStoredProfile,
  createEmptyProfile,
  formatGoal,
  getBmiCategory,
  getGoalAdviceFromBmi,
  getInitialProfile,
  getStoredProfiles,
  getSuggestedGoalFromBmi,
  isProfileComplete,
  setActiveProfileId,
  upsertStoredProfile,
} from '../../services/profileStorage';
import type { ActivityLevel, DietPreference, Gender, Goal, UserProfile, Weekday } from '../../types/profile';
import { WEEK_DAYS } from '../../types/profile';

const goals: Array<{ id: Goal; label: string }> = [
  { id: 'weight-loss', label: 'Fat Loss' },
  { id: 'weight-gain', label: 'Muscle Gain' },
  { id: 'maintenance', label: 'Maintenance' },
];

const genders: Array<{ id: Gender; label: string }> = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
];

const activityLevels: Array<{ id: ActivityLevel; label: string }> = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'lightly-active', label: 'Lightly Active' },
  { id: 'moderately-active', label: 'Moderately Active' },
  { id: 'very-active', label: 'Very Active' },
  { id: 'extra-active', label: 'Extra Active' },
];

const dietOptions: Array<{ id: DietPreference; label: string }> = [
  { id: 'veg', label: 'Veg' },
  { id: 'non-veg', label: 'Non-Veg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggetarian', label: 'Egg' },
];

const femaleOnlyConditions = ['pcos', 'pcod', 'endometriosis', 'pregnancy'];
const maleOnlyConditions = ['prostate', 'low testosterone'];

const stepTitles = [
  'Basic details',
  'Body metrics',
  'Health & allergies',
  'Daily meal preferences',
  'Workout needs',
  'Review & save',
];

const chipClass = (active: boolean) =>
  `px-4 py-3 rounded-2xl text-sm font-semibold border transition-all ${
    active
      ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20'
      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50/50'
  }`;

const normalizeList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = Boolean((location.state as { onboarding?: boolean } | null)?.onboarding);

  const initialProfile = useMemo(() => getInitialProfile(user), [user]);
  const [profiles, setProfiles] = useState<UserProfile[]>(() => getStoredProfiles(user?.id));
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [healthConditionsInput, setHealthConditionsInput] = useState(initialProfile.healthConditions.join(', '));
  const [allergiesInput, setAllergiesInput] = useState(initialProfile.allergies.join(', '));
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const nextProfiles = getStoredProfiles(user?.id);
    setProfiles(nextProfiles);
    const current = getInitialProfile(user);
    setProfile(current);
    setHealthConditionsInput(current.healthConditions.join(', '));
    setAllergiesInput(current.allergies.join(', '));
  }, [user]);

  const handleChange = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setError('');
    setMessage('');
  };

  const setWorkoutPreference = (field: keyof UserProfile['workoutPreferences'], value: string | number) => {
    setProfile((prev) => ({
      ...prev,
      workoutPreferences: {
        ...prev.workoutPreferences,
        [field]: value,
      },
    }));
    setError('');
  };

  const setDayPreference = (day: Weekday, value: DietPreference) => {
    setProfile((prev) => ({
      ...prev,
      weeklyDietPreferences: {
        ...prev.weeklyDietPreferences,
        [day]: value,
      },
      dietPreference: prev.dietPreference || value,
    }));
    setError('');
  };

  const healthConditions = normalizeList(healthConditionsInput);
  const allergies = normalizeList(allergiesInput);
  const bmi = calculateBmi(profile.weight, profile.height);
  const bmiCategory = getBmiCategory(bmi);
  const recommendedGoal = getSuggestedGoalFromBmi(bmi);
  const goalAdvice = getGoalAdviceFromBmi(bmi);

  const getProfileValidationError = (index: number) => {
    if (index === 0) {
      if (profile.name.trim().length < 2) return 'Enter a valid name.';
      if (profile.relation.trim().length < 2) return 'Enter who this plan is for, like Self, Mom, Dad, Son.';
      if (!profile.age) return 'Enter age.';
      if (profile.age < 15) return 'Age must be 15 or above to continue.';
      if (!profile.gender) return 'Select gender.';
      return '';
    }

    if (index === 1) {
      if (!profile.height || !profile.weight) return 'Enter height and weight.';
      if (!profile.goal || !profile.activityLevel) return 'Select goal and activity level.';
      return '';
    }

    if (index === 2) {
      if (profile.gender === 'male' && healthConditions.some((item) => femaleOnlyConditions.some((term) => item.includes(term)))) {
        return 'PCOS/PCOD and other female-only conditions cannot be selected for a male user.';
      }
      if (profile.gender === 'female' && healthConditions.some((item) => maleOnlyConditions.some((term) => item.includes(term)))) {
        return 'Male-only conditions cannot be selected for a female user.';
      }
      return '';
    }

    if (index === 3) {
      if (!WEEK_DAYS.every((day) => Boolean(profile.weeklyDietPreferences[day]))) {
        return 'Choose veg/non-veg/vegan/egg for all 7 days.';
      }
      return '';
    }

    if (index === 4) {
      if (!profile.workoutPreferences.daysPerWeek || profile.workoutPreferences.daysPerWeek < 1) return 'Choose workout days per week.';
      if (!profile.workoutPreferences.focus.trim()) return 'Enter workout focus.';
      return '';
    }

    return '';
  };

  const canGoNext = !getProfileValidationError(step);
  const canSave = stepTitles.every((_, idx) => !getProfileValidationError(idx));

  const switchToProfile = (nextProfile: UserProfile) => {
    if (!user) return;
    setActiveProfileId(user.id, nextProfile.id);
    setProfile(nextProfile);
    setHealthConditionsInput(nextProfile.healthConditions.join(', '));
    setAllergiesInput(nextProfile.allergies.join(', '));
    setStep(0);
    setError('');
    setMessage(`Switched to ${nextProfile.name || nextProfile.relation || 'profile'}.`);
  };

  const createProfile = () => {
    if (!user) return;
    if (profiles.length >= 3) {
      setError('Only 3 profiles are allowed for one email account.');
      return;
    }
    const fresh = createEmptyProfile();
    setActiveProfileId(user.id, fresh.id);
    setProfile(fresh);
    setHealthConditionsInput('');
    setAllergiesInput('');
    setStep(0);
    setError('');
    setMessage('New profile slot created. Fill the details step by step.');
  };

  const handleSave = () => {
    if (!user) return;

    const validationError = getProfileValidationError(0) || getProfileValidationError(1) || getProfileValidationError(2) || getProfileValidationError(3) || getProfileValidationError(4);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedProfile: UserProfile = {
      ...profile,
      name: profile.name.trim(),
      relation: profile.relation.trim(),
      healthConditions,
      allergies,
      dietPreference: profile.weeklyDietPreferences.Monday || profile.dietPreference,
      strictAllergyMode: true,
    };

    upsertStoredProfile(user.id, normalizedProfile);
    setActiveProfileId(user.id, normalizedProfile.id);

    const nextProfiles = getStoredProfiles(user.id);
    setProfiles(nextProfiles);
    setProfile(normalizedProfile);
    setMessage(`${normalizedProfile.name} saved. Smart meals and workouts will now use only this profile.`);
    setError('');

    if (onboarding) {
      navigate('/', { replace: true });
    }
  };

  const handleDelete = () => {
    if (!user) return;
    clearStoredProfile(user.id, profile.id);
    const nextProfiles = getStoredProfiles(user.id);
    setProfiles(nextProfiles);
    const next = nextProfiles[0] || createEmptyProfile();
    if (nextProfiles[0]) setActiveProfileId(user.id, next.id);
    setProfile(next);
    setHealthConditionsInput(next.healthConditions.join(', '));
    setAllergiesInput(next.allergies.join(', '));
    setStep(0);
    setMessage('Profile removed.');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-brand-600 via-brand-500 to-emerald-500 text-white p-6 md:p-8 shadow-2xl shadow-brand-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-slate-500 text-sm uppercase tracking-[0.24em] font-semibold">Multi-profile nutrition</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">{onboarding ? 'Create your first profile' : 'Manage up to 3 family profiles'}</h1>
            <p className="text-slate-600 max-w-2xl mt-3">Each email can hold up to three separate users, like Self, Mom, and Dad. Every meal, workout, and streak is generated only from the selected profile.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" className="bg-white/15 text-white border-white/20">{profiles.length} / 3 profiles used</Badge>
            <Button variant="secondary" className="bg-white text-brand-700 hover:bg-white/90" onClick={createProfile}>
              <Plus className="w-4 h-4 mr-2" />
              Add profile
            </Button>
          </div>
        </div>
      </div>

      {onboarding && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-600 mt-0.5" />
          <div>
            <p className="font-semibold text-brand-900">Onboarding lock is active</p>
            <p className="text-sm text-brand-700">Dashboard, meals, and workouts stay locked until the active profile is fully completed.</p>
          </div>
        </div>
      )}

      {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((item) => {
          const active = item.id === profile.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchToProfile(item)}
              className={`text-left rounded-[24px] p-5 border transition-all ${active ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-100' : 'border-slate-200 bg-white hover:border-brand-200 hover:-translate-y-0.5'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">{item.relation || 'Profile'}</p>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{item.name || 'Unnamed user'}</h3>
                </div>
                <Badge variant={isProfileComplete(item) ? 'success' : 'warning'}>{isProfileComplete(item) ? 'Ready' : 'Incomplete'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-white/80 border border-slate-100 px-3 py-2">Age {item.age || '--'}</div>
                <div className="rounded-2xl bg-white/80 border border-slate-100 px-3 py-2">{item.goal ? formatGoal(item.goal) : 'Goal not set'}</div>
              </div>
            </button>
          );
        })}

        {profiles.length < 3 && (
          <button
            type="button"
            onClick={createProfile}
            className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-8 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-all"
          >
            <Users className="w-8 h-8 text-brand-500" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Create another user</h3>
            <p className="mt-2 text-sm text-slate-500">Add Mom, Dad, or any family member under the same email.</p>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-6">
        <Card className="space-y-3 h-fit bg-white/70 backdrop-blur-xl text-slate-900 border-white/70 shadow-xl shadow-rose-100/40">
          {stepTitles.map((title, index) => (
            <button
              key={title}
              type="button"
              onClick={() => index <= step && setStep(index)}
              className={`w-full text-left rounded-2xl px-4 py-3 transition ${index === step ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-600'} ${index > step ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <p className="text-[11px] uppercase font-bold tracking-[0.22em]">Step {index + 1}</p>
              <p className="font-semibold mt-1">{title}</p>
            </button>
          ))}
        </Card>

        <Card className="space-y-6 min-h-[620px] rounded-[28px] border-0 shadow-2xl shadow-brand-100/30">
          {step === 0 && (
            <>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-brand-50 text-brand-600"><User className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Who is this profile for?</h3>
                  <p className="text-sm text-slate-500">Use real user data only. No assumptions are made anywhere in the app.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full name" value={profile.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Example: Sita Reddy" />
                <Input label="Relation" value={profile.relation} onChange={(e) => handleChange('relation', e.target.value)} placeholder="Self / Mom / Dad / Son" />
                <Input label="Age" type="number" min="15" value={profile.age || ''} onChange={(e) => handleChange('age', Number(e.target.value))} placeholder="15+ only" error={profile.age > 0 && profile.age < 15 ? 'Age must be 15 or above.' : undefined} />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {genders.map((item) => (
                    <button key={item.id} type="button" className={chipClass(profile.gender === item.id)} onClick={() => handleChange('gender', item.id)}>{item.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Heart className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Real-time BMI and goal fit</h3>
                  <p className="text-sm text-slate-500">BMI is calculated instantly and used to suggest the right goal.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Weight (kg)" type="number" min="1" step="0.1" value={profile.weight || ''} onChange={(e) => handleChange('weight', Number(e.target.value))} />
                <Input label="Height (cm)" type="number" min="1" value={profile.height || ''} onChange={(e) => handleChange('height', Number(e.target.value))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Live BMI</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{bmi || '--'}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">Category: {bmiCategory}</p>
                </div>
                <div className={`rounded-2xl p-4 border ${bmiCategory === 'Normal' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
                  <p className="text-sm font-semibold">Goal recommendation</p>
                  <p className="mt-2">{goalAdvice || 'Enter valid height and weight to get a goal suggestion.'}</p>
                  {recommendedGoal && <p className="mt-2 text-sm">Recommended goal: <strong>{formatGoal(recommendedGoal)}</strong></p>}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {goals.map((item) => (
                    <button key={item.id} type="button" className={chipClass(profile.goal === item.id)} onClick={() => handleChange('goal', item.id)}>{item.label}</button>
                  ))}
                </div>
                {recommendedGoal && profile.goal && recommendedGoal !== profile.goal && (
                  <p className="text-xs text-amber-600">Selected goal differs from the BMI-based recommendation.</p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Activity level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activityLevels.map((item) => (
                    <button key={item.id} type="button" className={chipClass(profile.activityLevel === item.id)} onClick={() => handleChange('activityLevel', item.id)}>{item.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-50 text-red-500"><ShieldAlert className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Strict safety checks</h3>
                  <p className="text-sm text-slate-500">Allergy exclusions are strict. Gender-incompatible conditions are blocked.</p>
                </div>
              </div>
              <Input label="Health conditions" value={healthConditionsInput} onChange={(e) => setHealthConditionsInput(e.target.value)} placeholder="diabetes, thyroid, hypertension" />
              <Input label="Allergies" value={allergiesInput} onChange={(e) => setAllergiesInput(e.target.value)} placeholder="peanut, lactose, shellfish" />
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Strict allergy mode is always ON</p>
                  <p>Meals with listed allergy triggers or related ingredients are excluded before showing options.</p>
                </div>
              </div>
              {getProfileValidationError(2) && <p className="text-sm text-red-600">{getProfileValidationError(2)}</p>}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h3 className="font-bold text-slate-900 text-xl">Day-wise meal preference</h3>
                <p className="text-sm text-slate-500 mt-1">Set veg, non-veg, vegan, or egg for every day of the week.</p>
              </div>
              <div className="space-y-4">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="rounded-2xl border border-slate-100 p-4 space-y-3 bg-slate-50/70">
                    <p className="font-semibold text-slate-800">{day}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {dietOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={chipClass(profile.weeklyDietPreferences[day] === option.id)}
                          onClick={() => setDayPreference(day, option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><Dumbbell className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xl">Workout needs</h3>
                  <p className="text-sm text-slate-500">The workout API and workout log will use these preferences.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Workout days per week" type="number" min="1" max="7" value={profile.workoutPreferences.daysPerWeek || ''} onChange={(e) => setWorkoutPreference('daysPerWeek', Number(e.target.value))} />
                <Input label="Primary focus" value={profile.workoutPreferences.focus} onChange={(e) => setWorkoutPreference('focus', e.target.value)} placeholder="fat loss, strength, mobility" />
                <Input label="Equipment access" value={profile.workoutPreferences.equipmentAccess} onChange={(e) => setWorkoutPreference('equipmentAccess', e.target.value)} placeholder="home, gym, dumbbells, no equipment" className="sm:col-span-2" />
              </div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-xl">Review before saving</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4"><strong>Name:</strong> {profile.name || '--'}</div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong>Relation:</strong> {profile.relation || '--'}</div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong>Age/Gender:</strong> {profile.age || '--'} / {profile.gender || '--'}</div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong>BMI:</strong> {bmi || '--'} ({bmiCategory})</div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong>Goal/Activity:</strong> {profile.goal ? formatGoal(profile.goal) : '--'} / {profile.activityLevel || '--'}</div>
                <div className="rounded-2xl bg-slate-50 p-4"><strong>Strict allergies:</strong> {allergies.join(', ') || 'None entered'}</div>
                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2"><strong>Health conditions:</strong> {healthConditions.join(', ') || 'None entered'}</div>
                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2"><strong>Workout:</strong> {profile.workoutPreferences.daysPerWeek || '--'} days/week · {profile.workoutPreferences.focus || '--'} · {profile.workoutPreferences.equipmentAccess || '--'}</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} disabled={!canSave}><Save className="w-4 h-4 mr-2" />Save Profile</Button>
                {profiles.length > 0 && <Button variant="outline" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete Profile</Button>}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {step < stepTitles.length - 1 ? (
              <div className="text-right">
                {!canGoNext && <p className="text-xs text-red-500 mb-2">{getProfileValidationError(step)}</p>}
                <Button onClick={() => setStep((prev) => prev + 1)} disabled={!canGoNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
