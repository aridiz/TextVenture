//ChatGPT config
const API_BASE_URL = 'https://api.openai.com/v1';
const API_KEY = '';
const GPT_MODEL = 'gpt-3.5-turbo';

//HTML elements
const loader = document.querySelector('.loader');
const genreButtons = document.querySelectorAll('.genre');
const placeholder = document.querySelector('#placeholder');
const stageTemplate = document.querySelector('#stage-template');
const gameoverTemplate = document.querySelector('#gameover-template');

//Variable that collects the conversation with ChatGPT
const completeChat = []; 

//Selected genre
let selectedGenre; //null at start

//Game logic
//For every genre button starts an action 
genreButtons.forEach(function(button){
    //at click
    button.addEventListener('click', function(){ //anonymous function
        //1. find selected genre
        //data-genre is an attribute in html > button.dataset.genre
        //2. set selected genre
        selectedGenre = button.dataset.genre;
        console.log(selectedGenre);                 //TEST OK
        //3. start game
        startGame(); 
    })
});

function startGame(){
    //1. put class game-started in body
    document.body.classList.add('game-started');

    //2. first instruction for ChatGPT
    completeChat.push({
        role: `system`, //how to behave
        content: `I want you to act as if you were a classic text adventure game. 
        I will be the protagonist and the main player. Do not refer to yourself. 
        The setting of this game will be ${selectedGenre} themed. 
        Each action has a 150-character description followed by a range of 3 possible actions the player can take. 
        One of these actions is deadly and ends the game. Never reach for any other explanation. 
        Do not refer to yourself. 
        Your answers are only informed JSON like this example:
        \n\n###{"description": "setting description", "actions":
        ["action 1" , "action 2" , "action 3"]}###`
    });

    //3. level 1 start
    setStage();
}

//generate one level - asyinc request to ChatGPT
async function setStage(){
    //0. empty placeholder first
    placeholder.innerHTML = ''; //or = null

    //1. show loader
    loader.classList.remove('hidden');

    //2. ask ChatGPT to invent level
    const gptResponse = await makeRequest('/chat/completions', {
        temperature: 0.7,
        model: GPT_MODEL,
        messages: completeChat
    });

    console.log(gptResponse);                  
    //3. hide loader
    loader.classList.add('hidden');

    //4. take message from ChatGPT and save it in conversation
    const message = gptResponse.choices[0].message;
    completeChat.push(message);

    //5. take message content to get the actions and level description
    //convert
    const content = JSON.parse(message.content);
    console.log(content);
    const actions = content.actions;
    const description = content.description;

    if (actions.length === 0){
        setGameOver(description);
    } else {

    };
    //6. show level description
    setStageDescription(description);
    
    //7. generate and show an image for level
    await setStagePicture(description);

    //8. show actions for the level
    setStageActions(actions);
}

//function to make request to ChatGPT
async function makeRequest(endpoint, payload){
    const url = API_BASE_URL + endpoint; //complete address
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type' : ' application/json',
            'Authorization' : 'Bearer ' + API_KEY
        }
    });
    const jsonResponse = await response.json(); //await the response and save it
    return jsonResponse;
}

//Function to show level description
async function setStageDescription(description){
    //1. clone stage template
    const stageElement = stageTemplate.content.cloneNode(true); //take the content of template and clone all inside

    //2. Add description
    stageElement.querySelector('.stage-description').innerText = description;

    //3. Insert into page
    placeholder.appendChild(stageElement);

}

//function to generate an image for the level
async function setStagePicture(description){
    //1. ask OpenAI to generate an image
    const generatedImage = await makeRequest('/images/generations', {
        n: 1,
        size: '512x512',
        response_format: 'url',
        prompt: `this is a story based on ${selectedGenre}. ${description}`
    }); 
    
    //2. get the url
    const imageUrl = generatedImage.data[0].url;
    console.log(imageUrl);

    //3. create image tag
    const image = `<img alt="${description}" src="${imageUrl}">`;

    //4. insert tag in page
    document.querySelector('.stage-picture').innerHTML = image;

}

//function to show the actions for the level
function setStageActions(actions){
    //1. HTML of actions
    let actionsHTML = '';
    actions.forEach(function(action){
        actionsHTML += `<button>${action}</button>`;
    });

    //2. insert element in HTML
    document.querySelector('.stage-actions').innerHTML = actionsHTML;

    //3. get again actions and add eventListener
     const actionButtons = document.querySelectorAll('.stage-actions button');

     //4. for every action
     actionButtons.forEach(function(button){
        //at click
        button.addEventListener('click', function(){
            //1. get text of button to sent to ChatGPT
            const selectedAction = button.innerText;

            //2. prepare message for GPT
            completeChat.push({
                role: `user`,  //user
                content: `${selectedAction}. If this action is deadly, the list of actions is empty. Don't provide any other text except from a JSON oblect. Your responses are only in JSON format as this example:
                \n\n###\n\n{"description": "You're dead for this reason", "actions": []}###`      //new perom
            });

            //3. request generating a new level
            setStage();
        });
     })
}

function setGameOver(description){
    //1. clone template of gameover
    const gameoverElement = gameoverTemplate.content.cloneNode(true);

    //2. fill description in template
    gameoverElement.querySelector('.gameover-message').innerText = description;

    //3. insert template in HTML page
    placeholder.appendChild(gameoverElement);

    //4. get button from template in html page
    const replayButton = document.querySelector('.gameover button');

    //5. at click
    replayButton.addEventListener('click', function(){
        //restart, refresh page
        window.location.reload();
    });
}