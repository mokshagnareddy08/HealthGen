# NutriExpo Backend (Updated)

AI-powered nutrition and fitness assistant with family profile support.

## SQL Schema (Run in Supabase SQL Editor)

```sql
-- Profiles Table (Max 3 per account)
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  weight FLOAT NOT NULL,
  height FLOAT NOT NULL,
  goal TEXT NOT NULL,
  activity_level TEXT NOT NULL,
  diet_preference TEXT NOT NULL,
  diseases TEXT[] DEFAULT '{}',
  pin_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated Meal Logs
CREATE TABLE meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  calories FLOAT NOT NULL,
  protein FLOAT NOT NULL,
  carbs FLOAT NOT NULL,
  fats FLOAT NOT NULL,
  fiber FLOAT NOT NULL,
  date DATE DEFAULT CURRENT_DATE
);

-- Updated Activity Logs
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  calories_burnt FLOAT NOT NULL,
  date DATE DEFAULT CURRENT_DATE
);

-- Updated Weight Logs
CREATE TABLE weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  date DATE DEFAULT CURRENT_DATE
);
```
