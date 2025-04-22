import axios from "axios";

interface StartIngestionParams {
  userId: string;
  dataSourceId: string;
  dataSourceType: string;
  token: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/dev/ingest`;

export const startIngestion = async (params: StartIngestionParams) => {
  try {
    const response = await axios.post(API_URL, params, {
      headers: {
        Authorization: `Bearer ${params.token}`,
      },
    });

    const parsedData = JSON.parse(response.data);
    return {
      isError: false,
      jobId: parsedData.jobId,
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      error: "Error starting ingestion",
    };
  }
};
