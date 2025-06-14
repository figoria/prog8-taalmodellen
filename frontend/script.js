window.addEventListener('load', init);
let form;
let question;
let chatLog;

function init() {
    form = document.querySelector('#form');
    form.addEventListener('submit', sendQuery);
    question = document.querySelector('#question');
    chatLog = document.querySelector('.chat');

    const reset = document.querySelector('#reset');
    reset.addEventListener('click', resetHandler);
}

async function sendQuery(e) {
    e.preventDefault();

    const input = document.querySelector('#query').value.trim();
    if (!input) return;

    document.querySelector('#query').value = '';

    addMessageToChatLog('You', input);

    try {
        const response = await fetch(`http://localhost:3000/chat`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: input }),
        });

        const { answer } = await response.json();
        addMessageToChatLog('AI', answer);
    } catch (error) {
        console.error('Error fetching chat response:', error);
    }
}

function addMessageToChatLog(role, message) {
    const div = document.createElement('div');
    div.classList.add('chat', role === 'You' ? 'user' : 'chat-bot');
    const span = document.createElement('span');
    span.classList.add('user-icon');
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    const icon = document.createElement('i');
    icon.classList.add('fa', role === 'You' ? 'fa-user' : 'fa-robot');

    span.append(icon);
    div.append(span, paragraph);
    chatLog.append(div);
    chatLog.scrollTop = chatLog.scrollHeight; // Scroll naar de laatste boodschap
}

async function resetHandler(e) {
    e.preventDefault();

    try {
        await fetch(`http://localhost:3000/reset`);
        chatLog.innerHTML = '';
        console.log('Chat log reset.');
    } catch (error) {
        console.log(error);
    }
}
