import axios from "axios";
const BASE_URL = "https://www.omdbapi.com/";

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
