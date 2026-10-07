import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Habit {
  id: string;
  label: string;
  icon: IconName;
  faith?: boolean;
}

export const HABITS: Habit[] = [
  { id: 'meditate', label: 'Meditate or breathe', icon: 'leaf-outline' },
  { id: 'move', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'stretch', label: 'Yoga / stretch', icon: 'body-outline' },
  { id: 'eat', label: 'Eat balanced meals', icon: 'nutrition-outline' },
  { id: 'water', label: 'Drink enough water', icon: 'water-outline' },
  { id: 'pray', label: 'Pray or read scripture', icon: 'book-outline', faith: true },
  { id: 'connect', label: 'Talk with someone', icon: 'chatbubbles-outline' },
  { id: 'sleep', label: 'Phone out of the bedroom', icon: 'moon-outline' },
];

export function habitsFor(faith: boolean): Habit[] {
  return HABITS.filter((h) => faith || !h.faith);
}

export type Category = 'meditation' | 'yoga' | 'exercise';

export interface Step {
  title: string;
  instruction: string;
  seconds: number;
}

export interface Session {
  id: string;
  category: Category;
  title: string;
  summary: string;
  /** Habit checked off when the session is completed */
  habit: string;
  /** Show the animated breathing guide during the session */
  breathing?: boolean;
  faith?: boolean;
  steps: Step[];
}

export const SESSIONS: Session[] = [
  // Meditation
  {
    id: 'box-breathing',
    category: 'meditation',
    title: 'Calm breathing',
    summary: 'Slow your heart rate and quiet the urge in 4 minutes.',
    habit: 'meditate',
    breathing: true,
    steps: [
      { title: 'Settle in', instruction: 'Sit comfortably. Drop your shoulders and unclench your jaw.', seconds: 30 },
      { title: 'Breathe with the circle', instruction: 'Breathe in as it grows, hold, and breathe out slowly as it shrinks.', seconds: 180 },
      { title: 'Notice', instruction: 'Let your breath return to normal. Notice how your body feels now compared to when you started.', seconds: 30 },
    ],
  },
  {
    id: 'urge-surfing',
    category: 'meditation',
    title: 'Urge surfing',
    summary: 'Observe a craving without acting on it until it passes.',
    habit: 'meditate',
    steps: [
      { title: 'Pause', instruction: 'Sit down somewhere safe. Put your phone face down after starting this timer.', seconds: 20 },
      { title: 'Locate the urge', instruction: 'Where do you feel it in your body? Chest, stomach, face, hands? Just notice — no judgement.', seconds: 60 },
      { title: 'Describe it', instruction: 'Is it hot or cold, tight or buzzing? How strong is it from 1 to 10? Name it: "This is an urge."', seconds: 60 },
      { title: 'Ride the wave', instruction: 'Breathe into the area. Imagine the urge as a wave rising — and you are surfing on top of it, not drowning in it.', seconds: 120 },
      { title: 'Watch it change', instruction: 'Notice the urge shifting or fading. Urges always peak and pass when you do not feed them.', seconds: 60 },
      { title: 'Choose your next step', instruction: 'Rate the urge again. Now choose something good to do next: walk, call someone, drink water.', seconds: 30 },
    ],
  },
  {
    id: 'body-scan',
    category: 'meditation',
    title: 'Body scan for sleep',
    summary: 'Release tension before bed, when urges often hit hardest.',
    habit: 'meditate',
    steps: [
      { title: 'Lie down', instruction: 'Lie on your back, arms by your sides. Close your eyes.', seconds: 30 },
      { title: 'Feet and legs', instruction: 'Bring attention to your feet, calves and thighs. Let them grow heavy.', seconds: 60 },
      { title: 'Hips and belly', instruction: 'Notice your belly rising and falling. Soften your stomach.', seconds: 60 },
      { title: 'Chest and back', instruction: 'Feel your back sinking into the bed. Let your chest be open and easy.', seconds: 60 },
      { title: 'Arms and hands', instruction: 'Relax your shoulders, arms and fingers.', seconds: 45 },
      { title: 'Face', instruction: 'Soften your forehead, eyes, jaw and tongue.', seconds: 45 },
      { title: 'Whole body', instruction: 'Feel your whole body resting, safe and still. Drift off whenever you are ready.', seconds: 60 },
    ],
  },
  {
    id: 'self-compassion',
    category: 'meditation',
    title: 'Self-compassion',
    summary: 'Replace shame with kindness — especially after a hard day.',
    habit: 'meditate',
    steps: [
      { title: 'Acknowledge', instruction: 'Place a hand on your chest. Say silently: "This is a moment of struggle."', seconds: 45 },
      { title: 'You are not alone', instruction: 'Remind yourself: "Many people fight this same battle. I am not alone."', seconds: 45 },
      { title: 'Be kind', instruction: 'Say: "May I be patient with myself. May I give myself the kindness I need."', seconds: 60 },
      { title: 'Rest', instruction: 'Breathe slowly and let the words sink in.', seconds: 60 },
    ],
  },
  {
    id: 'breath-prayer',
    category: 'meditation',
    title: 'Breath prayer',
    summary: 'A simple Christian contemplative practice paired with your breath.',
    habit: 'pray',
    faith: true,
    breathing: true,
    steps: [
      { title: 'Be still', instruction: '"Be still, and know that I am God." (Psalm 46:10) Sit quietly and slow your breathing.', seconds: 30 },
      { title: 'Pray with your breath', instruction: 'Breathe in: "Create in me a clean heart, O God." Breathe out: "Renew a right spirit within me."', seconds: 150 },
      { title: 'Listen', instruction: 'Rest in silence. Hand your urges, worries and shame over to God.', seconds: 60 },
      { title: 'Amen', instruction: 'Close with thanks for today and ask for strength for the next hour.', seconds: 20 },
    ],
  },

  // Yoga
  {
    id: 'morning-flow',
    category: 'yoga',
    title: 'Morning wake-up flow',
    summary: '8 minutes to start the day energised, not on your phone.',
    habit: 'stretch',
    steps: [
      { title: "Child's pose", instruction: 'Knees wide, big toes together, arms long in front. Breathe into your back.', seconds: 60 },
      { title: 'Cat-cow', instruction: 'On hands and knees, arch your back as you inhale, round it as you exhale.', seconds: 60 },
      { title: 'Downward dog', instruction: 'Lift your hips up and back. Pedal your heels gently.', seconds: 60 },
      { title: 'Low lunge (right)', instruction: 'Step the right foot forward, lower the back knee, lift your arms.', seconds: 45 },
      { title: 'Low lunge (left)', instruction: 'Switch sides: left foot forward, arms up, chest open.', seconds: 45 },
      { title: 'Standing forward fold', instruction: 'Walk to the front, fold forward with soft knees. Let your head hang.', seconds: 45 },
      { title: 'Mountain pose', instruction: 'Roll up slowly. Stand tall, feet grounded, palms forward. Set an intention for the day.', seconds: 45 },
      { title: 'Sun reach', instruction: 'Inhale arms overhead, exhale hands to heart. Repeat slowly.', seconds: 60 },
    ],
  },
  {
    id: 'evening-wind-down',
    category: 'yoga',
    title: 'Evening wind-down',
    summary: 'Gentle poses to calm the nervous system before bed.',
    habit: 'stretch',
    steps: [
      { title: 'Seated forward fold', instruction: 'Legs out straight, fold forward from the hips. Breathe slowly.', seconds: 60 },
      { title: 'Supine twist (right)', instruction: 'Lie down, drop both knees to the right, look left.', seconds: 60 },
      { title: 'Supine twist (left)', instruction: 'Drop both knees to the left, look right.', seconds: 60 },
      { title: 'Happy baby', instruction: 'Hold the outsides of your feet, knees wide, rock gently.', seconds: 45 },
      { title: 'Legs up the wall', instruction: 'Rest your legs up a wall or headboard. Let your arms fall open.', seconds: 120 },
      { title: 'Corpse pose', instruction: 'Lie flat and completely still. Let the day go.', seconds: 90 },
    ],
  },
  {
    id: 'urge-reset-yoga',
    category: 'yoga',
    title: '5-minute urge reset',
    summary: 'Move the restless energy out of your body.',
    habit: 'stretch',
    steps: [
      { title: 'Shake it out', instruction: 'Stand and shake your hands, arms and legs loosely.', seconds: 30 },
      { title: 'Chair pose', instruction: 'Sit back as if into a chair, arms up. Hold and breathe.', seconds: 45 },
      { title: 'Warrior II (right)', instruction: 'Wide stance, right knee bent, arms long, gaze over the right hand.', seconds: 45 },
      { title: 'Warrior II (left)', instruction: 'Switch sides. Strong legs, steady breath.', seconds: 45 },
      { title: 'Tree pose', instruction: 'Balance on one foot, the other on your calf or thigh. Switch halfway.', seconds: 60 },
      { title: "Child's pose", instruction: 'Rest forehead to floor. Notice the urge has less power now.', seconds: 60 },
    ],
  },

  // Exercise
  {
    id: 'urge-burner',
    category: 'exercise',
    title: '6-minute urge burner',
    summary: 'High-intensity bodyweight circuit. No equipment needed.',
    habit: 'move',
    steps: [
      { title: 'Jumping jacks', instruction: 'Fast and steady.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Push-ups', instruction: 'From toes or knees. Keep your body straight.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Squats', instruction: 'Hips back, chest up, drive through your heels.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Plank', instruction: 'Forearms down, squeeze your core and glutes.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Lunges', instruction: 'Alternate legs, knee just above the floor.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Mountain climbers', instruction: 'Drive knees to chest quickly.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'High knees', instruction: 'Run on the spot, knees up.', seconds: 30 },
      { title: 'Rest', instruction: 'Breathe.', seconds: 10 },
      { title: 'Burpees', instruction: 'Squat, jump back, jump in, jump up. Go at your own pace.', seconds: 30 },
      { title: 'Cool down', instruction: 'Walk around slowly and shake out your arms and legs.', seconds: 60 },
    ],
  },
  {
    id: 'beginner-strength',
    category: 'exercise',
    title: 'Beginner strength',
    summary: '15 minutes, 3 rounds. Builds confidence and discipline.',
    habit: 'move',
    steps: [
      ...[1, 2, 3].flatMap((round) => [
        { title: `Round ${round}: Squats`, instruction: '12–15 slow, controlled reps.', seconds: 60 },
        { title: `Round ${round}: Push-ups`, instruction: '8–12 reps (knees are fine).', seconds: 60 },
        { title: `Round ${round}: Glute bridges`, instruction: '15 reps, squeeze at the top.', seconds: 60 },
        { title: `Round ${round}: Plank`, instruction: 'Hold strong.', seconds: 45 },
        { title: 'Rest', instruction: 'Drink some water.', seconds: 60 },
      ]),
      { title: 'Stretch', instruction: 'Stretch your legs, chest and shoulders.', seconds: 60 },
    ],
  },
  {
    id: 'walk-it-off',
    category: 'exercise',
    title: 'Walk it off',
    summary: 'A 20-minute brisk walk outside — the simplest urge breaker.',
    habit: 'move',
    steps: [
      { title: 'Get outside', instruction: 'Put on shoes and leave the room. Being in public is a powerful barrier.', seconds: 60 },
      { title: 'Easy pace', instruction: 'Walk at a comfortable pace and warm up.', seconds: 240 },
      { title: 'Brisk pace', instruction: 'Speed up until you breathe harder but can still talk.', seconds: 600 },
      { title: 'Look around', instruction: 'Name 5 things you can see, 4 you can hear, 3 you can feel.', seconds: 180 },
      { title: 'Cool down', instruction: 'Slow down and head home. Notice how much calmer you feel.', seconds: 120 },
    ],
  },
];

export interface DietTip {
  title: string;
  body: string;
}

export const DIET_TIPS: DietTip[] = [
  {
    title: 'Remember HALT',
    body: 'Hungry, Angry, Lonely, Tired — urges are much stronger in these states. Regular meals are one of the easiest ways to lower your risk.',
  },
  {
    title: 'Protein-rich breakfast',
    body: 'Eggs, Greek yoghurt, oats with nuts or beans keep blood sugar steady and reduce mid-morning cravings and irritability.',
  },
  {
    title: 'Go easy on sugar spikes',
    body: 'Sugary snacks and energy drinks give a quick high followed by a crash — and crashes often bring urges. Pair carbs with protein or fibre.',
  },
  {
    title: 'Cut caffeine after 2 pm',
    body: 'Poor sleep is a major trigger. Stopping caffeine early in the afternoon helps you fall asleep instead of scrolling.',
  },
  {
    title: 'Watch alcohol',
    body: 'Alcohol lowers inhibition and is a common relapse trigger. If you drink, have a plan for getting home and putting your phone away.',
  },
  {
    title: 'Hydrate',
    body: 'Mild dehydration causes fatigue and low mood. Aim for a glass of water with every meal and keep a bottle nearby.',
  },
  {
    title: 'Omega-3s and whole foods',
    body: 'Oily fish, walnuts, chia and flaxseed, leafy greens and colourful vegetables support brain health and mood.',
  },
  {
    title: 'Simple meal ideas',
    body: 'Breakfast: eggs + wholegrain toast + fruit. Lunch: rice, beans or chicken, and vegetables. Dinner: fish or lentils with roasted veg. Snack: nuts, fruit, yoghurt.',
  },
];

export const CATEGORY_LABELS: Record<Category | 'diet', string> = {
  meditation: 'Meditate',
  yoga: 'Yoga',
  exercise: 'Exercise',
  diet: 'Diet',
};

export function sessionDuration(session: Session): number {
  return session.steps.reduce((total, s) => total + s.seconds, 0);
}
