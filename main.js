var client = null;
var lastCommand = null;

function submitForm() {
    const nickname = document.getElementById('nickname').value;
    const gameCode = document.getElementById('gameCode').value;

    if (nickname, gameCode) {
        joinGame(nickname, gameCode);
    } else {
        alert('Digite seu nickname e um game code!');
    }
}

function joinGame(_nickname, _gameCode) {
    const nickname = document.getElementById('nickname').value;
    const gameCode = document.getElementById('gameCode').value;

    localStorage.setItem('nickname', nickname);
    localStorage.setItem('gameCode', gameCode);

    window.location.href = "game.html";
}

function createConnection() {
    var nickname = localStorage.getItem('nickname');
    client = new Paho.Client('broker.emqx.io', 8083, nickname);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({ onSuccess: onConnect });
}

function onConnect() {
    var subscribe = localStorage.getItem('gameCode');
    console.log("onConnect");
    client.subscribe(subscribe);
    sendMessage('joinGame');
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
        alert('Sua Conexão Caiu!');
    }
}

function onMessageArrived(message) {
    console.log("onMessageArrived:" + message.payloadString);
    lastCommand = message.payloadString;
    executeCommands(
        message.payloadString.split(' (.)(.) ')[0],
        message.payloadString.split(' (.)(.) ')[1],
        message
    );
}

function executeCommands(nick, code, message) {
    if (code === 'joinGame') updatePlayers(nick);
    else if (code === 'sendVote') setPlayerVote(nick, message.payloadString.split(' (.)(.) ')[2]);
    else if (code === 'switchCards') toggleCards(localStorage.getItem('nickname') !== nick ? true : false);
    // else if ()
}

function updatePlayers(nick) {
    var players = localStorage.getItem('players');
    if (!players) {
        localStorage.setItem('lenTaks', '');
        players = [];
    } else {
        players = players.split(',');
    }
    if (nick !== localStorage.getItem('nickName') && !players.includes(nick)) {
        players.push(nick);
        localStorage.setItem('players', players.toString());
        lenPlayers = Number(localStorage.getItem('lenPlayers')) + 1;
        localStorage.setItem('lenPlayers', lenPlayers);
        addPlayerPosition(nick, lenPlayers);
        sendMessage('joinGame');
    }
}

function sendMessage(_message) {
    var text = localStorage.getItem('nickname') + ' (.)(.) ' + _message;
    var message = new Paho.Message(text);
    message.destinationName = localStorage.getItem('gameCode');
    client.send(message);
}

function initGame() {
    localStorage.setItem('taskList', '');
    localStorage.setItem('lenPlayers', '0');

    createConnection();
}

function selectCard(element, value) {
    clearChoise();
    element.classList.add('card-selected');
    setPlayerVote(localStorage.getItem('nickname'), value);
    sendVote(value);
}

function clearChoise() {
    const elementsSelected = document.getElementsByClassName('card-selected');
    if (elementsSelected.length) {
        elementsSelected[0].classList.remove('card-selected');
    }
}

function addTask(taskName) {
    if (taskName) {
        var localTaskList = localStorage.getItem('taskList');
        if (localTaskList.length === 0) {
            localTaskList = [];
            localStorage.setItem('lenTaks', '0');
        } else {
            localTaskList = localTaskList.split(',(.) ');
        }

        localTaskJson = [];
        localTaskList.forEach(locakTask => { localTaskJson.push(JSON.parse(locakTask)) });
        taskExistis = localTaskJson.filter(json => { return json['taskName'] === taskName });

        if (taskExistis.length === 0) {
            localTaskList = localTaskList.length > 1
                ? localTaskList + `,(.) {"taskName": ${'"' + taskName + '"'}, "value": null}`
                : `{"taskName": ${'"' + taskName + '"'}, "value": null}`;

            localStorage.setItem('taskList', localTaskList);
            localStorage.setItem('lenTaks', Number(localStorage.getItem('lenTaks')) + 1);

            const content = `
            <div class="row" onclick="selectTask(this)">
                <div class="col-12 task">
                    <p class="text-muted">Task ${Number(localStorage.getItem('lenTaks'))}</p>
                    <h5>${taskName}</h5>
                    <div class="button-vote">
                        <span></span>
                        <p>Votar</p>
                    </div>
                </div>
            </div>`;
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = taskList.innerHTML + content;
        }
    }
}

function sendNewTask() {

}

function selectTask(element) {
    var taskSelected = document.getElementsByClassName('task-selected');
    for (var i of taskSelected) {
        i.classList.remove('task-selected');
    }

    var select = element.querySelector('.task');
    select.classList.add('task-selected');

    var title = select.querySelector('div h5').innerText;

    var taskBoard = document.getElementById('taskBoard');
    if (taskBoard) taskBoard.remove();

    document.getElementById('tableGame').innerHTML =
        document.getElementById('tableGame').innerHTML +
        `<div id="taskBoard" class="task-board">
        <h1>${title}</h1>
    </div>`;
}

function toggleCards(sendMensage) {
    if (sendMensage) {
        sendMessage('switchCards')
        const cards = document.getElementsByName('flip');
        for (var i of cards) {
            i.classList.toggle('flip');
        }
    }
}

function addPlayerPosition(namePlayer, position) {
    const tableGame = document.getElementById('tableGame');

    tableGame.innerHTML = tableGame.innerHTML + `
    <div class="p-board position${position}">
        <p>${namePlayer}</p>
        <div name="flip">
            <div class="card-game" id="front" name="${namePlayer}"></div>
            <div class="card-game" id="back"></div>
        </div>
    </div>
    `
}

function setPlayerVote(nick, value) {
    var name = nick;
    var cardPlayer = document.getElementsByName(name)[0];
    cardPlayer.innerText = value;
}

function sendVote(value) {
    sendMessage('sendVote' + ' (.)(.) ' + value);
}
