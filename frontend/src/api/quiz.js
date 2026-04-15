import client from "./client";

export const quizAPI = {
  getQuizSets: (params) => client.get("/quiz-sets", { params }),
  getQuizSet: (id) => client.get(`/quiz-sets/${id}`),
  createQuizSet: (data) => client.post("/quiz-sets", data),
  updateQuizSet: (id, data) => client.put(`/quiz-sets/${id}`, data),
  deleteQuizSet: (id) => client.delete(`/quiz-sets/${id}`),
  getQuestions: (quizSetId) => client.get(`/quiz-sets/${quizSetId}/questions`),
  createQuestion: (quizSetId, data) =>
    client.post(`/quiz-sets/${quizSetId}/questions`, data),
  updateQuestion: (quizSetId, qid, data) =>
    client.put(`/quiz-sets/${quizSetId}/questions/${qid}`, data),
  deleteQuestion: (quizSetId, qid) =>
    client.delete(`/quiz-sets/${quizSetId}/questions/${qid}`),
  uploadPDF: (data) => client.post("/quiz-sets/upload-pdf", data),
  getParsingStatus: (jobId) => client.get(`/quiz-sets/upload-pdf/${jobId}`),
};
