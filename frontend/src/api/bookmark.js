import client from "./client";

export const bookmarkAPI = {
  getMyBookmarks: () => client.get("/bookmarks/me"),
  addBookmark: (questionId) => client.post(`/bookmarks/${questionId}`),
  removeBookmark: (questionId) => client.delete(`/bookmarks/${questionId}`),
};
