import { RunnerTask } from './types';
import { 
  splitToTokens, 
  filterUsefulWords, 
  addSentenceWordsToPool, 
  addLearningLanguageSentenceWordsToPool, 
  shuffleArray, 
  sampleN, 
  cleanSentense 
} from './utils';

// Helper to find matching item text by id in other language file
export const findNativeTextById = (itemId: string, currentStepNativeLanguage: any): string | null => {
  for (const s of (currentStepNativeLanguage?.items || [])) {
    if (s.id === itemId) return s.text;
  }
  return null;
};

export const buildTasks = (
  currentStepLearningLanguage: any,
  currentStepNativeLanguage: any
): RunnerTask[] => {
  // Gather extras from same step for word bank (tokens from sentences, word texts from current language)
  const extrasFromStep: string[] = [];
  currentStepLearningLanguage.items.forEach((it: any) => {
    if (it.type === 'sentence' || it.practiceType === 'missingWords') {
      splitToTokens(it.text).forEach((t: string) => extrasFromStep.push(t));
    } else if (it.type === 'word' || it.practiceType === 'chooseTranslation') {
      if (it.text) extrasFromStep.push(it.text);
    }
    // Also include words from other practice types for more variety
    if (it.practiceType && it.practiceType.includes('chooseWord')) {
      if (it.text) extrasFromStep.push(it.text);
    }
    if (it.practiceType && it.practiceType.includes('hearing')) {
      if (it.text) extrasFromStep.push(it.text);
    }
  });

  // Also gather words from other language for additional variety
  const extrasFromNativeLanguage: string[] = [];
  currentStepNativeLanguage.items.forEach((it: any) => {
    if (it.type === 'sentence') {
      splitToTokens(it.text).forEach((t: string) => extrasFromNativeLanguage.push(t));
    } else if (it.type === 'word') {
      if (it.text) extrasFromNativeLanguage.push(it.text);
    }
    // Also include words from other practice types for more variety
    if (it.practiceType && it.practiceType.includes('chooseTranslation')) {
      if (it.text) extrasFromNativeLanguage.push(it.text);
    }
    if (it.practiceType && it.practiceType.includes('hearing')) {
      if (it.text) extrasFromNativeLanguage.push(it.text);
    }
  });

  // Filter out common words and punctuation to make the word bank more useful
  const filteredExtrasFromStep = filterUsefulWords(extrasFromStep);
  const filteredExtrasFromNativeLanguage = filterUsefulWords(extrasFromNativeLanguage);

  const built: RunnerTask[] = currentStepLearningLanguage.items.flatMap((it: any) => {
    const otherText = findNativeTextById(it.id, currentStepNativeLanguage);
    
    // Helper function to create a task based on practice type
    const createTask = (practiceType: string): RunnerTask | null => {
      if (practiceType === 'chooseTranslation' || (practiceType === 'default' && it.type === 'word')) {
        // Build distractors from other word items in same step
        const distractorPool: string[] = [];
        currentStepNativeLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
            const t = findNativeTextById(o.id, currentStepNativeLanguage);
            if (t && t !== otherText) distractorPool.push(t);
          }
        });
        
        // Also add words from sentences in the native language for more variety
        if (otherText) {
          addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
        }
        
        // Add some additional words from the current step for context
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && o.type === 'word') {
            const t = findNativeTextById(o.id, currentStepNativeLanguage);
            if (t && t !== otherText && !distractorPool.includes(t)) {
              distractorPool.push(t);
            }
          }
        });
        
        const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
        const allOptions = shuffleArray([otherText, ...picked]);
        return {
          kind: 'chooseTranslation',
          sourceWord: it.text,
          correctTranslation: otherText,
          options: allOptions,
          itemId: it.id,
        } as RunnerTask;
      }
      
      if (practiceType === 'chooseWord') {
        // Show translation and ask to pick the correct word
        const distractorPoolWords: string[] = [];
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation') || o.practiceType?.includes('chooseWord'))) {
            if (o.text && o.text !== it.text) distractorPoolWords.push(o.text);
          }
        });
        
        // Also add words from sentences in the learning language for more variety
        addLearningLanguageSentenceWordsToPool(distractorPoolWords, currentStepLearningLanguage, it.id, it.text);
        
        // Add some additional words from the current step for context
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && o.type === 'word') {
            if (o.text && o.text !== it.text && !distractorPoolWords.includes(o.text)) {
              distractorPoolWords.push(o.text);
            }
          }
        });
        
        const pickedWords = sampleN(Array.from(new Set(distractorPoolWords)), Math.min(7, Math.max(0, distractorPoolWords.length)));
        const allWordOptions = shuffleArray([it.text, ...pickedWords]);
        return {
          kind: 'chooseWord',
          translation: otherText,
          correctWord: it.text,
          options: allWordOptions,
          itemId: it.id,
        } as RunnerTask;
      }
      
      // Build formulate sentence task (assemble full sentence in current language)
      if (practiceType === 'formulateSentense') {
        const tokens = splitToTokens(cleanSentense(it.text));
        
        // Ensure we have at least 6 words in the shuffled tokens
        let shuffledTokens = [...tokens];

        if (tokens.length < 6) {
          // Add filler words from the current step to reach at least 6 words
          const fillerWords: string[] = [];
          
          // Get words from other items in the same step
          currentStepLearningLanguage.items.forEach((o: any) => {
            if (o.id !== it.id) {
              if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                fillerWords.push(o.text);
              } else if (o.type === 'sentence') {
                const sentenceWords = splitToTokens(cleanSentense(o.text));
                sentenceWords.forEach((word: string) => {
                  if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                    fillerWords.push(word);
                  }
                });
              }
            }
          });
          
          // Shuffle and take enough words to reach 6 total
          const neededWords = 6 - tokens.length;
          const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
          shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
        } else {
          shuffledTokens = shuffleArray(tokens);
        }
        
        return {
          kind: 'formulateSentense',
          sentence: it.text,
          translatedSentence: otherText,
          tokens,
          shuffledTokens,
          itemId: it.id,
        } as RunnerTask;
      }
      
      if (practiceType === 'hearing') {
        // Hearing: pick translation options from other words' translations
        const distractorPool: string[] = [];
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation') || o.practiceType?.includes('hearing'))) {
            const t = findNativeTextById(o.id, currentStepNativeLanguage);
            if (t && t !== otherText) distractorPool.push(t);
          }
        });
        
        // Also add words from sentences in the native language for more variety
        if (otherText) {
          addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
        }
        
        // Add some additional words from the current step for context
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && o.type === 'word') {
            const t = findNativeTextById(o.id, currentStepNativeLanguage);
            if (t && t !== otherText && !distractorPool.includes(t)) {
              distractorPool.push(t);
            }
          }
        });
        
        const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(5, Math.max(0, distractorPool.length)));
        const options = shuffleArray([otherText, ...picked]);
        return {
          kind: 'hearing',
          sourceWord: it.text,
          correctTranslation: otherText,
          options,
          itemId: it.id,
        } as RunnerTask;
      }
      
      if (practiceType === 'translationMissingLetters') {
        // Build indices to input over translation
        const letters = (otherText || '').split('');
        const candidateIdx: number[] = [];
        letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
        const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
        const inputIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
        return {
          kind: 'translationMissingLetters',
          word: it.text,
          translation: otherText,
          inputIndices,
          itemId: it.id,
        } as RunnerTask;
      }
      
      if (practiceType === 'wordMissingLetters') {
        const letters = (it.text || '').split('');
        const candidateIdx: number[] = [];
        letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
        const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
        const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
        return {
          kind: 'wordMissingLetters',
          word: it.text,
          translation: otherText,
          missingIndices,
          itemId: it.id,
        } as RunnerTask;
      }
      
      if (practiceType === 'writeWord') {
        const letters = (it.text || '').split('');
        const candidateIdx: number[] = [];
        letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
        const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
        const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
        return {
          kind: 'writeWord',
          word: it.text,
          translation: otherText,
          missingIndices,
          itemId: it.id,
        } as RunnerTask;
      }
      
      // missingWords for sentences (only when explicitly requested)
      if (practiceType === 'missingWords') {
        const tokens = splitToTokens(it.text);
        // Choose 1-2 indices to blank, prefer alphabetic tokens
        const candidateIdx: number[] = [];
        tokens.forEach((t: string, i: number) => { if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) candidateIdx.push(i); });
        const desired = Math.min(2, Math.max(1, Math.floor(tokens.length / 6)));
        const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
        const required = Array.from(new Set(missingIndices.map((i) => tokens[i])));
        
        // Create a comprehensive word bank from multiple sources
        const allExtras = [...filteredExtrasFromStep, ...filteredExtrasFromNativeLanguage];
        const pool = allExtras.filter((w) => !required.includes(w));
        
        // Also add some words from the current step's other items for context
        const stepContextWords: string[] = [];
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id) {
            if (o.type === 'word') {
              if (o.text && !required.includes(o.text)) stepContextWords.push(o.text);
            } else if (o.type === 'sentence') {
              const sentenceWords = splitToTokens(o.text);
              sentenceWords.forEach((word: string) => {
                if (word && !required.includes(word) && !stepContextWords.includes(word)) {
                  stepContextWords.push(word);
                }
              });
            }
          }
        });
        
        // Combine all sources and take more words from the step to fill the word bank
        const allPool = [...pool, ...stepContextWords];
        const targetWordBankSize = Math.max(10, required.length + 6); // Ensure we have enough words
        const picked = sampleN(allPool, Math.max(0, targetWordBankSize - required.length));
        const wordBank = shuffleArray([...required, ...picked]).slice(0, targetWordBankSize);
        
        return {
          kind: 'missingWords',
          sentence: it.text,
          translatedSentence: otherText,
          tokens,
          missingIndices,
          wordBank,
          itemId: it.id,
        } as RunnerTask;
      }
      
      return null;
    };
    
    // Handle multiple practice types separated by commas
    if (it.practiceType && typeof it.practiceType === 'string') {
      const practiceTypes = it.practiceType.split(',').map((pt: string) => pt.trim());
      const tasks: RunnerTask[] = [];
      
      practiceTypes.forEach((pt: string) => {
        const task = createTask(pt);
        if (task) tasks.push(task);
      });
      
      // If no valid practice types were found, use fallback logic
      if (tasks.length === 0) {
        // Fallback: if still sentence type, use formulate sentence
        if (it.type === 'sentence') {
          const tokens = splitToTokens(it.text);
          
          // Ensure we have at least 6 words in the shuffled tokens
          let shuffledTokens = [...tokens];
          if (tokens.length < 6) {
            // Add filler words from the current step to reach at least 6 words
            const fillerWords: string[] = [];
            
            // Get words from other items in the same step
            currentStepLearningLanguage.items.forEach((o: any) => {
              if (o.id !== it.id) {
                if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                  fillerWords.push(o.text);
                } else if (o.type === 'sentence') {
                  const sentenceWords = splitToTokens(o.text);
                  sentenceWords.forEach((word: string) => {
                    if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                      fillerWords.push(word);
                    }
                  });
                }
              }
            });
            
            // Shuffle and take enough words to reach 6 total
            const neededWords = 6 - tokens.length;
            const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
            shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
          } else {
            shuffledTokens = shuffleArray(tokens);
          }
          
          tasks.push({
            kind: 'formulateSentense',
            sentence: it.text,
            translatedSentence: otherText,
            tokens,
            shuffledTokens,
            itemId: it.id,
          } as RunnerTask);
        } else {
          // Final fallback: treat as chooseTranslation
          const distractorPool: string[] = [];
          currentStepLearningLanguage.items.forEach((o: any) => {
            if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
              const t = findNativeTextById(o.id, currentStepNativeLanguage);
              if (t && t !== otherText) distractorPool.push(t);
            }
          });
          
          // Also add words from sentences in the native language for more variety
          if (otherText) {
            addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
          }
          
          const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
          const allOptions = shuffleArray([otherText, ...picked]);
          tasks.push({
            kind: 'chooseTranslation',
            sourceWord: it.text,
            correctTranslation: otherText,
            options: allOptions,
            itemId: it.id,
          } as RunnerTask);
        }
      }
      
      return tasks;
    } else {
      // Handle legacy single practice type or no practice type
      const task = createTask('default');
      if (task) return [task];
      
      // Fallback: if still sentence type, use formulate sentence
      if (it.type === 'sentence') {
        const tokens = splitToTokens(it.text);
        
        // Ensure we have at least 6 words in the shuffled tokens
        let shuffledTokens = [...tokens];
        if (tokens.length < 6) {
          // Add filler words from the current step to reach at least 6 words
          const fillerWords: string[] = [];
          
          // Get words from other items in the same step
          currentStepLearningLanguage.items.forEach((o: any) => {
            if (o.id !== it.id) {
              if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                fillerWords.push(o.text);
              } else if (o.type === 'sentence') {
                const sentenceWords = splitToTokens(o.text);
                sentenceWords.forEach((word: string) => {
                  if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                    fillerWords.push(word);
                  }
                });
              }
            }
          });
          
          // Shuffle and take enough words to reach 6 total
          const neededWords = 6 - tokens.length;
          const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
          shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
        } else {
          shuffledTokens = shuffleArray(tokens);
        }
        
        return [{
          kind: 'formulateSentense',
          sentence: it.text,
          translatedSentence: otherText,
          tokens,
          shuffledTokens,
          itemId: it.id,
        } as RunnerTask];
      } else {
        // Final fallback: treat as chooseTranslation
        const distractorPool: string[] = [];
        currentStepLearningLanguage.items.forEach((o: any) => {
          if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
            const t = findNativeTextById(o.id, currentStepNativeLanguage);
            if (t && t !== otherText) distractorPool.push(t);
          }
        });
        
        // Also add words from sentences in the native language for more variety
        if (otherText) {
          addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
        }
        
        const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
        const allOptions = shuffleArray([otherText, ...picked]);
        return [{
          kind: 'chooseTranslation',
          sourceWord: it.text,
          correctTranslation: otherText,
          options: allOptions,
          itemId: it.id,
        } as RunnerTask];
      }
    }
  });

  return built;
};
