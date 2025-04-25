import axios from "axios";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/user`;

export const getUserDetails = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}?userId=${userId}`);
    return {
      isError: false,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {
      isError: true,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
