"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const uuid = require("uuid");
const generative_ai_cdk_constructs_1 = require("@cdklabs/generative-ai-cdk-constructs");
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
const iam = require("aws-cdk-lib/aws-iam");
const apigw = require("aws-cdk-lib/aws-apigateway");
const logs = require("aws-cdk-lib/aws-logs");
const cr = require("aws-cdk-lib/custom-resources");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const path_1 = require("path");
class BackendStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        /** Knowledge Base */
        const knowledgeBase = new generative_ai_cdk_constructs_1.bedrock.VectorKnowledgeBase(this, "knowledgeBase", {
            embeddingsModel: generative_ai_cdk_constructs_1.bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
        });
        /** S3 bucket for Bedrock data source */
        const docsBucket = new s3.Bucket(this, "docsbucket-" + uuid.v4(), {
            lifecycleRules: [
                {
                    expiration: aws_cdk_lib_1.Duration.days(10),
                },
            ],
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            removalPolicy: aws_cdk_lib_1.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        const s3DataSource = new generative_ai_cdk_constructs_1.bedrock.S3DataSource(this, "s3DataSource", {
            bucket: docsBucket,
            knowledgeBase: knowledgeBase,
            dataSourceName: "docs",
            chunkingStrategy: generative_ai_cdk_constructs_1.bedrock.ChunkingStrategy.fixedSize({
                maxTokens: 500,
                overlapPercentage: 20,
            }),
        });
        const s3PutEventSource = new aws_lambda_event_sources_1.S3EventSource(docsBucket, {
            events: [s3.EventType.OBJECT_CREATED_PUT],
        });
        /** Web Crawler for bedrock data Source */
        const createWebDataSourceLambda = new aws_lambda_nodejs_1.NodejsFunction(this, "CreateWebDataSourceHandler", {
            runtime: aws_lambda_1.Runtime.NODEJS_18_X,
            entry: (0, path_1.join)(__dirname, "../lambda/dataSource/index.js"),
            functionName: `create-web-data-source`,
            timeout: aws_cdk_lib_1.Duration.minutes(1),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
            },
        });
        const webDataSourceProvider = new cr.Provider(this, "WebDataSourceProvider", {
            onEventHandler: createWebDataSourceLambda,
            logRetention: logs.RetentionDays.ONE_DAY,
        });
        const createWebDataSourceResource = new aws_cdk_lib_1.CustomResource(this, "WebDataSourceResource", {
            serviceToken: webDataSourceProvider.serviceToken,
            resourceType: "Custom::BedrockWebDataSource",
        });
        /** S3 Ingest Lambda for S3 data source */
        const lambdaIngestionJob = new aws_lambda_nodejs_1.NodejsFunction(this, "IngestionJob", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            entry: (0, path_1.join)(__dirname, "../lambda/ingest/index.js"),
            functionName: `start-ingestion-trigger`,
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                DATA_SOURCE_ID: s3DataSource.dataSourceId,
                BUCKET_ARN: docsBucket.bucketArn,
            },
        });
        lambdaIngestionJob.addEventSource(s3PutEventSource);
        lambdaIngestionJob.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:StartIngestionJob"],
            resources: [knowledgeBase.knowledgeBaseArn, docsBucket.bucketArn],
        }));
        /** Web crawler ingest Lambda */
        const lambdaCrawlJob = new aws_lambda_nodejs_1.NodejsFunction(this, "CrawlJob", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            entry: (0, path_1.join)(__dirname, "../lambda/crawl/index.js"),
            functionName: `start-web-crawl-trigger`,
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                DATA_SOURCE_ID: createWebDataSourceResource.getAttString("DataSourceId"),
            },
        });
        lambdaCrawlJob.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:StartIngestionJob"],
            resources: [knowledgeBase.knowledgeBaseArn],
        }));
        const rule = new events.Rule(this, "ScheduleWebCrawlRule", {
            schedule: events.Schedule.rate(aws_cdk_lib_1.Duration.days(1)), // Adjust the cron expression as needed
        });
        rule.addTarget(new targets.LambdaFunction(lambdaCrawlJob));
        /** Lambda to update the list of seed urls in Web crawler data source*/
        const lambdaUpdateWebUrls = new aws_lambda_nodejs_1.NodejsFunction(this, "UpdateWebUrls", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            entry: (0, path_1.join)(__dirname, "../lambda/webUrlSources/index.js"),
            functionName: `update-web-crawl-urls`,
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                DATA_SOURCE_ID: createWebDataSourceResource.getAttString("DataSourceId"),
                DATA_SOURCE_NAME: "WebCrawlerDataSource",
            },
        });
        lambdaUpdateWebUrls.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:GetDataSource", "bedrock:UpdateDataSource"],
            resources: [knowledgeBase.knowledgeBaseArn],
        }));
        /** Lambda to get the list of seed urls in Web crawler data source*/
        const lambdaGetWebUrls = new aws_lambda_nodejs_1.NodejsFunction(this, "GetWebUrls", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            entry: (0, path_1.join)(__dirname, "../lambda/getUrls/index.js"),
            functionName: `get-web-crawl-urls`,
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                DATA_SOURCE_ID: createWebDataSourceResource.getAttString("DataSourceId"),
            },
        });
        lambdaGetWebUrls.addToRolePolicy(new iam.PolicyStatement({
            actions: ["bedrock:GetDataSource"],
            resources: [knowledgeBase.knowledgeBaseArn],
        }));
        createWebDataSourceLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                "bedrock:CreateDataSource",
                "bedrock:UpdateDataSource",
                "bedrock:DeleteDataSource",
            ],
            resources: [knowledgeBase.knowledgeBaseArn],
        }));
        const whitelistedIps = [aws_cdk_lib_1.Stack.of(this).node.tryGetContext("allowedip")];
        const apiGateway = new apigw.RestApi(this, "rag", {
            description: "API for RAG",
            restApiName: "rag-api",
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
            },
        });
        /** Lambda for handling retrieval and answer generation  */
        const lambdaQuery = new aws_lambda_nodejs_1.NodejsFunction(this, "Query", {
            runtime: aws_lambda_1.Runtime.NODEJS_20_X,
            entry: (0, path_1.join)(__dirname, "../lambda/query/index.js"),
            functionName: `query-bedrock-llm`,
            //query lambda duration set to match API Gateway max timeout
            timeout: aws_cdk_lib_1.Duration.seconds(29),
            environment: {
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
            },
        });
        lambdaQuery.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                "bedrock:RetrieveAndGenerate",
                "bedrock:Retrieve",
                "bedrock:InvokeModel",
            ],
            resources: ["*"],
        }));
        apiGateway.root
            .addResource("docs")
            .addMethod("POST", new apigw.LambdaIntegration(lambdaQuery));
        apiGateway.root
            .addResource("web-urls")
            .addMethod("POST", new apigw.LambdaIntegration(lambdaUpdateWebUrls));
        apiGateway.root
            .addResource("urls")
            .addMethod("GET", new apigw.LambdaIntegration(lambdaGetWebUrls));
        apiGateway.addUsagePlan("usage-plan", {
            name: "dev-docs-plan",
            description: "usage plan for dev",
            apiStages: [
                {
                    api: apiGateway,
                    stage: apiGateway.deploymentStage,
                },
            ],
            throttle: {
                rateLimit: 100,
                burstLimit: 200,
            },
        });
        //CfnOutput is used to log API Gateway URL and S3 bucket name to console
        new aws_cdk_lib_1.CfnOutput(this, "APIGatewayUrl", {
            value: apiGateway.url,
        });
        new aws_cdk_lib_1.CfnOutput(this, "DocsBucketName", {
            value: docsBucket.bucketName,
        });
    }
}
exports.BackendStack = BackendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhY2tlbmQtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBUXFCO0FBRXJCLHlDQUF5QztBQUN6QyxxRUFBK0Q7QUFDL0QsdURBQWlEO0FBQ2pELDZCQUE2QjtBQUM3Qix3RkFBZ0U7QUFDaEUsbUZBQXFFO0FBQ3JFLDJDQUEyQztBQUMzQyxvREFBb0Q7QUFFcEQsNkNBQTZDO0FBQzdDLG1EQUFtRDtBQUNuRCxpREFBaUQ7QUFDakQsMERBQTBEO0FBQzFELCtCQUE0QjtBQUU1QixNQUFhLFlBQWEsU0FBUSxtQkFBSztJQUNyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHFCQUFxQjtRQUVyQixNQUFNLGFBQWEsR0FBRyxJQUFJLHNDQUFPLENBQUMsbUJBQW1CLENBQ25ELElBQUksRUFDSixlQUFlLEVBQ2Y7WUFDRSxlQUFlLEVBQUUsc0NBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUI7U0FDcEUsQ0FDRixDQUFDO1FBRUYsd0NBQXdDO1FBQ3hDLE1BQU0sVUFBVSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsYUFBYSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNoRSxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsVUFBVSxFQUFFLHNCQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztpQkFDOUI7YUFDRjtZQUNELGlCQUFpQixFQUFFO2dCQUNqQixlQUFlLEVBQUUsSUFBSTtnQkFDckIsaUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIscUJBQXFCLEVBQUUsSUFBSTthQUM1QjtZQUNELFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMx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LE1BQU0sRUFBRSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFFdkUsVUFBVSxDQUFDLElBQUk7YUFDWixXQUFXLENBQUMsTUFBTSxDQUFDO2FBQ25CLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRW5FLFVBQVUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFO1lBQ3BDLElBQUksRUFBRSxlQUFlO1lBQ3JCLFdBQVcsRUFBRSxvQkFBb0I7WUFDakMsU0FBUyxFQUFFO2dCQUNUO29CQUNFLEdBQUcsRUFBRSxVQUFVO29CQUNmLEtBQUssRUFBRSxVQUFVLENBQUMsZUFBZTtpQkFDbEM7YUFDRjtZQUNELFFBQVEsRUFBRTtnQkFDUixTQUFTLEVBQUUsR0FBRztnQkFDZCxVQUFVLEVBQUUsR0FBRzthQUNoQjtTQUNGLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSxJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNuQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUc7U0FDdEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUNwQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVU7U0FDN0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL1BELG9DQStQQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFN0YWNrLFxuICBTdGFja1Byb3BzLFxuICBEdXJhdGlvbixcbiAgQ2ZuT3V0cHV0LFxuICBSZW1vdmFsUG9saWN5LFxuICBBcm5Gb3JtYXQsXG4gIEN1c3RvbVJlc291cmNlLFxufSBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqc1wiO1xuaW1wb3J0IHsgUnVudGltZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gXCJ1dWlkXCI7XG5pbXBvcnQgeyBiZWRyb2NrIH0gZnJvbSBcIkBjZGtsYWJzL2dlbmVyYXRpdmUtYWktY2RrLWNvbnN0cnVjdHNcIjtcbmltcG9ydCB7IFMzRXZlbnRTb3VyY2UgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ldmVudC1zb3VyY2VzXCI7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcbmltcG9ydCAqIGFzIGFwaWd3IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheVwiO1xuaW1wb3J0ICogYXMgd2FmdjIgZnJvbSBcImF3cy1jZGstbGliL2F3cy13YWZ2MlwiO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxvZ3NcIjtcbmltcG9ydCAqIGFzIGNyIGZyb20gXCJhd3MtY2RrLWxpYi9jdXN0b20tcmVzb3VyY2VzXCI7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1ldmVudHNcIjtcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0c1wiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBjbGFzcyBCYWNrZW5kU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLyoqIEtub3dsZWRnZSBCYXNlICovXG5cbiAgICBjb25zdCBrbm93bGVkZ2VCYXNlID0gbmV3IGJlZHJvY2suVmVjdG9yS25vd2xlZGdlQmFzZShcbiAgICAgIHRoaXMsXG4gICAgICBcImtub3dsZWRnZUJhc2VcIixcbiAgICAgIHtcbiAgICAgICAgZW1iZWRkaW5nc01vZGVsOiBiZWRyb2NrLkJlZHJvY2tGb3VuZGF0aW9uTW9kZWwuVElUQU5fRU1CRURfVEVYVF9WMSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLyoqIFMzIGJ1Y2tldCBmb3IgQmVkcm9jayBkYXRhIHNvdXJjZSAqL1xuICAgIGNvbnN0IGRvY3NCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiZG9jc2J1Y2tldC1cIiArIHV1aWQudjQoKSwge1xuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGV4cGlyYXRpb246IER1cmF0aW9uLmRheXMoMTApLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiB7XG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgICAgcmVtb3ZhbFBvbGljeTogUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzM0RhdGFTb3VyY2UgPSBuZXcgYmVkcm9jay5TM0RhdGFTb3VyY2UodGhpcywgXCJzM0RhdGFTb3VyY2VcIiwge1xuICAgICAgYnVja2V0OiBkb2NzQnVja2V0LFxuICAgICAga25vd2xlZGdlQmFzZToga25vd2xlZGdlQmFzZSxcbiAgICAgIGRhdGFTb3VyY2VOYW1lOiBcImRvY3NcIixcbiAgICAgIGNodW5raW5nU3RyYXRlZ3k6IGJlZHJvY2suQ2h1bmtpbmdTdHJhdGVneS5maXhlZFNpemUoe1xuICAgICAgICBtYXhUb2tlbnM6IDUwMCxcbiAgICAgICAgb3ZlcmxhcFBlcmNlbnRhZ2U6IDIwLFxuICAgICAgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBzM1B1dEV2ZW50U291cmNlID0gbmV3IFMzRXZlbnRTb3VyY2UoZG9jc0J1Y2tldCwge1xuICAgICAgZXZlbnRzOiBbczMuRXZlbnRUeXBlLk9CSkVDVF9DUkVBVEVEX1BVVF0sXG4gICAgfSk7XG5cbiAgICAvKiogV2ViIENyYXdsZXIgZm9yIGJlZHJvY2sgZGF0YSBTb3VyY2UgKi9cblxuICAgIGNvbnN0IGNyZWF0ZVdlYkRhdGFTb3VyY2VMYW1iZGEgPSBuZXcgTm9kZWpzRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgXCJDcmVhdGVXZWJEYXRhU291cmNlSGFuZGxlclwiLFxuICAgICAge1xuICAgICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgICBlbnRyeTogam9pbihfX2Rpcm5hbWUsIFwiLi4vbGFtYmRhL2RhdGFTb3VyY2UvaW5kZXguanNcIiksXG4gICAgICAgIGZ1bmN0aW9uTmFtZTogYGNyZWF0ZS13ZWItZGF0YS1zb3VyY2VgLFxuICAgICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIEtOT1dMRURHRV9CQVNFX0lEOiBrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VJZCxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3Qgd2ViRGF0YVNvdXJjZVByb3ZpZGVyID0gbmV3IGNyLlByb3ZpZGVyKFxuICAgICAgdGhpcyxcbiAgICAgIFwiV2ViRGF0YVNvdXJjZVByb3ZpZGVyXCIsXG4gICAgICB7XG4gICAgICAgIG9uRXZlbnRIYW5kbGVyOiBjcmVhdGVXZWJEYXRhU291cmNlTGFtYmRhLFxuICAgICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfREFZLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBjcmVhdGVXZWJEYXRhU291cmNlUmVzb3VyY2UgPSBuZXcgQ3VzdG9tUmVzb3VyY2UoXG4gICAgICB0aGlzLFxuICAgICAgXCJXZWJEYXRhU291cmNlUmVzb3VyY2VcIixcbiAgICAgIHtcbiAgICAgICAgc2VydmljZVRva2VuOiB3ZWJEYXRhU291cmNlUHJvdmlkZXIuc2VydmljZVRva2VuLFxuICAgICAgICByZXNvdXJjZVR5cGU6IFwiQ3VzdG9tOjpCZWRyb2NrV2ViRGF0YVNvdXJjZVwiLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvKiogUzMgSW5nZXN0IExhbWJkYSBmb3IgUzMgZGF0YSBzb3VyY2UgKi9cblxuICAgIGNvbnN0IGxhbWJkYUluZ2VzdGlvbkpvYiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCBcIkluZ2VzdGlvbkpvYlwiLCB7XG4gICAgICBydW50aW1lOiBSdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW50cnk6IGpvaW4oX19kaXJuYW1lLCBcIi4uL2xhbWJkYS9pbmdlc3QvaW5kZXguanNcIiksXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzdGFydC1pbmdlc3Rpb24tdHJpZ2dlcmAsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEtOT1dMRURHRV9CQVNFX0lEOiBrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VJZCxcbiAgICAgICAgREFUQV9TT1VSQ0VfSUQ6IHMzRGF0YVNvdXJjZS5kYXRhU291cmNlSWQsXG4gICAgICAgIEJVQ0tFVF9BUk46IGRvY3NCdWNrZXQuYnVja2V0QXJuLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGxhbWJkYUluZ2VzdGlvbkpvYi5hZGRFdmVudFNvdXJjZShzM1B1dEV2ZW50U291cmNlKTtcblxuICAgIGxhbWJkYUluZ2VzdGlvbkpvYi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcImJlZHJvY2s6U3RhcnRJbmdlc3Rpb25Kb2JcIl0sXG4gICAgICAgIHJlc291cmNlczogW2tub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUFybiwgZG9jc0J1Y2tldC5idWNrZXRBcm5dLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLyoqIFdlYiBjcmF3bGVyIGluZ2VzdCBMYW1iZGEgKi9cblxuICAgIGNvbnN0IGxhbWJkYUNyYXdsSm9iID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsIFwiQ3Jhd2xKb2JcIiwge1xuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgXCIuLi9sYW1iZGEvY3Jhd2wvaW5kZXguanNcIiksXG4gICAgICBmdW5jdGlvbk5hbWU6IGBzdGFydC13ZWItY3Jhd2wtdHJpZ2dlcmAsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEtOT1dMRURHRV9CQVNFX0lEOiBrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VJZCxcbiAgICAgICAgREFUQV9TT1VSQ0VfSUQ6XG4gICAgICAgICAgY3JlYXRlV2ViRGF0YVNvdXJjZVJlc291cmNlLmdldEF0dFN0cmluZyhcIkRhdGFTb3VyY2VJZFwiKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBsYW1iZGFDcmF3bEpvYi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcImJlZHJvY2s6U3RhcnRJbmdlc3Rpb25Kb2JcIl0sXG4gICAgICAgIHJlc291cmNlczogW2tub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUFybl0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBydWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsIFwiU2NoZWR1bGVXZWJDcmF3bFJ1bGVcIiwge1xuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLmRheXMoMSkpLCAvLyBBZGp1c3QgdGhlIGNyb24gZXhwcmVzc2lvbiBhcyBuZWVkZWRcbiAgICB9KTtcblxuICAgIHJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGxhbWJkYUNyYXdsSm9iKSk7XG5cbiAgICAvKiogTGFtYmRhIHRvIHVwZGF0ZSB0aGUgbGlzdCBvZiBzZWVkIHVybHMgaW4gV2ViIGNyYXdsZXIgZGF0YSBzb3VyY2UqL1xuXG4gICAgY29uc3QgbGFtYmRhVXBkYXRlV2ViVXJscyA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCBcIlVwZGF0ZVdlYlVybHNcIiwge1xuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgXCIuLi9sYW1iZGEvd2ViVXJsU291cmNlcy9pbmRleC5qc1wiKSxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHVwZGF0ZS13ZWItY3Jhd2wtdXJsc2AsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEtOT1dMRURHRV9CQVNFX0lEOiBrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VJZCxcbiAgICAgICAgREFUQV9TT1VSQ0VfSUQ6XG4gICAgICAgICAgY3JlYXRlV2ViRGF0YVNvdXJjZVJlc291cmNlLmdldEF0dFN0cmluZyhcIkRhdGFTb3VyY2VJZFwiKSxcbiAgICAgICAgREFUQV9TT1VSQ0VfTkFNRTogXCJXZWJDcmF3bGVyRGF0YVNvdXJjZVwiLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGxhbWJkYVVwZGF0ZVdlYlVybHMuYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbXCJiZWRyb2NrOkdldERhdGFTb3VyY2VcIiwgXCJiZWRyb2NrOlVwZGF0ZURhdGFTb3VyY2VcIl0sXG4gICAgICAgIHJlc291cmNlczogW2tub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUFybl0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvKiogTGFtYmRhIHRvIGdldCB0aGUgbGlzdCBvZiBzZWVkIHVybHMgaW4gV2ViIGNyYXdsZXIgZGF0YSBzb3VyY2UqL1xuXG4gICAgY29uc3QgbGFtYmRhR2V0V2ViVXJscyA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCBcIkdldFdlYlVybHNcIiwge1xuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgXCIuLi9sYW1iZGEvZ2V0VXJscy9pbmRleC5qc1wiKSxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGdldC13ZWItY3Jhd2wtdXJsc2AsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5taW51dGVzKDE1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEtOT1dMRURHRV9CQVNFX0lEOiBrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VJZCxcbiAgICAgICAgREFUQV9TT1VSQ0VfSUQ6XG4gICAgICAgICAgY3JlYXRlV2ViRGF0YVNvdXJjZVJlc291cmNlLmdldEF0dFN0cmluZyhcIkRhdGFTb3VyY2VJZFwiKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBsYW1iZGFHZXRXZWJVcmxzLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogW1wiYmVkcm9jazpHZXREYXRhU291cmNlXCJdLFxuICAgICAgICByZXNvdXJjZXM6IFtrbm93bGVkZ2VCYXNlLmtub3dsZWRnZUJhc2VBcm5dLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgY3JlYXRlV2ViRGF0YVNvdXJjZUxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBcImJlZHJvY2s6Q3JlYXRlRGF0YVNvdXJjZVwiLFxuICAgICAgICAgIFwiYmVkcm9jazpVcGRhdGVEYXRhU291cmNlXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOkRlbGV0ZURhdGFTb3VyY2VcIixcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBba25vd2xlZGdlQmFzZS5rbm93bGVkZ2VCYXNlQXJuXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IHdoaXRlbGlzdGVkSXBzID0gW1N0YWNrLm9mKHRoaXMpLm5vZGUudHJ5R2V0Q29udGV4dChcImFsbG93ZWRpcFwiKV07XG5cbiAgICBjb25zdCBhcGlHYXRld2F5ID0gbmV3IGFwaWd3LlJlc3RBcGkodGhpcywgXCJyYWdcIiwge1xuICAgICAgZGVzY3JpcHRpb246IFwiQVBJIGZvciBSQUdcIixcbiAgICAgIHJlc3RBcGlOYW1lOiBcInJhZy1hcGlcIixcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWd3LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLyoqIExhbWJkYSBmb3IgaGFuZGxpbmcgcmV0cmlldmFsIGFuZCBhbnN3ZXIgZ2VuZXJhdGlvbiAgKi9cblxuICAgIGNvbnN0IGxhbWJkYVF1ZXJ5ID0gbmV3IE5vZGVqc0Z1bmN0aW9uKHRoaXMsIFwiUXVlcnlcIiwge1xuICAgICAgcnVudGltZTogUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudHJ5OiBqb2luKF9fZGlybmFtZSwgXCIuLi9sYW1iZGEvcXVlcnkvaW5kZXguanNcIiksXG4gICAgICBmdW5jdGlvbk5hbWU6IGBxdWVyeS1iZWRyb2NrLWxsbWAsXG4gICAgICAvL3F1ZXJ5IGxhbWJkYSBkdXJhdGlvbiBzZXQgdG8gbWF0Y2ggQVBJIEdhdGV3YXkgbWF4IHRpbWVvdXRcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMjkpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgS05PV0xFREdFX0JBU0VfSUQ6IGtub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUlkLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGxhbWJkYVF1ZXJ5LmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgIFwiYmVkcm9jazpSZXRyaWV2ZUFuZEdlbmVyYXRlXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOlJldHJpZXZlXCIsXG4gICAgICAgICAgXCJiZWRyb2NrOkludm9rZU1vZGVsXCIsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGFwaUdhdGV3YXkucm9vdFxuICAgICAgLmFkZFJlc291cmNlKFwiZG9jc1wiKVxuICAgICAgLmFkZE1ldGhvZChcIlBPU1RcIiwgbmV3IGFwaWd3LkxhbWJkYUludGVncmF0aW9uKGxhbWJkYVF1ZXJ5KSk7XG5cbiAgICBhcGlHYXRld2F5LnJvb3RcbiAgICAgIC5hZGRSZXNvdXJjZShcIndlYi11cmxzXCIpXG4gICAgICAuYWRkTWV0aG9kKFwiUE9TVFwiLCBuZXcgYXBpZ3cuTGFtYmRhSW50ZWdyYXRpb24obGFtYmRhVXBkYXRlV2ViVXJscykpO1xuXG4gICAgYXBpR2F0ZXdheS5yb290XG4gICAgICAuYWRkUmVzb3VyY2UoXCJ1cmxzXCIpXG4gICAgICAuYWRkTWV0aG9kKFwiR0VUXCIsIG5ldyBhcGlndy5MYW1iZGFJbnRlZ3JhdGlvbihsYW1iZGFHZXRXZWJVcmxzKSk7XG5cbiAgICBhcGlHYXRld2F5LmFkZFVzYWdlUGxhbihcInVzYWdlLXBsYW5cIiwge1xuICAgICAgbmFtZTogXCJkZXYtZG9jcy1wbGFuXCIsXG4gICAgICBkZXNjcmlwdGlvbjogXCJ1c2FnZSBwbGFuIGZvciBkZXZcIixcbiAgICAgIGFwaVN0YWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgYXBpOiBhcGlHYXRld2F5LFxuICAgICAgICAgIHN0YWdlOiBhcGlHYXRld2F5LmRlcGxveW1lbnRTdGFnZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICB0aHJvdHRsZToge1xuICAgICAgICByYXRlTGltaXQ6IDEwMCxcbiAgICAgICAgYnVyc3RMaW1pdDogMjAwLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vQ2ZuT3V0cHV0IGlzIHVzZWQgdG8gbG9nIEFQSSBHYXRld2F5IFVSTCBhbmQgUzMgYnVja2V0IG5hbWUgdG8gY29uc29sZVxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgXCJBUElHYXRld2F5VXJsXCIsIHtcbiAgICAgIHZhbHVlOiBhcGlHYXRld2F5LnVybCxcbiAgICB9KTtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgXCJEb2NzQnVja2V0TmFtZVwiLCB7XG4gICAgICB2YWx1ZTogZG9jc0J1Y2tldC5idWNrZXROYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=