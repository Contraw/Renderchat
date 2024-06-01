const { Groq } = require("groq-sdk");
const WebSocket = require('ws');
const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });
const readline = require('readline');
const { synthesizeSpeech } = require('./tts');
const { translateText } = require('./translator');

const ws = new WebSocket.Server({ port: process.env.PORT || 8080 });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prepareTextForTTS = (text) => {
  return text.replace(/፡/g, ' ')
    .replace(/።/g, '.')
    .replace(/፣/g, ',')
    .replace(/፤/g, ';');
};

ws.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    console.log(`Received message => ${message}`);
    const userInput = message.toString().trim();
    let inputToAI = userInput;

    const isAmharic = (text) => {
      const amharicRegex = /[\u1200-\u135A\u1361-\u137C]/;
      return amharicRegex.test(text);
    };

    if (isAmharic(userInput)) {
      try {
        const translatedInput = await translateText(userInput, "am", "en");
        inputToAI = translatedInput[0]?.text || userInput;
      } catch (error) {
        console.error('Error translating Amharic input:', error);
        ws.send('Error translating your input.');
        return;
      }
    }

    try {
      const chatCompletion = await getGroqChatCompletion(inputToAI);
      const aiResponse = chatCompletion.choices[0]?.message?.content || 'No response from AI';
      console.log(`Assistant: ${aiResponse}`);

      try {
        const translatedResponses = await translateText(aiResponse, "en", ["am"]);
        const responsesToSend = translatedResponses.map((translation) => `${translation.text}`);
        ws.send(`${responsesToSend.join('\n')}`);

        for (const translation of translatedResponses) {
          const textForTTS = prepareTextForTTS(translation.text);
          try {
            const audioBase64 = await synthesizeSpeech(textForTTS);
            ws.send(`audio:${audioBase64}`);
          } catch (error) {
            console.error('Error generating audio:', error);
          }
        }
      } catch (error) {
        console.error('Error translating AI response:', error);
        ws.send('Error translating AI response.');
      }
    } catch (error) {
      console.error('Error getting chat completion:', error);
      ws.send('Error processing your request.');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const getGroqChatCompletion = async (userInput) => {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Give me concise answers that are under 100 tokens"
      },
      {
        role: "user",
        content: userInput
      }
    ],
    model: "llama3-8b-8192",
    temperature: 0.5,
    max_tokens: 200,
    top_p: 1,
    stop: null,
    stream: false
  });
};