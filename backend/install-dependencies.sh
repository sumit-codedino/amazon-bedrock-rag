#!/bin/bash

# Set the Lambda functions directory
LAMBDA_DIR="lambda"

# Install dependencies for each Lambda function
echo "Installing dependencies for Lambda functions..."

for dir in $LAMBDA_DIR/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies for $(basename $dir)..."
    (cd $dir && npm install)
  fi
done

echo "All dependencies installed successfully!" 