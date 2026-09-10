const fs = require('fs');

const generateOpenAiSpeech = async ({text, output, voice, model, instructions, apiKey, baseUrl}) => {
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY para usar OpenAI TTS');
  const apiBase = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await fetch(`${apiBase}/audio/speech`, {
    method: 'POST',
    headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({model, voice, input: text, instructions}),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS ${response.status}: ${body.slice(0, 400)}`);
  }
  fs.writeFileSync(output, Buffer.from(await response.arrayBuffer()));
};

module.exports = {generateOpenAiSpeech};
