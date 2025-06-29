# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the consent-demo project.

## Workflows

### 1. Create Version Tag (version-tag.yml)
- **Trigger**: Push to master branch
- **Purpose**: Automatically creates semantic version tags
- **Actions**:
  - Bumps version (default: patch)
  - Creates annotated git tag
  - Creates GitHub release

### 2. Build, Push to ECR, and Deploy (build-publish-deploy.yml)
- **Trigger**: 
  - Automatically after version tag creation
  - Manual via workflow_dispatch
- **Purpose**: Build Docker images, push to ECR, and deploy
- **Actions**:
  1. Build all Docker images
  2. Login to AWS ECR
  3. Push images with version tags to ECR
  4. Deploy to server via S3/Caddy

## Required GitHub Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: AWS access key with ECR push permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: (Optional) AWS region, defaults to us-east-1

### Deployment Secrets
- `SSH_PRIVATE_KEY`: SSH key for server deployment
- `TS_OAUTH_CLIENT_ID`: Tailscale OAuth client ID
- `TS_OAUTH_SECRET`: Tailscale OAuth secret

## ECR Setup

Before the workflows can push to ECR, you need to:

1. Create ECR repositories:
   ```bash
   ./scripts/aws/setup-ecr-repos.sh
   ```

2. Ensure AWS credentials have permissions for:
   - `ecr:GetAuthorizationToken`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:PutImage`
   - `ecr:InitiateLayerUpload`
   - `ecr:UploadLayerPart`
   - `ecr:CompleteLayerUpload`

## Workflow Process

1. **Developer merges PR to master**
2. **version-tag.yml** creates semantic version (e.g., v1.2.3)
3. **build-publish-deploy.yml** triggers:
   - Builds Docker images
   - Tags images with version: `v1.2.3` and `latest`
   - Pushes to ECR repositories:
     - `consent-demo/music-service`
     - `consent-demo/bank-service`
     - `consent-demo/music-service-ui`
     - `consent-demo/bank-service-ui`
   - Deploys to production server

## Version Management

- Production images use semantic versions from git tags
- Each image is tagged with both the version and `latest`
- ECR lifecycle policies keep only the 5 most recent versions
- Development builds can be pushed manually with `make push-dev`

## Manual Actions

### Push development build
From a feature branch:
```bash
make push-dev
```

### Trigger deployment manually
Go to Actions → "Build, Push to ECR, and Deploy" → Run workflow

## Troubleshooting

### ECR Push Fails
- Check AWS credentials are set in GitHub secrets
- Verify ECR repositories exist
- Check IAM permissions for ECR

### Version Tag Not Created
- Ensure you're pushing to master branch
- Check GitHub Actions permissions
- Verify GITHUB_TOKEN has write access

### Build Fails
- Check Docker build logs
- Ensure all services build locally
- Verify Dockerfile syntax