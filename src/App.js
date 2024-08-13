import React, { useState, useEffect } from 'react';
import { Upload, Languages, ChevronRight, AlertCircle } from 'lucide-react';
import { readFileContent, translateToJapanese, generateFurigana, processWords, splitIntoWords, chunkArray } from './utils';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch'; 
import { Label } from './components/ui/label'; 
import { Textarea } from './components/ui/textarea';

const CHUNK_SIZE = 200;

const JapaneseLearningApp = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processedWords, setProcessedWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toggledWords, setToggledWords] = useState({});
  const [apiKey, setApiKey] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [allWords, setAllWords] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDirectInputMode, setIsDirectInputMode] = useState(false); 
  const [directInputText, setDirectInputText] = useState(''); 

  useEffect(() => {
    if (file) {
      setFileName(file.name);
    }
  }, [file]);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    resetProcessState();
  };

  const resetProcessState = () => {
    setProcessedWords([]);
    setCurrentChunk(0);
    setTotalChunks(0);
    setAllWords([]);
    setProgress(0);
  };

  const processFile = async () => {
    if ((!file && !isDirectInputMode) || (isDirectInputMode && !directInputText)) {
      setError(isDirectInputMode ? "Please enter some text." : "Please upload a file first.");
      return;
    }
    if (!apiKey) {
      setError("Please enter your OpenAI API key.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let content;
      if (isDirectInputMode) {
        content = directInputText;
      } else {
        content = await readFileContent(file);
      }
      const words = splitIntoWords(content);
      const chunks = chunkArray(words, CHUNK_SIZE);
      setAllWords(words);
      setTotalChunks(chunks.length);
      setCurrentChunk(0);
      await processNextChunk(chunks, 0);
    } catch (err) {
      console.error('Detailed error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const processNextChunk = async (chunks, index) => {
    if (index >= chunks.length) {
      setProgress(100);
      return;
    }
  
    setIsLoading(true);
    setCurrentChunk(index + 1);
  
    try {
      const japaneseTranslations = await translateToJapanese(chunks[index], apiKey);
      const furiganaResults = await generateFurigana(japaneseTranslations.map(w => w.japanese), apiKey);
      
      console.log('Japanese Translations:', japaneseTranslations);
      console.log('Furigana Results:', furiganaResults);
  
      const combinedResults = japaneseTranslations.map((item, i) => ({
        english: item.english,
        japanese: item.japanese,
        furigana: (furiganaResults[i] && furiganaResults[i].furigana) || item.japanese,
      }));
  
      setProcessedWords(prev => [...prev, ...processWords(combinedResults)]);
      setProgress(((index + 1) / chunks.length) * 100);
    } catch (err) {
      console.error('Error processing chunk:', err);
      setError(`An error occurred while processing chunk ${index + 1}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextChunk = () => {
    const chunks = chunkArray(allWords, CHUNK_SIZE);
    processNextChunk(chunks, currentChunk);
  };

  const toggleWord = (index) => {
    setToggledWords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleModeToggle = (checked) => {
    setIsDirectInputMode(checked);
    resetProcessState();
    setFile(null);
    setFileName('');
    setDirectInputText('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center my-8 bg-gray-800 py-4 rounded-lg">
        <h1 className="text-4xl font-extrabold">
          <span className="text-red-500">Japan</span><span className="text-white">Ease</span>
        </h1>
        <p className="text-lg text-white">
          Learn Basic Japanese By Reading
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">OpenAI API Key</label>
        <Input
          type="password"
          id="api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mt-1 block w-full"
          placeholder="Enter your OpenAI API key"
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="mode-toggle"
          checked={isDirectInputMode}
          onCheckedChange={handleModeToggle}
        />
        <Label htmlFor="mode-toggle">
          {isDirectInputMode ? "Direct Input Mode" : "File Upload Mode"}
        </Label>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        {isDirectInputMode ? (
          <Textarea
            placeholder="Enter your text here..."
            value={directInputText}
            onChange={(e) => setDirectInputText(e.target.value)}
            className="w-full h-32"
          />
        ) : (
          <div className="flex items-center">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload size={18} className="mr-2" />
                Upload TXT
              </label>
            </Button>
            {fileName && <span className="ml-2 text-sm text-gray-600">{fileName}</span>}
          </div>
        )}
        <Button
          onClick={processFile}
          disabled={(!file && !isDirectInputMode) || (isDirectInputMode && !directInputText) || isLoading}
        >
          <Languages size={18} className="mr-2" />
          {isLoading ? 'Processing...' : 'Translate'}
        </Button>
      </div>
  
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
  
      {progress > 0 && (
        <div className="mb-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-600 mt-2">
            Processed {currentChunk} of {totalChunks} chunks
          </p>
        </div>
      )}
  
      <div className="mt-8 flex flex-wrap">
        {processedWords.map((word, index) => (
          <span
            key={index}
            className="cursor-pointer m-1 p-1 bg-gray-100 rounded hover:bg-yellow-200 transition-colors duration-200"
            onClick={() => toggleWord(index)}
          >
            {toggledWords[index] ? (
              <span className="text-blue-600">
                {word.english}
                <span className="text-xs block text-gray-500">{word.romaji}</span>
              </span>
            ) : (
              <span>{word.furigana}</span>
            )}
          </span>
        ))}
      </div>
  
      {currentChunk < totalChunks && (
        <Button onClick={handleNextChunk} className="mt-4">
          <ChevronRight size={18} className="mr-2" />
          Process Next Chunk
        </Button>
      )}
    </div>
  );
};

export default JapaneseLearningApp;