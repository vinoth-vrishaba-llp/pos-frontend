import api from "./axios";

export const fetchCategories = () =>
  api.get("/categories");
