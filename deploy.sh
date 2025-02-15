#!/bin/bash
set -e
# Configuration
PROJECT_ID="lexicon-agent"
REGION="europe-west1"
SERVICE_NAME="react-frontend"

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Configure Docker to use gcloud credentials
gcloud auth configure-docker

# Push the image to Google Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated 