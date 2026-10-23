
pipeline {
    agent any

    environment {
        AWS_REGION     = 'ap-south-1'
        ECR_REPOSITORY = 'rag_codebase'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Image Details') {
            steps {
                script {
                    env.AWS_ACCOUNT_ID = sh(
                        script: 'aws sts get-caller-identity --query Account --output text',
                        returnStdout: true
                    ).trim()

                    env.ECR_REGISTRY =
                        "${env.AWS_ACCOUNT_ID}.dkr.ecr.${env.AWS_REGION}.amazonaws.com"

                    env.IMAGE_TAG = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region "$AWS_REGION" |
                    docker login --username AWS --password-stdin "$ECR_REGISTRY"
                '''
            }
        }

        stage('Build Application Images') {
            steps {
                sh '''
                    docker build -t "$ECR_REGISTRY/$ECR_REPOSITORY:frontend-$IMAGE_TAG" ./frontend
                    docker build -t "$ECR_REGISTRY/$ECR_REPOSITORY:backend-$IMAGE_TAG" ./backend
                    docker build -t "$ECR_REGISTRY/$ECR_REPOSITORY:aiservice-$IMAGE_TAG" -f Dockerfile .
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    docker push "$ECR_REGISTRY/$ECR_REPOSITORY:frontend-$IMAGE_TAG"
                    docker push "$ECR_REGISTRY/$ECR_REPOSITORY:backend-$IMAGE_TAG"
                    docker push "$ECR_REGISTRY/$ECR_REPOSITORY:aiservice-$IMAGE_TAG"
                '''
            }
        }
    }

    post {
        success {
            echo 'All application images were pushed to ECR.'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
        always {
            sh 'docker logout "$ECR_REGISTRY" || true'
        }
    }
}
