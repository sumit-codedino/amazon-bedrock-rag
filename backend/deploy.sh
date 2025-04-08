#!/bin/bash

# Exit on error
set -e

# Configuration
STACK_NAME="rag-app"
REGION="us-east-1"
DEPLOYMENT_BUCKET="centexautotitle.net"
S3_CODE_SERVICE_FOLDER="rag/services"
AWS_PROFILE="dev"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --profile $AWS_PROFILE)
KNOWLEDGE_BASE_BUCKET="arn:aws:s3:::open-search-service"

echo "Packaging the application..."
sam package \
    --template-file template.yml \
    --output-template-file serverless-output.yml \
    --s3-bucket "${DEPLOYMENT_BUCKET}" \
    --s3-prefix "${S3_CODE_SERVICE_FOLDER}" \
    --profile "${AWS_PROFILE}" \
    --region "${REGION}"

echo "Deploying the application..."
sam deploy \
    --template-file serverless-output.yml \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
    --profile "${AWS_PROFILE}" \
    --parameter-overrides \
        AccountId="${ACCOUNT_ID}" \
        KnowledgeBaseBucket="${KNOWLEDGE_BASE_BUCKET}"

echo "Retrieving stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text \
    --region "${REGION}" \
    --profile "${AWS_PROFILE}")

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`DocsBucketName`].OutputValue' \
    --output text \
    --region "${REGION}" \
    --profile "${AWS_PROFILE}")

echo "Deployment complete!"
echo "API Gateway URL: ${API_URL}"