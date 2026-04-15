import client from "./client";

export const authAPI = {
  signup: (data) => client.post("/auth/signup", data),
  signin: (data) => client.post("/auth/signin", data),
  refresh: (refreshToken) => client.post("/auth/refresh", { refreshToken }),
};
