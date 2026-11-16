import os
from infisical_sdk import InfisicalSDKClient

def load_secrets():

    # Initialize Infisical client
    client = InfisicalSDKClient(
        host="https://app.infisical.com"
    )

    # Authenticate using ECS Task Role (AWS IAM)
    client.auth.aws_auth.login(
        identity_id=os.environ["INFISICAL_IDENTITY_ID"]
    )

    # Fetch secrets from Infisical
    response = client.secrets.list_secrets(
        project_id=os.environ["INFISICAL_PROJECT_ID"],
        environment_slug="prod",
        secret_path="/",
        view_secret_value=True
    )

    # Inject secrets 
    for secret in response.secrets:
        os.environ[secret.secretKey] = secret.secretValue

    print("Infisical secrets loaded successfully")
