export interface ChatBot {
  chatBotId: string;
  chatBotName: string;
  chatBotDescription: string;
  dataSources: string[];
  s3DataSourceId: string | null;
  webPageDataSourceId: string | null;
  knowledgeBaseId: string | null;
  lastUpdatedAt: string;
}

export interface ChatBotList {
  chatBotList: ChatBot[];
}
