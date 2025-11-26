// Chatbot functionality
if (typeof CONFIG === 'undefined') {
    console.error('CONFIG is not defined. Make sure config.js is loaded before script.js');
}

const chatbotMessages = document.getElementById('chatbotMessages');
const statusDisplay = document.getElementById('statusDisplay');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const printBtn = document.getElementById('printBtn');
const copyBtn = document.getElementById('copyBtn');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeImage = document.getElementById('removeImage');

let currentImage = null; // Store current image as base64

let conversationHistory = [
    {
        role: 'system',
        content: `You are a machine learning coding assistant. Your ONLY job is to output CODE ONLY - no explanations, no comments, no text before or after the code.

CRITICAL RULES:
- Output ONLY executable code
- No explanations, no "here's the code", no "this code does X"
- No markdown formatting like \`\`\`python or \`\`\`
- Just pure code that can be copied and run directly
- Include all necessary imports
- If multiple code blocks are needed, output them sequentially without any text between them
- Respond in Korean only if the user asks in Korean, but still output code only`
    }
];

let lastCodeOutput = ''; // Store the last code output

// Handle image paste
chatbotInput.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            
            reader.onload = (event) => {
                currentImage = event.target.result; // base64 string
                previewImage.src = currentImage;
                imagePreview.style.display = 'block';
            };
            
            reader.readAsDataURL(blob);
            break;
        }
    }
});

// Remove image
removeImage.addEventListener('click', () => {
    currentImage = null;
    imagePreview.style.display = 'none';
    previewImage.src = '';
});

// Send message function
async function sendMessage() {
    const message = chatbotInput.value.trim();
    const hasImage = currentImage !== null;
    
    if (!message && !hasImage) return;

    // Build user message content
    let userContent = [];
    
    if (hasImage) {
        userContent.push({
            type: 'image_url',
            image_url: {
                url: currentImage
            }
        });
    }
    
    if (message) {
        userContent.push({
            type: 'text',
            text: message
        });
    }
    
    conversationHistory.push({ 
        role: 'user', 
        content: userContent.length === 1 ? userContent[0] : userContent
    });
    
    // Store image for model selection before clearing
    const imageToSend = currentImage;
    
    // Clear input and image
    chatbotInput.value = '';
    currentImage = null;
    imagePreview.style.display = 'none';
    previewImage.src = '';
    
    // Show status
    statusDisplay.textContent = '처리 중...';
    
    try {
        // Use vision model if image is present
        const model = imageToSend ? 'openai/gpt-4o' : CONFIG.MODEL;
        
        const response = await fetch(CONFIG.OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'ML Coding Assistant'
            },
            body: JSON.stringify({
                model: model,
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let botMessage = data.choices[0]?.message?.content || '';
        
        // Extract only code from the response
        lastCodeOutput = extractCodeOnly(botMessage);
        
        // Store in hidden div
        chatbotMessages.textContent = lastCodeOutput;
        
        // Show completion status
        statusDisplay.textContent = '✓ 완료';
        
        conversationHistory.push({ role: 'assistant', content: botMessage });
    } catch (error) {
        console.error('Error:', error);
        statusDisplay.textContent = '✗ 오류 발생';
        lastCodeOutput = '';
    }
}

// Extract only code from response
function extractCodeOnly(text) {
    // Remove markdown code blocks but keep the code
    let code = text;
    
    // Extract code from ``` blocks
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
        // If there are code blocks, extract them
        code = matches.map(match => match[1].trim()).join('\n\n');
    } else {
        // If no code blocks, try to find code-like content
        // Remove common explanation patterns
        code = text
            .replace(/^.*?(?=import|from|def |class |#|print)/s, '') // Remove text before code
            .replace(/(?:^|\n)(?:이|이것|이 코드|코드는|다음과 같습니다|아래|위|참고|주의).*$/gmi, '') // Remove Korean explanations
            .replace(/(?:^|\n)(?:Here|This|The|Note|Note:|주의|참고).*$/gmi, '') // Remove English explanations
            .trim();
    }
    
    // If still looks like it has explanations, try to extract just the code part
    if (code.length < text.length * 0.5) {
        // If extracted code is much shorter, the original might be mostly code
        const lines = text.split('\n');
        const codeLines = lines.filter(line => 
            line.trim().startsWith('import') ||
            line.trim().startsWith('from') ||
            line.trim().startsWith('def ') ||
            line.trim().startsWith('class ') ||
            line.trim().startsWith('#') ||
            line.trim().startsWith('print') ||
            line.trim().match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*[=:]/) ||
            line.trim().length === 0 ||
            line.trim().match(/^[a-zA-Z_][a-zA-Z0-9_]*\(/)
        );
        
        if (codeLines.length > lines.length * 0.7) {
            code = codeLines.join('\n');
        }
    }
    
    return code || text; // Fallback to original if extraction fails
}

// Print function
printBtn.addEventListener('click', () => {
    if (!lastCodeOutput) {
        alert('출력된 코드가 없습니다.');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>코드 출력</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; white-space: pre-wrap; }
                    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <pre>${lastCodeOutput}</pre>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
});

// Copy function
copyBtn.addEventListener('click', async () => {
    if (!lastCodeOutput) {
        alert('복사할 코드가 없습니다.');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(lastCodeOutput);
        copyBtn.textContent = '복사됨!';
        setTimeout(() => {
            copyBtn.textContent = '복사';
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = lastCodeOutput;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            copyBtn.textContent = '복사됨!';
            setTimeout(() => {
                copyBtn.textContent = '복사';
            }, 2000);
        } catch (err) {
            alert('복사에 실패했습니다.');
        }
        document.body.removeChild(textArea);
    }
});

// Event listeners
chatbotSend.addEventListener('click', sendMessage);
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus input on load
window.addEventListener('load', () => {
    if (document.getElementById('chatbotSection').style.display !== 'none') {
        chatbotInput.focus();
    }
});

// Toggle chatbot functionality - double click on "1️⃣ Basic Data Preprocessing" with password
const toggleChatbot = document.getElementById('toggleChatbot');
const chatbotSection = document.getElementById('chatbotSection');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const passwordSubmit = document.getElementById('passwordSubmit');
const passwordCancel = document.getElementById('passwordCancel');

let clickCount = 0;
let clickTimeout;
const PASSWORD = '0420';
let isChatbotOpen = false;

// Double click handler for "1️⃣ Basic Data Preprocessing"
toggleChatbot.addEventListener('click', () => {
    clickCount++;
    
    // Reset counter after 1 second
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        clickCount = 0;
    }, 1000);
    
    // After 2 clicks, show password modal or toggle chatbot
    if (clickCount >= 2) {
        clickCount = 0;
        if (!isChatbotOpen) {
            // Show password modal
            passwordModal.style.display = 'block';
            passwordInput.focus();
        } else {
            // Close chatbot
            chatbotSection.style.display = 'none';
            isChatbotOpen = false;
        }
    }
});

// Password submit
passwordSubmit.addEventListener('click', () => {
    if (passwordInput.value === PASSWORD) {
        passwordModal.style.display = 'none';
        chatbotSection.style.display = 'block';
        passwordInput.value = '';
        isChatbotOpen = true;
        chatbotInput.focus();
    } else {
        alert('비밀번호가 틀렸습니다.');
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// Password cancel
passwordCancel.addEventListener('click', () => {
    passwordModal.style.display = 'none';
    passwordInput.value = '';
    clickCount = 0;
});

// Enter key in password input
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        passwordSubmit.click();
    }
});
