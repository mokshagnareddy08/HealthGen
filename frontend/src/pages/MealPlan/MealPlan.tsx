import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Info, ShieldAlert, Sparkles, CheckCircle2, RefreshCcw, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import CircularProgress from "../../components/ui/CircularProgress";
import { useAuth } from "../../context/AuthContext";
import {
  calculateDailyCalories,
  formatGoal,
  getInitialProfile,
  getLoggedMealCountForDate,
  getMealLogs,
  getTodayDietPreference,
  saveMealLog,
} from "../../services/profileStorage";
import type { DietPreference, Weekday } from "../../types/profile";
import { WEEK_DAYS } from "../../types/profile";

type MealSlot = "Breakfast" | "Lunch" | "Snack" | "Dinner";

interface MealVariant {
  title: string;
  tags: string[];
}

interface MealCardData {
  slot: MealSlot;
  options: Array<MealVariant & { calories: number; protein: number; carbs: number; fats: number }>;
}

const today = WEEK_DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const AVOID_BY_CONDITION: Record<string, string[]> = {
  diabetes: ["white bread", "sweetened", "sweet", "sugar", "jalebi"],
  hypertension: ["pickle", "papad", "salted"],
  thyroid: ["soy isolate"],
  pcos: ["sweetened", "deep fried"],
};

const MEAL_LIBRARY: Record<DietPreference, Record<MealSlot, MealVariant[]>> = {
  veg: {
    Breakfast: [
      { title: "Moong dal chilla with mint chutney", tags: ["high protein", "fiber"] },
      { title: "Vegetable oats upma with curd", tags: ["balanced", "light"] },
      { title: "Ragi dosa with sambar", tags: ["south indian", "steady energy"] },
      { title: "Besan toast with cucumber salad", tags: ["quick", "savory"] },
      { title: "Paneer millet bowl with fruit", tags: ["muscle support", "filling"] },
      { title: "Poha with peanuts and sprouts", tags: ["classic", "protein boost"] },
    ],
    Lunch: [
      { title: "Dal, brown rice, sabzi, salad", tags: ["balanced", "traditional"] },
      { title: "Paneer roti roll with veggie slaw", tags: ["portable", "protein"] },
      { title: "Rajma quinoa bowl", tags: ["fiber rich", "smart carbs"] },
      { title: "Sambar rice with beetroot poriyal", tags: ["comfort", "gut friendly"] },
      { title: "Mixed veg khichdi with curd", tags: ["easy digestion", "soft"] },
      { title: "Palak dal with jowar roti", tags: ["iron rich", "balanced"] },
    ],
    Snack: [
      { title: "Greek yogurt with berries and seeds", tags: ["protein", "cooling"] },
      { title: "Roasted chana with guava", tags: ["fiber", "budget"] },
      { title: "Buttermilk with nuts", tags: ["light", "hydration"] },
      { title: "Sprouts chaat", tags: ["fresh", "protein"] },
      { title: "Apple with peanut butter", tags: ["satiety", "energy"] },
      { title: "Paneer cubes with tomato salsa", tags: ["savory", "lean protein"] },
    ],
    Dinner: [
      { title: "Paneer tikka with sautéed vegetables", tags: ["high protein", "light dinner"] },
      { title: "Dal soup with phulka and stir fry beans", tags: ["light", "balanced"] },
      { title: "Vegetable tofu pulao", tags: ["mixed protein", "comfort"] },
      { title: "Khichdi with lauki sabzi", tags: ["digestive rest", "gentle"] },
      { title: "Palak paneer with millet roti", tags: ["iron rich", "protein"] },
      { title: "Curd rice with carrot beans poriyal", tags: ["cooling", "simple"] },
    ],
  },
  "non-veg": {
    Breakfast: [
      { title: "Egg bhurji with multigrain toast", tags: ["protein", "quick"] },
      { title: "Chicken oats cheela", tags: ["smart protein", "filling"] },
      { title: "Egg dosa wrap", tags: ["south indian", "portable"] },
      { title: "Omelette with fruit and toast", tags: ["balanced", "easy"] },
      { title: "Chicken poha bowl", tags: ["high protein", "savory"] },
      { title: "Boiled eggs with vegetable upma", tags: ["steady energy", "simple"] },
    ],
    Lunch: [
      { title: "Grilled chicken rice bowl with salad", tags: ["lean protein", "balanced"] },
      { title: "Fish curry with red rice and veg", tags: ["omega rich", "classic"] },
      { title: "Chicken roti wrap with curd dip", tags: ["portable", "high protein"] },
      { title: "Egg curry with phulka and beans", tags: ["comfort", "protein"] },
      { title: "Chicken millet pulao", tags: ["smart carbs", "filling"] },
      { title: "Fish tikka with quinoa tabbouleh", tags: ["light", "fresh"] },
    ],
    Snack: [
      { title: "Hung curd dip with veggie sticks", tags: ["high protein", "snack"] },
      { title: "Boiled eggs with fruit", tags: ["simple", "satiety"] },
      { title: "Chicken soup cup", tags: ["savory", "comfort"] },
      { title: "Greek yogurt with seeds", tags: ["cooling", "protein"] },
      { title: "Tuna salad crackers", tags: ["portable", "light"] },
      { title: "Roasted makhana and buttermilk", tags: ["crunchy", "light"] },
    ],
    Dinner: [
      { title: "Herb chicken with veggies", tags: ["lean dinner", "protein"] },
      { title: "Fish stew with sautéed greens", tags: ["light", "omega rich"] },
      { title: "Egg fried millet with veg", tags: ["balanced", "quick"] },
      { title: "Chicken soup with phulka", tags: ["comfort", "gentle"] },
      { title: "Pepper fish with roasted vegetables", tags: ["clean", "filling"] },
      { title: "Chicken dal bowl", tags: ["mixed protein", "smart dinner"] },
    ],
  },
  vegan: {
    Breakfast: [
      { title: "Tofu scramble with millet toast", tags: ["vegan protein", "savory"] },
      { title: "Peanut poha with sprouts", tags: ["budget", "protein"] },
      { title: "Ragi porridge with nuts", tags: ["gentle", "energy"] },
      { title: "Vegan chilla with green chutney", tags: ["fiber", "high protein"] },
      { title: "Overnight oats with chia", tags: ["cooling", "easy"] },
      { title: "Tofu dosa roll", tags: ["south indian", "portable"] },
    ],
    Lunch: [
      { title: "Chickpea rice bowl with tahini lemon dressing", tags: ["balanced", "fiber"] },
      { title: "Rajma millet plate with salad", tags: ["smart carbs", "protein"] },
      { title: "Tofu stir-fry with soba", tags: ["asian style", "lean"] },
      { title: "Sambar quinoa bowl", tags: ["comfort", "light"] },
      { title: "Vegan khichdi with roasted veg", tags: ["gentle", "digestive"] },
      { title: "Black chana roti plate", tags: ["high protein", "traditional"] },
    ],
    Snack: [
      { title: "Roasted chana with coconut water", tags: ["hydration", "light"] },
      { title: "Hummus with cucumber sticks", tags: ["fresh", "savory"] },
      { title: "Trail mix with fruit", tags: ["portable", "energy"] },
      { title: "Sprouts salad bowl", tags: ["fiber", "protein"] },
      { title: "Peanut butter banana bites", tags: ["satiety", "simple"] },
      { title: "Tofu cubes with salsa", tags: ["savory", "protein"] },
    ],
    Dinner: [
      { title: "Tofu curry with millet roti", tags: ["protein", "balanced"] },
      { title: "Lentil soup with sautéed vegetables", tags: ["light dinner", "fiber"] },
      { title: "Vegan pulao with edamame", tags: ["smart carbs", "protein"] },
      { title: "Chickpea salad wrap", tags: ["portable", "light"] },
      { title: "Stuffed capsicum with quinoa", tags: ["colorful", "balanced"] },
      { title: "Pumpkin dal bowl", tags: ["comfort", "gentle"] },
    ],
  },
  eggetarian: {
    Breakfast: [
      { title: "Masala omelette with oats toast", tags: ["egg protein", "savory"] },
      { title: "Egg dosa with chutney", tags: ["south indian", "quick"] },
      { title: "Boiled egg poha bowl", tags: ["balanced", "classic"] },
      { title: "Egg bhurji millet wrap", tags: ["portable", "protein"] },
      { title: "Vegetable omelette with fruit", tags: ["light", "complete"] },
      { title: "Egg oats pancake", tags: ["high protein", "filling"] },
    ],
    Lunch: [
      { title: "Egg curry with brown rice and salad", tags: ["balanced", "comfort"] },
      { title: "Paneer egg roll bowl", tags: ["double protein", "smart"] },
      { title: "Dal khichdi with boiled eggs", tags: ["gentle", "protein"] },
      { title: "Egg fried rice with vegetables", tags: ["quick", "savory"] },
      { title: "Spinach egg roti plate", tags: ["iron rich", "balanced"] },
      { title: "Sambar rice with egg bhurji side", tags: ["south indian", "protein"] },
    ],
    Snack: [
      { title: "Greek yogurt with seeds", tags: ["protein", "cooling"] },
      { title: "Boiled eggs with fruit", tags: ["simple", "satiety"] },
      { title: "Roasted makhana and curd dip", tags: ["crunchy", "light"] },
      { title: "Paneer cubes with cucumber", tags: ["savory", "protein"] },
      { title: "Egg salad cup", tags: ["portable", "filling"] },
      { title: "Buttermilk with nuts", tags: ["cooling", "light"] },
    ],
    Dinner: [
      { title: "Paneer egg bhurji with phulka", tags: ["high protein", "light"] },
      { title: "Egg soup with sautéed veg", tags: ["gentle", "easy digestion"] },
      { title: "Egg curry millet bowl", tags: ["balanced", "comfort"] },
      { title: "Vegetable omelette plate", tags: ["quick dinner", "lean"] },
      { title: "Dal soup with egg tikki", tags: ["protein", "warm"] },
      { title: "Palak egg bowl", tags: ["iron rich", "balanced"] },
    ],
  },
};

const slotRatios: Record<MealSlot, number> = { Breakfast: 0.24, Lunch: 0.34, Snack: 0.14, Dinner: 0.28 };
const slotProteinRatios: Record<MealSlot, number> = { Breakfast: 0.25, Lunch: 0.34, Snack: 0.12, Dinner: 0.29 };

const hash = (value: string) =>
  value.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);

const toDateKey = () => new Date().toISOString().slice(0, 10);

const ingredientsByWord: Record<string, string[]> = {
  paneer: ["paneer", "capsicum", "onion", "spices"],
  chicken: ["chicken", "herbs", "vegetables", "olive oil"],
  fish: ["fish", "lemon", "greens", "pepper"],
  egg: ["egg", "onion", "tomato", "pepper"],
  tofu: ["tofu", "sesame", "vegetables", "sauce"],
  dal: ["dal", "turmeric", "cumin", "garlic"],
  oats: ["oats", "vegetables", "seeds", "curd"],
  salad: ["greens", "tomato", "cucumber", "dressing"],
  poha: ["flattened rice", "peas", "peanut", "lemon"],
  dosa: ["dosa batter", "sambar", "chutney", "spices"],
};

const getMealVisual = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("salad")) return { emoji: "🥗", bg: "from-emerald-200 via-lime-100 to-white" };
  if (lower.includes("chicken")) return { emoji: "🍗", bg: "from-orange-200 via-rose-100 to-white" };
  if (lower.includes("fish")) return { emoji: "🐟", bg: "from-sky-200 via-cyan-100 to-white" };
  if (lower.includes("egg")) return { emoji: "🍳", bg: "from-amber-100 via-yellow-50 to-white" };
  if (lower.includes("paneer")) return { emoji: "🧀", bg: "from-fuchsia-100 via-rose-50 to-white" };
  if (lower.includes("tofu")) return { emoji: "🥬", bg: "from-teal-100 via-emerald-50 to-white" };
  if (lower.includes("yogurt") || lower.includes("curd")) return { emoji: "🥣", bg: "from-sky-100 via-blue-50 to-white" };
  return { emoji: "🍽️", bg: "from-brand-100 via-white to-rose-50" };
};

const getIngredients = (title: string) => {
  const lower = title.toLowerCase();
  for (const [key, items] of Object.entries(ingredientsByWord)) {
    if (lower.includes(key)) return items;
  }
  return ["fresh produce", "whole grains", "herbs", "spices"];
};

const getMealNote = (tags: string[], protein: number, calories: number) => {
  if (protein >= 22) return "Protein rich pick for stronger recovery and satiety.";
  if (calories < 300) return "Light option that keeps energy steady without feeling heavy.";
  if (tags.includes("balanced")) return "Balanced meal with carbs, protein, and fiber together.";
  return "Smart everyday meal designed around your profile and daily target.";
};

const withMacros = (
  meal: MealVariant,
  slot: MealSlot,
  caloriesTarget: number,
  weight: number,
  goal: string,
  variation: number
) => {
  const goalBoost = goal === "weight-gain" ? 60 : goal === "weight-loss" ? -40 : 0;
  const calories = Math.max(120, Math.round(caloriesTarget * slotRatios[slot] + goalBoost + variation * 18));
  const proteinBase = goal === "weight-gain" ? weight * 1.8 : goal === "weight-loss" ? weight * 1.5 : weight * 1.3;
  const protein = Math.max(6, Math.round(proteinBase * slotProteinRatios[slot] + variation));
  const fats = Math.max(5, Math.round((calories * 0.24) / 9));
  const carbs = Math.max(12, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { ...meal, calories, protein, carbs, fats };
};

const buildMeals = (
  diet: DietPreference,
  day: Weekday,
  caloriesTarget: number,
  weight: number,
  goal: string,
  allergies: string[],
  conditions: string[],
  profileId: string,
  slotRounds: Record<string, number>
): MealCardData[] => {
  const library = MEAL_LIBRARY[diet];
  const conditionAvoid = conditions.flatMap((condition) => AVOID_BY_CONDITION[condition] || []);
  const strictAvoid = [...allergies, ...conditionAvoid].map((item) => item.toLowerCase());

  return (["Breakfast", "Lunch", "Snack", "Dinner"] as MealSlot[]).map((slot) => {
    const pool = library[slot].filter(
      (meal) => !strictAvoid.some((item) => meal.title.toLowerCase().includes(item))
    );

    const source = pool.length ? pool : library[slot];
    const seed = Math.abs(hash(`${profileId}-${day}-${slot}-${goal}-${slotRounds[slot] ?? 0}`));
    const used = new Set<number>();
    const options = [] as MealCardData["options"];

    while (options.length < 3 && used.size < source.length) {
      const index = (seed + options.length * 2) % source.length;
      const finalIndex = used.has(index) ? source.findIndex((_, i) => !used.has(i)) : index;
      if (finalIndex === -1) break;

      used.add(finalIndex);
      options.push(withMacros(source[finalIndex], slot, caloriesTarget, weight, goal, options.length));
    }

    return { slot, options };
  });
};

const MealPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useMemo(() => getInitialProfile(user), [user]);

  const storageKey = `healthgen_meal_state_${user?.id || profile.id}`;

  const [selectedDay, setSelectedDay] = useState<Weekday>(today);
  const [generated, setGenerated] = useState(false);
  const [optionIndexes, setOptionIndexes] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [slotRounds, setSlotRounds] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      if (parsed.selectedDay) setSelectedDay(parsed.selectedDay);
      if (typeof parsed.generated === "boolean") setGenerated(parsed.generated);
      if (parsed.slotRounds) setSlotRounds(parsed.slotRounds);
      if (parsed.optionIndexes) setOptionIndexes(parsed.optionIndexes);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const saveMealState = (
    nextGenerated: boolean,
    nextSelectedDay: Weekday,
    nextSlotRounds: Record<string, number>,
    nextOptionIndexes: Record<string, number>
  ) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        generated: nextGenerated,
        selectedDay: nextSelectedDay,
        slotRounds: nextSlotRounds,
        optionIndexes: nextOptionIndexes,
      })
    );
  };

  const dailyCalories = calculateDailyCalories(profile);
  const caloriesTarget = dailyCalories || 2000;
  const selectedDiet = getTodayDietPreference(profile, selectedDay) as DietPreference;

  const todayKey = toDateKey();
  const logsToday = getLoggedMealCountForDate(user?.id, profile.id, todayKey);
  const mealLogs = getMealLogs(user?.id, profile.id);
  const todayMeals = mealLogs.filter((log) => log.date === todayKey);

  const caloriesEatenToday = todayMeals.reduce((sum, log) => sum + (log.calories || 0), 0);
  const proteinToday = todayMeals.reduce((sum, log) => sum + (log.protein || 0), 0);
  const carbsToday = todayMeals.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const fatsToday = todayMeals.reduce((sum, log) => sum + (log.fats || 0), 0);

  const proteinTarget = profile.weight
    ? Math.round(profile.weight * (profile.goal === "weight-gain" ? 1.8 : profile.goal === "weight-loss" ? 1.5 : 1.3))
    : 120;

  const fatsTarget = caloriesTarget ? Math.round((caloriesTarget * 0.25) / 9) : 50;

  const carbsTarget = caloriesTarget
    ? Math.max(80, Math.round((caloriesTarget - proteinTarget * 4 - fatsTarget * 9) / 4))
    : 180;

  const strictNotes = [
    `Allergy exclusion: ${profile.allergies.join(", ") || "none listed"}`,
    `Health conditions: ${profile.healthConditions.join(", ") || "none listed"}`,
    `Diet for ${selectedDay}: ${selectedDiet || "not selected"}`,
  ];

  const mealCards = useMemo(
    () =>
      generated && selectedDiet
        ? buildMeals(
            selectedDiet,
            selectedDay,
            caloriesTarget,
            profile.weight,
            profile.goal,
            profile.allergies,
            profile.healthConditions,
            profile.id,
            slotRounds
          )
        : [],
    [generated, selectedDiet, selectedDay, caloriesTarget, profile, slotRounds]
  );

  const handleGenerate = () => {
    const freshRounds = {};
    const freshIndexes = {};

    setGenerated(true);
    setSlotRounds(freshRounds);
    setOptionIndexes(freshIndexes);
    setMessage("Fresh meal cards are ready. Use regenerate inside any meal card for separate options.");

    saveMealState(true, selectedDay, freshRounds, freshIndexes);
  };

  const handleRegenerateMeal = (slot: MealSlot) => {
    const updatedRounds = {
      ...slotRounds,
      [slot]: (slotRounds[slot] ?? 0) + 1,
    };

    const updatedIndexes = {
      ...optionIndexes,
      [slot]: 0,
    };

    setGenerated(true);
    setSlotRounds(updatedRounds);
    setOptionIndexes(updatedIndexes);
    setMessage(`${slot} regenerated with fresh options.`);

    saveMealState(true, selectedDay, updatedRounds, updatedIndexes);
  };

  const handleSelectOption = (slot: MealSlot, index: number) => {
    const updatedIndexes = {
      ...optionIndexes,
      [slot]: index,
    };

    setOptionIndexes(updatedIndexes);
    saveMealState(generated, selectedDay, slotRounds, updatedIndexes);
  };

  const handleChangeDay = (day: Weekday) => {
    setSelectedDay(day);
    setGenerated(false);
    setMessage("");
    setSlotRounds({});
    setOptionIndexes({});
    saveMealState(false, day, {}, {});
  };

  const handleLogMeal = (
    slot: MealSlot,
    title: string,
    calories: number,
    protein: number,
    carbs: number,
    fats: number
  ) => {
    if (!user?.id) return;

    saveMealLog(user.id, profile.id, {
      day: selectedDay,
      date: toDateKey(),
      slot,
      title,
      calories,
      protein,
      carbs,
      fats,
      loggedAt: new Date().toISOString(),
    });

    setMessage(`Meal logged. ${calories} calories added to today's intake.`);
  };

    return (
    <div className="w-full max-w-[1520px] mx-auto px-3 md:px-5 py-4 space-y-4">
      <div className="rounded-[28px] border border-white/70 bg-white/70 backdrop-blur-2xl shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full bg-white/70 shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-black">HealthGen meals</p>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 leading-tight">Meals your way</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">Goal: {formatGoal(profile.goal)}</Badge>
          <Badge variant="success">Logged: {logsToday}/4</Badge>
        </div>
      </div>

      {message && (
        <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <Card className="rounded-[34px] border border-white/70 overflow-hidden bg-white/60 backdrop-blur-2xl shadow-[0_30px_90px_-50px_rgba(15,23,42,0.45)] p-0">
          <div className="relative min-h-[310px] p-5 bg-gradient-to-br from-rose-50 via-white to-sky-100 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-sky-200/50 blur-3xl" />

            <div className="relative flex items-center justify-between text-slate-500 text-sm">
              <Button variant="ghost" size="sm" className="!p-0 h-auto rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-semibold">[{todayMeals.length}] Meals Added</span>
            </div>

            <div className="relative mx-auto mt-6 w-[150px] h-[150px] rounded-full bg-gradient-to-br from-emerald-100 via-white to-sky-100 flex items-center justify-center shadow-[0_30px_75px_rgba(34,197,94,0.23)] border border-white/80">
              <span className="text-[78px]">🥗</span>
              <span className="absolute -top-2 right-5 text-2xl animate-pulse">🫛</span>
              <span className="absolute bottom-8 -left-1 text-3xl">🥒</span>
              <span className="absolute -right-3 bottom-12 text-3xl">🥬</span>
            </div>

            <div className="relative text-center mt-7">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Meals Your Way</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[260px] mx-auto">
                Pick, switch, log, and regenerate meals with compact visual cards.
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[34px] border border-white/70 bg-white/65 backdrop-blur-2xl shadow-[0_30px_90px_-50px_rgba(15,23,42,0.4)] p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-slate-950 text-xl">Generate meal slides</h3>
              </div>
              <p className="text-slate-500 mt-2 text-sm max-w-2xl">
                Select a weekday and generate 4 meals. Each meal has compact alternates, nutrition, and individual regeneration.
              </p>
            </div>

            <Button onClick={handleGenerate} disabled={!selectedDiet || !caloriesTarget} className="rounded-full px-5">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {selectedDay}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {WEEK_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => handleChangeDay(day)}
                className={`px-3.5 py-2 rounded-full text-sm font-bold transition-all ${
                  selectedDay === day
                    ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                    : "bg-white/80 text-slate-600 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3 mt-5 text-sm">
            {strictNotes.map((note) => (
              <div key={note} className="rounded-[20px] bg-white/70 p-3 text-slate-700 border border-white shadow-sm">
                {note}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="rounded-[30px] border border-white/70 bg-white/65 backdrop-blur-2xl p-4 shadow-[0_22px_70px_-45px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-black">Today&apos;s progress</p>
            <h3 className="text-base font-black text-slate-950 mt-0.5">Meal tracking at a glance</h3>
          </div>
          <Badge variant="success">{todayMeals.length} meals logged today</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-[24px] bg-white/75 border border-white p-3 flex justify-center shadow-sm">
            <CircularProgress value={caloriesEatenToday} target={caloriesTarget} label="Calories" unit="kcal" size={88} strokeWidth={9} strokeColor="#fb923c" subtitle="Logged today" />
          </div>
          <div className="rounded-[24px] bg-white/75 border border-white p-3 flex justify-center shadow-sm">
            <CircularProgress value={proteinToday} target={proteinTarget} label="Protein" unit="g" size={88} strokeWidth={9} strokeColor="#34d399" subtitle="Logged today" />
          </div>
          <div className="rounded-[24px] bg-white/75 border border-white p-3 flex justify-center shadow-sm">
            <CircularProgress value={carbsToday} target={carbsTarget} label="Carbs" unit="g" size={88} strokeWidth={9} strokeColor="#60a5fa" subtitle="Logged today" />
          </div>
          <div className="rounded-[24px] bg-white/75 border border-white p-3 flex justify-center shadow-sm">
            <CircularProgress value={fatsToday} target={fatsTarget} label="Fats" unit="g" size={88} strokeWidth={9} strokeColor="#c084fc" subtitle="Logged today" />
          </div>
        </div>
      </Card>

      {!generated ? (
        <Card className="text-center py-12 rounded-[34px] border border-white/70 bg-white/70 backdrop-blur-2xl shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)] space-y-4">
          <h3 className="text-2xl font-black text-slate-950">No meals generated yet</h3>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Choose a day and generate meals to see your personalized cards here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {mealCards.map((mealCard) => {
            const optionIndex = optionIndexes[mealCard.slot] ?? 0;
            const activeOption = mealCard.options[optionIndex];
            const visual = getMealVisual(activeOption.title);
            const ingredients = getIngredients(activeOption.title);
            const note = getMealNote(activeOption.tags, activeOption.protein, activeOption.calories);

            return (
              <Card
                key={mealCard.slot}
                className="rounded-[34px] border border-white/70 bg-white/70 backdrop-blur-2xl shadow-[0_28px_80px_-48px_rgba(15,23,42,0.42)] overflow-hidden p-0"
              >
                <div className="grid md:grid-cols-[190px_1fr] min-h-[320px]">
                  <div className={`relative overflow-hidden bg-gradient-to-br ${visual.bg} p-4 flex flex-col justify-between`}>
                    <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-white/45 blur-2xl" />
                    <div className="absolute -bottom-14 -left-14 w-36 h-36 rounded-full bg-emerald-200/35 blur-2xl" />

                    <div className="relative flex items-center justify-between text-slate-500">
                      <span className="text-[10px] font-black tracking-[0.2em] uppercase">{mealCard.slot}</span>
                      <Heart className="w-5 h-5" />
                    </div>

                    <div className="relative mx-auto my-4 w-[112px] h-[112px] rounded-full bg-gradient-to-br from-white via-slate-50 to-sky-100 flex items-center justify-center shadow-[0_28px_55px_rgba(15,23,42,0.15)] border border-white/80">
                      <span className="text-[54px]">{visual.emoji}</span>
                    </div>

                    <div className="relative">
                      <h3 className="text-lg font-black text-slate-950 leading-tight line-clamp-3">
                        {activeOption.title}
                      </h3>
                      <p className="text-slate-500 mt-2 text-xs leading-relaxed line-clamp-3">{note}</p>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-black">
                          Selected for {selectedDay}
                        </p>
                        <h4 className="text-lg font-black text-slate-950 mt-0.5">Ingredients & nutrition</h4>
                      </div>
                      <Badge variant="success">{selectedDay}</Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                      <div className="rounded-[18px] bg-slate-50/90 p-2 border border-slate-100">
                        <p className="text-[11px] text-slate-400">Calories</p>
                        <p className="font-black text-slate-950 text-sm mt-0.5">{activeOption.calories}</p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50/90 p-2 border border-slate-100">
                        <p className="text-[11px] text-slate-400">Protein</p>
                        <p className="font-black text-slate-950 text-sm mt-0.5">{activeOption.protein}g</p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50/90 p-2 border border-slate-100">
                        <p className="text-[11px] text-slate-400">Carbs</p>
                        <p className="font-black text-slate-950 text-sm mt-0.5">{activeOption.carbs}g</p>
                      </div>
                      <div className="rounded-[18px] bg-slate-50/90 p-2 border border-slate-100">
                        <p className="text-[11px] text-slate-400">Fats</p>
                        <p className="font-black text-slate-950 text-sm mt-0.5">{activeOption.fats}g</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="font-black text-slate-950 text-sm">Ingredients</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ingredients.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-full bg-white/80 border border-slate-100 text-[11px] font-semibold text-slate-600"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeOption.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-black text-slate-950 mb-2">Alternates</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {mealCard.options.map((option, index) => {
                          const smallVisual = getMealVisual(option.title);

                          return (
                            <button
                              key={`${mealCard.slot}-${option.title}`}
                              type="button"
                              onClick={() => handleSelectOption(mealCard.slot, index)}
                              className={`min-w-[112px] rounded-[20px] p-2 text-left border transition-all ${
                                optionIndex === index
                                  ? "border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-200/40"
                                  : "border-slate-100 bg-white/80 hover:border-emerald-200"
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${smallVisual.bg} flex items-center justify-center text-xl mx-auto shadow-sm`}>
                                {smallVisual.emoji}
                              </div>

                              <p className="font-black text-slate-950 mt-2 text-[11px] leading-snug line-clamp-2">
                                {option.title}
                              </p>

                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                {option.tags.join(" • ")}
                              </p>

                              <div className="flex items-center justify-between mt-2 text-[10px]">
                                <span className="font-bold text-slate-700">{option.calories} kcal</span>
                                <CheckCircle2 className={`w-4 h-4 ${optionIndex === index ? "text-emerald-600" : "text-slate-300"}`} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto pt-2 [&_button]:rounded-full [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm">
                      <Button
                        onClick={() =>
                          handleLogMeal(
                            mealCard.slot,
                            activeOption.title,
                            activeOption.calories,
                            activeOption.protein,
                            activeOption.carbs,
                            activeOption.fats
                          )
                        }
                      >
                        Log this meal
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleSelectOption(mealCard.slot, ((optionIndexes[mealCard.slot] ?? 0) + 1) % mealCard.options.length)}
                      >
                        Try next
                      </Button>

                      <Button variant="outline" onClick={() => handleRegenerateMeal(mealCard.slot)}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealPlan;