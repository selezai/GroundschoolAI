import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, StudyPlan, StudyProgress, GameStats, TopicMastery } from '../types/userExperience';

interface UserExperienceState {
  achievements: Achievement[];
  studyPlan: StudyPlan | null;
  progress: StudyProgress;
  gameStats: GameStats;
  topicMasteries: TopicMastery[];
  isLoading: boolean;
}

type Action =
  | { type: 'SET_ACHIEVEMENTS'; payload: Achievement[] }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'UPDATE_STUDY_PLAN'; payload: StudyPlan }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<StudyProgress> }
  | { type: 'UPDATE_GAME_STATS'; payload: Partial<GameStats> }
  | { type: 'UPDATE_TOPIC_MASTERY'; payload: TopicMastery }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: UserExperienceState = {
  achievements: [],
  studyPlan: null,
  progress: {
    totalTimeSpent: 0,
    sessionsCompleted: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    topicsCompleted: [],
    streakDays: 0,
  },
  gameStats: {
    currentLevel: 1,
    experiencePoints: 0,
    nextLevelThreshold: 100,
    rank: 'Rookie Pilot',
    streakCount: 0,
    dailyGoalProgress: 0,
  },
  topicMasteries: [],
  isLoading: true,
};

const UserExperienceContext = createContext<{
  state: UserExperienceState;
  unlockAchievement: (achievementId: string) => void;
  updateStudyPlan: (plan: StudyPlan) => void;
  updateProgress: (progress: Partial<StudyProgress>) => void;
  updateGameStats: (stats: Partial<GameStats>) => void;
  updateTopicMastery: (mastery: TopicMastery) => void;
} | null>(null);

const reducer = (state: UserExperienceState, action: Action): UserExperienceState => {
  switch (action.type) {
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload
            ? { ...achievement, unlockedAt: new Date() }
            : achievement
        ),
      };
    case 'UPDATE_STUDY_PLAN':
      return { ...state, studyPlan: action.payload };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: { ...state.progress, ...action.payload } };
    case 'UPDATE_GAME_STATS':
      return { ...state, gameStats: { ...state.gameStats, ...action.payload } };
    case 'UPDATE_TOPIC_MASTERY':
      return {
        ...state,
        topicMasteries: [
          ...state.topicMasteries.filter(t => t.topicId !== action.payload.topicId),
          action.payload,
        ],
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const UserExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadUserExperience();
  }, []);

  const loadUserExperience = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userExperience');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        dispatch({ type: 'SET_ACHIEVEMENTS', payload: parsedData.achievements || [] });
        if (parsedData.studyPlan) {
          dispatch({ type: 'UPDATE_STUDY_PLAN', payload: parsedData.studyPlan });
        }
        dispatch({ type: 'UPDATE_PROGRESS', payload: parsedData.progress || initialState.progress });
        dispatch({ type: 'UPDATE_GAME_STATS', payload: parsedData.gameStats || initialState.gameStats });
      }
    } catch (error) {
      console.error('Error loading user experience data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveUserExperience = async () => {
    try {
      await AsyncStorage.setItem('userExperience', JSON.stringify({
        achievements: state.achievements,
        studyPlan: state.studyPlan,
        progress: state.progress,
        gameStats: state.gameStats,
        topicMasteries: state.topicMasteries,
      }));
    } catch (error) {
      console.error('Error saving user experience data:', error);
    }
  };

  useEffect(() => {
    if (!state.isLoading) {
      saveUserExperience();
    }
  }, [state]);

  const unlockAchievement = (achievementId: string) => {
    dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: achievementId });
  };

  const updateStudyPlan = (plan: StudyPlan) => {
    dispatch({ type: 'UPDATE_STUDY_PLAN', payload: plan });
  };

  const updateProgress = (progress: Partial<StudyProgress>) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: progress });
  };

  const updateGameStats = (stats: Partial<GameStats>) => {
    dispatch({ type: 'UPDATE_GAME_STATS', payload: stats });
  };

  const updateTopicMastery = (mastery: TopicMastery) => {
    dispatch({ type: 'UPDATE_TOPIC_MASTERY', payload: mastery });
  };

  return (
    <UserExperienceContext.Provider
      value={{
        state,
        unlockAchievement,
        updateStudyPlan,
        updateProgress,
        updateGameStats,
        updateTopicMastery,
      }}
    >
      {children}
    </UserExperienceContext.Provider>
  );
};

export const useUserExperience = () => {
  const context = useContext(UserExperienceContext);
  if (!context) {
    throw new Error('useUserExperience must be used within a UserExperienceProvider');
  }
  return context;
};
