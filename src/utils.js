import hiraganaToRomajiMap from './hiraganaToRomajiMap.json';

let translateToJapanesePrompt = '';
let generateFuriganaPrompt = '';

async function readTextFile(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${filePath}`);
  }
  return response.text();
}

async function loadPrompts() {
  translateToJapanesePrompt = await readTextFile('./prompts/translate-to-japanese-prompt.txt');
  generateFuriganaPrompt = await readTextFile('./prompts/generate-furigana-prompt.txt');
}

// Call this function when your app initializes
loadPrompts().catch(console.error);

export const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

function extractJSONFromString(str) {
    // Regex to match JSON array or object
    const jsonRegex = /(\[[\s\S]*\]|\{[\s\S]*\})/;
    const match = str.match(jsonRegex);
    
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) {
        console.error("Error parsing extracted JSON:", e);
      }
    }
    
    throw new Error("No valid JSON found in the response");
  }

const fetchOpenAI = async (prompt, apiKey) => {
  const requestBody = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful AI Assistant specialized in Japanese language processing and translation." },
      { role: "user", content: prompt }
    ],
    temperature: 0,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log(content);
    return extractJSONFromString(content);
  } catch (error) {
    console.error('Error in fetchOpenAI:', error);
    throw error;
  }
};

export const translateToJapanese = async (words, apiKey) => {
  if (!translateToJapanesePrompt) {
    await loadPrompts();
  }
  const prompt = translateToJapanesePrompt.replace('{words}', words.join(', '));
  console.log('Prompt: \n', prompt);
  return fetchOpenAI(prompt, apiKey);
};

export const generateFurigana = async (japaneseWords, apiKey) => {
  if (!generateFuriganaPrompt) {
    await loadPrompts();
  }
  const prompt = generateFuriganaPrompt.replace('{words}', japaneseWords.join(', '));
  console.log('Prompt: \n',prompt);
  return fetchOpenAI(prompt, apiKey);
};

export const hiraganaToRomaji = (hiragana) => {
  return hiragana.split('').map(char => hiraganaToRomajiMap[char] || char).join('-');
};

export const processWords = (words) => {
  return words.map(word => ({
    ...word,
    romaji: hiraganaToRomaji(word.furigana)
  }));
};

export const splitIntoWords = (text) => {
  return text.match(/\b(\w+)\b/g) || [];
};

export const chunkArray = (array, size) => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};