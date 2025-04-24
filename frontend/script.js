window.addEventListener('load', init);
let form;
let question;
let questionId;
let chat;
let answerButtons;
let chatLog;
let isProcessing = false; // Lock to prevent overlapping requests

function init() {
    form = document.querySelector('#form');
    form.addEventListener('submit', sendQuery);
    question = document.querySelector('#question');
    questionId = 0;
    chat = document.querySelector('#chat-input');
    chat.classList.add('hide');
    answerButtons = document.querySelector('#answer-buttons');
    chatLog = document.querySelector('.chat');

    const reset = document.querySelector('#reset');
    reset.addEventListener('click', resetHandler);
}

async function sendQuery(e) {
    e.preventDefault();

    if (isProcessing) {
        alert("Een verzoek wordt al verwerkt. Wacht even alstublieft.");
        return;
    }

    isProcessing = true;

    const input = document.querySelector('#query').value;
    document.querySelector('#query').value = '';

    const divUser = document.createElement('div');
    divUser.classList.add('chat', 'user');
    const spanUser = document.createElement('span');
    spanUser.classList.add('user-icon');
    const paragraphUser = document.createElement('p');
    paragraphUser.innerHTML = input;
    const iconUser = document.createElement('i');
    iconUser.classList.add('fa', 'fa-user');

    spanUser.append(iconUser);
    divUser.append(spanUser, paragraphUser);
    chatLog.append(divUser);

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

        const divBot = document.createElement('div');
        divBot.classList.add('chat', 'chat-bot');
        const spanBot = document.createElement('span');
        spanBot.classList.add('user-icon');
        const paragraphBot = document.createElement('p');
        paragraphBot.innerHTML = answer;
        const iconBot = document.createElement('i');
        iconBot.classList.add('fa', 'fa-robot');

        spanBot.append(iconBot);
        divBot.append(spanBot, paragraphBot);
        chatLog.append(divBot);
    } catch (error) {
        console.error('Error fetching chat response:', error);
    } finally {
        isProcessing = false;
    }
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
