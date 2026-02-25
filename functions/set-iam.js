const { GoogleAuth } = require('google-auth-library');

async function makeFunctionPublic() {
    console.log("Attempting to set IAM policy using Google Auth Library...");
    try {
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();

        const functionName = `projects/${projectId}/locations/us-central1/functions/createBookingApi`;
        const url = `https://cloudfunctions.googleapis.com/v1/${functionName}:setIamPolicy`;

        // Get current policy first (optional, but good practice)
        const getPolicyUrl = `https://cloudfunctions.googleapis.com/v1/${functionName}:getIamPolicy`;
        let policy = { bindings: [] };
        try {
            const res = await client.request({ url: getPolicyUrl, method: 'GET' });
            policy = res.data;
        } catch (e) {
            console.log("Could not get existing policy (it might be empty).");
        }

        // Add allUsers to roles/cloudfunctions.invoker
        const bindingIndex = policy.bindings.findIndex(b => b.role === 'roles/cloudfunctions.invoker');
        if (bindingIndex >= 0) {
            if (!policy.bindings[bindingIndex].members.includes('allUsers')) {
                policy.bindings[bindingIndex].members.push('allUsers');
            }
        } else {
            policy.bindings.push({
                role: 'roles/cloudfunctions.invoker',
                members: ['allUsers']
            });
        }

        console.log("Setting new policy:", JSON.stringify(policy, null, 2));

        const res = await client.request({
            url,
            method: 'POST',
            data: { policy }
        });

        console.log("Successfully made function public!");

    } catch (error) {
        console.error("Failed to set IAM policy.");
        if (error.response) {
            console.error("Error data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

makeFunctionPublic();
