import client from "./client";

export const resultAPI = {
  saveResult: (data) => client.post("/results", data),
  getMyResults: () => client.get("/results/me"),
  getMyResultsByQuizSet: (quizSetId) => client.get(`/results/me/${quizSetId}`),
};
