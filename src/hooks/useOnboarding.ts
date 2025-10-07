import { useState, useEffect } from 'react';

interface OnboardingState {
  tourCompleted: boolean;
  taskProgress: Record<string, boolean>;
  hasSeenTour: boolean;
  completionPercentage: number;
}

interface UseOnboardingProps {
  userRole: string;
  userId?: string;
}

export const useOnboarding = ({ userRole, userId }: UseOnboardingProps) => {
  const [state, setState] = useState<OnboardingState>({
    tourCompleted: false,
    taskProgress: {},
    hasSeenTour: false,
    completionPercentage: 0
  });

  // Keys for localStorage
  const tourKey = `onboarding_completed_${userRole}`;
  const tasksKey = `onboarding_tasks_${userRole}`;

  // Load state from localStorage
  useEffect(() => {
    const tourCompleted = localStorage.getItem(tourKey) === 'true';
    const savedTasks = localStorage.getItem(tasksKey);
    const taskProgress = savedTasks ? JSON.parse(savedTasks) : {};
    
    const completedTasks = Object.values(taskProgress).filter(Boolean).length;
    const totalTasks = Object.keys(taskProgress).length || 1;
    const completionPercentage = (completedTasks / totalTasks) * 100;

    setState({
      tourCompleted,
      taskProgress,
      hasSeenTour: tourCompleted,
      completionPercentage
    });
  }, [userRole, tourKey, tasksKey]);

  // Mark tour as completed
  const completeTour = () => {
    localStorage.setItem(tourKey, 'true');
    setState(prev => ({ ...prev, tourCompleted: true, hasSeenTour: true }));
  };

  // Mark task as completed
  const completeTask = (taskId: string) => {
    const updatedTasks = { ...state.taskProgress, [taskId]: true };
    localStorage.setItem(tasksKey, JSON.stringify(updatedTasks));
    
    const completedTasks = Object.values(updatedTasks).filter(Boolean).length;
    const totalTasks = Object.keys(updatedTasks).length;
    const completionPercentage = (completedTasks / totalTasks) * 100;

    setState(prev => ({
      ...prev,
      taskProgress: updatedTasks,
      completionPercentage
    }));

    // Analytics tracking (opzionale)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_task_completed', {
        task_id: taskId,
        user_role: userRole,
        completion_percentage: completionPercentage
      });
    }
  };

  // Reset onboarding (for testing)
  const resetOnboarding = () => {
    localStorage.removeItem(tourKey);
    localStorage.removeItem(tasksKey);
    setState({
      tourCompleted: false,
      taskProgress: {},
      hasSeenTour: false,
      completionPercentage: 0
    });
  };

  // Force show tour again
  const showTourAgain = () => {
    localStorage.removeItem(tourKey);
    setState(prev => ({ ...prev, tourCompleted: false, hasSeenTour: false }));
  };

  // Check if user should see onboarding
  const shouldShowOnboarding = () => {
    return !state.tourCompleted || state.completionPercentage < 100;
  };

  // Get onboarding status
  const getOnboardingStatus = () => {
    if (state.completionPercentage === 100) return 'completed';
    if (state.tourCompleted) return 'tour_completed';
    if (state.hasSeenTour) return 'in_progress';
    return 'not_started';
  };

  return {
    // State
    ...state,
    
    // Actions
    completeTour,
    completeTask,
    resetOnboarding,
    showTourAgain,
    
    // Helpers
    shouldShowOnboarding,
    getOnboardingStatus,
    
    // Status helpers
    isFullyCompleted: state.completionPercentage === 100,
    isTourCompleted: state.tourCompleted,
    hasIncompleteTasks: state.completionPercentage < 100
  };
};