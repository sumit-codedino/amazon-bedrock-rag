import axios from "axios";

interface CreateDataSourceParams {
  userId: string;
  chatBotId: string;
  dataSourceType: string;
  token: string;
}

interface CreateDataSourceResponse {
  isError: boolean;
  dataSourceId?: string;
  dataSourceType?: string;
  error?: string;
  message?: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/data-source`;

export const createDataSource = async (
  params: CreateDataSourceParams
): Promise<CreateDataSourceResponse> => {
  try {
    const response = await axios.post(API_URL, params, {
      headers: {
        Authorization: `Bearer ${params.token}`,
      },
    });
    const parsedData = JSON.parse(response.data);
    return {
      isError: false,
      dataSourceId: parsedData.dataSourceId,
      dataSourceType: parsedData.dataSourceType,
    };
  } catch (error) {
    console.error("Error creating data source:", error);
    return {
      isError: true,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the data source",
    };
  }
};
