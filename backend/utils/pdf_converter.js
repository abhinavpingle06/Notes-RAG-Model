
async function convertPdfToMarkdown(buffer, filename) {
    const API_KEY = process.env.ILOVEPDF_SECRET_KEY;
    const API = 'https://api.ilovepdf.com/v1';

    if (!API_KEY) {
        throw new Error('ILOVEPDF_SECRET_KEY is missing');
    }

    async function checkResponse(response) {
        if (!response.ok) {
            throw new Error(
                `iLovePDF error: ${response.status} ${await response.text()}`
            );
        }
        return response;
    }

    // 1. Create task
    const startResponse = await checkResponse(
        await fetch(`${API}/start/pdfmarkdown/in`, {
            headers: { 'X-Api-Key': API_KEY }
        })
    );

    const { server, task } = await startResponse.json();

    // 2. Upload PDF
    const form = new FormData();
    form.append('task', task);
    form.append(
        'file',
        new Blob([buffer], { type: 'application/pdf' }),
        filename
    );

    const uploadResponse = await checkResponse(
        await fetch(`https://${server}/v1/upload`, {
            method: 'POST',
            headers: { 'X-Api-Key': API_KEY },
            body: form
        })
    );

    const { server_filename } = await uploadResponse.json();

    // 3. Process PDF
    await checkResponse(
        await fetch(`https://${server}/v1/process`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task,
                tool: 'pdfmarkdown',
                files: [{
                    server_filename,
                    filename
                }]
            })
        })
    );

    // 4. Download Markdown
    const downloadResponse = await checkResponse(
        await fetch(`https://${server}/v1/download/${task}`, {
            headers: { 'X-Api-Key': API_KEY }
        })
    );

    return Buffer.from(await downloadResponse.arrayBuffer());
}

module.exports = convertPdfToMarkdown;
