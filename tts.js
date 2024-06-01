const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require('fs');
const api_key = process.env.SPEECH_KEY

const synthesizeSpeech = (text) => {
  return new Promise((resolve, reject) => {
    const audioFile = "YourAudioFile.wav";
    const speechConfig = sdk.SpeechConfig.fromSubscription(api_key, 'eastus2');
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          fs.readFile(audioFile, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data.toString('base64'));
            }
          });
        } else {
          reject(result.errorDetails);
        }
        synthesizer.close();
      },
      (err) => {
        synthesizer.close();
        reject(err);
      });
  });
};

module.exports = { synthesizeSpeech };
