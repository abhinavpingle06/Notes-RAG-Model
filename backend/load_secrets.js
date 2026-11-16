const { InfisicalSDK } = require("@infisical/sdk");

async function loadSecrets() {
    const client = new InfisicalSDK({
        siteUrl: "https://app.infisical.com",
    });

    await client.auth().awsIamAuth.login({
        identityId: process.env.INFISICAL_IDENTITY_ID
    });

    const response = await client.secrets().listSecrets({
        environment: "prod",
        projectId: process.env.INFISICAL_PROJECT_ID,
        secretPath: "/",
        viewSecretValue: true,
    });

    for (const secret of response.secrets) {
        process.env[secret.secretKey] = secret.secretValue;
    }

    console.log("Secrets loaded successfully");
}

module.exports = loadSecrets;
