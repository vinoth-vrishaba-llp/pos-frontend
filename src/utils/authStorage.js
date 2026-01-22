// src/utils/authStorage.js
// Using localStorage for persistence across browser sessions (POS system)

export const getAccessToken = () =>
  localStorage.getItem("accessToken");

export const setAccessToken = (token) =>
  localStorage.setItem("accessToken", token);

export const clearAuth = () =>
  localStorage.removeItem("accessToken");
