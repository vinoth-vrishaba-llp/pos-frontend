// src/hooks/useAuth.js
import { useState } from "react";
import { login } from "@/api/auth.api";
import { setAccessToken } from "@/utils/authStorage";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signIn = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const res = await login({
        username,
        password,
      });

      setAccessToken(res.data.accessToken);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
}
