import { Achievement } from '../types/userExperience';

export const achievements: Achievement[] = [
  {
    id: 'first_flight',
    name: 'First Flight',
    description: 'Complete your first study session',
    icon: '🛫',
    progress: 0,
    requiredProgress: 1,
  },
  {
    id: 'steady_pilot',
    name: 'Steady Pilot',
    description: 'Maintain a 3-day study streak',
    icon: '✈️',
    progress: 0,
    requiredProgress: 3,
  },
  {
    id: 'high_flyer',
    name: 'High Flyer',
    description: 'Answer 50 questions correctly',
    icon: '🚀',
    progress: 0,
    requiredProgress: 50,
  },
  {
    id: 'master_navigator',
    name: 'Master Navigator',
    description: 'Complete all topics in a section',
    icon: '🧭',
    progress: 0,
    requiredProgress: 1,
  },
  {
    id: 'time_captain',
    name: 'Time Captain',
    description: 'Study for a total of 10 hours',
    icon: '⏰',
    progress: 0,
    requiredProgress: 600, // in minutes
  },
  {
    id: 'perfect_landing',
    name: 'Perfect Landing',
    description: 'Get 100% on a practice test',
    icon: '🎯',
    progress: 0,
    requiredProgress: 1,
  },
  {
    id: 'ground_commander',
    name: 'Ground Commander',
    description: 'Complete all study materials',
    icon: '👨‍✈️',
    progress: 0,
    requiredProgress: 1,
  },
  {
    id: 'weather_expert',
    name: 'Weather Expert',
    description: 'Master all weather-related topics',
    icon: '🌤️',
    progress: 0,
    requiredProgress: 1,
  },
];
