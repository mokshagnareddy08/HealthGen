#  HealthGen – AI Personalized Meal Planner

<p align="center">
  <b>AI-powered personalized meal planning & fitness tracking system</b><br/>
  Built to generate realistic, balanced, and constraint-aware diet plans
</p>

---

##  Badges

![React](https://img.shields.io/badge/Frontend-React-blue)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![Express](https://img.shields.io/badge/API-Express-lightgrey)
![Tailwind](https://img.shields.io/badge/UI-TailwindCSS-38B2AC)
![AI](https://img.shields.io/badge/AI-LLM-orange)
![Status](https://img.shields.io/badge/Status-Active-success)

---

##  Overview

**HealthGen** is an AI-driven system that generates **personalized meal plans and workout suggestions** based on user inputs such as:

- Age, height, weight  
- Fitness goals (fat loss / maintenance / muscle gain)  
- Dietary preferences (veg / non-veg / vegan)  
- Health conditions (diabetes, allergies, etc.)  
- Regional preferences (Indian cuisine focus)

Instead of static diet charts, HealthGen dynamically creates **balanced, realistic, and usable meal plans**.

---

##  Features

-  AI-generated personalized meal plans  
-  Regenerate meals individually  
-  Macro tracking (Calories, Protein, Carbs, Fats)  
-  Circular progress charts (daily intake & burn)  
-  Workout recommendations  
-  Multi-user profile support  
-  Constraint-aware (diseases, allergies)  
-  Region-based meal customization  
-  Persistent meal plans (saved until regenerated)

---

##  System Workflow

```
User Input → BMR/TDEE Calculation → Macro Targets
        ↓
   AI Meal Generation (LLM)
        ↓
Constraint Filtering (Allergy / Disease / Preference)
        ↓
Nutrition Calculation (Dataset-based)
        ↓
Macro Error Check
        ↓
Greedy Optimization Loop (if needed)
        ↓
Final Meal Plan → UI Dashboard → Logging & Tracking
```

---

##  Tech Stack

### Frontend
- React (Vite)
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js

### AI / Logic
- LLM-based meal generation  
- Rule-based filtering  
- Nutrition calculation engine (BMR, TDEE, macros)

### Database
- Supabase

---

##  Project Structure

```
HealthGen/
 ├── backend/
 ├── frontend/
 ├── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/mokshagnareddy08/HealthGen.git
cd HealthGen
```

### 2. Run Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
## 🔐 Environment Variables

-create `.env` files in frontend and backend and replace with your keys.
---

##  Key Highlights

- Real-world usable outputs (not just demo)
- Dataset-based nutrition calculation (no guessing)
- Handles multiple constraints simultaneously
- Optimization loop for macro accuracy

---

##  Future Improvements

- Food image recognition
- Mobile app version
- Real-time adaptive meal updates
- Advanced personalization

---

##  Author

**Mokshagna Reddy**  
https://github.com/mokshagnareddy08
