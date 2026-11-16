import { InfisicalSDK } from "@infisical/sdk";

export default async function loadSecrets() {
    const client = new InfisicalSDK({
        siteUrl: "https://app.infisical.com",
    });

    // Authenticate using AWS IAM Machine Identity
    await client.auth().awsIamAuth.login({
        identityId: process.env.INFISICAL_IDENTITY_ID
    });

    // Fetch production secrets
    const response = await client.secrets().listSecrets({
        environment: "prod",
        projectId: process.env.INFISICAL_PROJECT_ID,
        secretPath: "/",
        viewSecretValue: true,
    });

    // Inject secrets into process.env
    for (const secret of response.secrets) {
        process.env[secret.secretKey] = secret.secretValue;
    }

    console.log("Secrets loaded successfully");
}
