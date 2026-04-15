import { create } from "zustand";

const getAnswersKey = (quizSetId) => `quiz_answers_${quizSetId}`;

const useQuizStore = create((set, get) => ({
  currentQuizSet: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  mode: null,
  isSubmitted: false,
  result: null,

  setQuizSet: (quizSet, questions, mode) => {
    set({
      currentQuizSet: quizSet,
      questions,
      mode,
      currentQuestionIndex: 0,
      answers: {},
      isSubmitted: false,
      result: null,
    });
  },

  setAnswer: (questionId, optionId) => {
    const { answers, currentQuizSet } = get();
    const updated = { ...answers, [questionId]: optionId };
    set({ answers: updated });
    if (currentQuizSet?.quizSetId) {
      localStorage.setItem(
        getAnswersKey(currentQuizSet.quizSetId),
        JSON.stringify(updated),
      );
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  submitQuiz: () => {
    const { questions, answers } = get();
    const totalQuestions = questions.length;
    const wrongQuestionIds = [];
    let correctCount = 0;

    questions.forEach((q) => {
      if (answers[q.questionId] === q.correctOptionId) {
        correctCount++;
      } else {
        wrongQuestionIds.push(q.questionId);
      }
    });

    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    set({
      isSubmitted: true,
      result: { score, correctCount, totalQuestions, wrongQuestionIds },
    });
  },

  resetQuiz: () => {
    set({
      currentQuizSet: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      mode: null,
      isSubmitted: false,
      result: null,
    });
  },

  loadSavedAnswers: (quizSetId) => {
    const saved = localStorage.getItem(getAnswersKey(quizSetId));
    if (saved) {
      try {
        set({ answers: JSON.parse(saved) });
      } catch {
        // ignore parse errors
      }
    }
  },
}));

export default useQuizStore;
