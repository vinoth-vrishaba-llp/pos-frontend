// src/utils/authStorage.js

export const getAccessToken = () =>
  sessionStorage.getItem("accessToken");

export const setAccessToken = (token) =>
  sessionStorage.setItem("accessToken", token);

export const clearAuth = () =>
  sessionStorage.removeItem("accessToken");
