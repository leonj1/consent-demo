#!/bin/bash

# Exit on error
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ECR configuration
ECR_REGISTRY="945513556588.dkr.ecr.us-east-1.amazonaws.com"
AWS_REGION=${AWS_REGION:-"us-east-1"}

# Repository names
REPOS=(
    "consent-demo/music-service"
    "consent-demo/bank-service"
    "consent-demo/music-service-ui"
    "consent-demo/bank-service-ui"
)

# Lifecycle policy to keep only 5 most recent images
LIFECYCLE_POLICY='{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep only 5 most recent images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 5
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}'

echo -e "${YELLOW}Setting up ECR repositories for consent-demo...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured. Please configure AWS credentials.${NC}"
    exit 1
fi

# Create each repository
for repo in "${REPOS[@]}"; do
    echo -e "\nChecking repository: ${YELLOW}$repo${NC}"
    
    # Check if repository exists
    if aws ecr describe-repositories --repository-names "$repo" --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}✓ Repository already exists${NC}"
    else
        # Create repository
        echo "Creating repository..."
        if aws ecr create-repository --repository-name "$repo" --region "$AWS_REGION" &> /dev/null; then
            echo -e "${GREEN}✓ Repository created successfully${NC}"
        else
            echo -e "${RED}✗ Failed to create repository${NC}"
            exit 1
        fi
    fi
    
    # Apply lifecycle policy
    echo "Applying lifecycle policy..."
    if aws ecr put-lifecycle-policy \
        --repository-name "$repo" \
        --lifecycle-policy-text "$LIFECYCLE_POLICY" \
        --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}✓ Lifecycle policy applied (keep only 5 most recent images)${NC}"
    else
        echo -e "${RED}✗ Failed to apply lifecycle policy${NC}"
        exit 1
    fi
done

echo -e "\n${GREEN}All ECR repositories have been set up successfully!${NC}"
echo -e "\nRepositories created:"
for repo in "${REPOS[@]}"; do
    echo -e "  - ${ECR_REGISTRY}/${repo}"
done

echo -e "\n${YELLOW}You can now use 'make push' to push images to these repositories.${NC}"