import { create } from 'zustand';

interface QuizState {
    sessionId: number | null;
    courseId: number | null;
    currentDifficulty: number;
    answeredCount: number;
    correctCount: number;
    startTime: Date | null;
    questionStartTime: Date | null;
    difficultyHistory: number[];

    // Actions
    startSession: (sessionId: number, courseId: number) => void;
    recordAnswer: (isCorrect: boolean, newDifficulty: number) => void;
    startQuestion: () => void;
    getTimeSpent: () => number;
    resetSession: () => void;
    syncProgress: (answeredCount: number, currentDifficulty: number) => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    sessionId: null,
    courseId: null,
    currentDifficulty: 5,
    answeredCount: 0,
    correctCount: 0,
    startTime: null,
    questionStartTime: null,
    difficultyHistory: [5],

    startSession: (sessionId: number, courseId: number) => {
        set({
            sessionId,
            courseId,
            currentDifficulty: 5,
            answeredCount: 0,
            correctCount: 0,
            startTime: new Date(),
            questionStartTime: null,
            difficultyHistory: [5],
        });
    },

    recordAnswer: (isCorrect: boolean, newDifficulty: number) => {
        set((state) => ({
            answeredCount: state.answeredCount + 1,
            correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
            currentDifficulty: newDifficulty,
            difficultyHistory: [...state.difficultyHistory, newDifficulty],
        }));
    },

    startQuestion: () => {
        set({ questionStartTime: new Date() });
    },

    getTimeSpent: () => {
        const { questionStartTime } = get();
        if (!questionStartTime) return 0;
        return Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
    },

    resetSession: () => {
        set({
            sessionId: null,
            courseId: null,
            currentDifficulty: 5,
            answeredCount: 0,
            correctCount: 0,
            startTime: null,
            questionStartTime: null,
            difficultyHistory: [5],
        });
    },

    syncProgress: (serverAnsweredCount: number, currentDifficulty: number) => {
        const { answeredCount } = get();

        if (answeredCount === 0 || serverAnsweredCount > answeredCount) {
            set({ answeredCount: serverAnsweredCount, currentDifficulty });
        }
    },
}));