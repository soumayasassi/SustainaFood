"use client"

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { keyframes } from 'styled-components';
import { FaPlay, FaStop } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SpeechButtonStyled = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #228b22, #56ab2f);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(34, 139, 34, 0.2);
  animation: ${fadeIn} 0.5s ease-out forwards;
  position: fixed;
  bottom: 20px;
  ${props => props.position === 'left' ? 'left: 20px;' : 'right: 20px;'}
  z-index: 1000;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(34, 139, 34, 0.3);
  }

  &:focus {
    outline: 2px solid #1a7a1a;
    outline-offset: 2px;
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 14px;
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const SpeechButton = ({ textToRead, position = 'right' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [globalErrorCount, setGlobalErrorCount] = useState(0);
  const isStoppedRef = useRef(false);
  const timeoutRef = useRef(null);
  const retryCountRef = useRef({});
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const MAX_RETRIES_PER_CHUNK = 2;
  const MAX_GLOBAL_RETRIES = 5;

  const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided:', text);
      return '';
    }
    const sanitized = text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '') // Remove emojis
      .replace(/[^\w\s.,!?]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove invisible characters
      .replace(/[\n\r\t]+/g, ' ') // Replace newlines and tabs
      .replace(/\.+/g, '.') // Normalize periods
      .replace(/,+/, ',') // Normalize commas
      .replace(/!+/, '!') // Normalize exclamation marks
      .replace(/\?+/, '?') // Normalize question marks
      .replace(/\s*[.,!?]\s*/g, '$&. ') // Ensure single space after punctuation
      .replace(/(\w)\1{2,}/g, '$1$1') // Limit repeated characters
      .trim();
    console.log('Sanitized text (length:', sanitized.length, '):', sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''));
    return sanitized;
  };

  const chunkText = (text, maxLength = isSafari ? 30 : 100) => {
    const segments = text.split(/[.!?,]+/).filter(s => s.trim());
    const chunks = [];
    let currentChunk = '';

    for (const segment of segments) {
      const cleanSegment = segment.trim();
      if (!cleanSegment) continue;
      if ((currentChunk + cleanSegment).length > maxLength) {
        if (currentChunk) {
          const trimmed = currentChunk.trim();
          if (trimmed && trimmed !== '.') chunks.push(trimmed + '.');
        }
        currentChunk = cleanSegment + '.';
      } else {
        currentChunk += cleanSegment + '.';
      }
    }
    if (currentChunk) {
      const trimmed = currentChunk.trim();
      if (trimmed && trimmed !== '.') chunks.push(trimmed);
    }
    const validChunks = chunks.filter(chunk => chunk.length > 2 && chunk !== '.');
    console.log(`Created ${validChunks.length} chunks:`, validChunks.map(c => c.substring(0, 50) + (c.length > 50 ? '...' : '')));
    return validChunks;
  };

  const resetSpeechEngine = () => {
    console.log('Resetting speech engine');
    speechSynthesis.pause();
    speechSynthesis.cancel();
    return new Promise(resolve => setTimeout(resolve, isSafari ? 800 : 300));
  };

  const stopSpeech = () => {
    console.log('Stopping speech');
    isStoppedRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    resetSpeechEngine().then(() => {
      setIsSpeaking(false);
      setCurrentChunkIndex(0);
      setGlobalErrorCount(0);
      retryCountRef.current = {};
    });
  };

  const speak = () => {
    if (!window.speechSynthesis) {
      console.error('❌ SpeechSynthesis not supported in this browser');
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const sanitizedText = sanitizeText(textToRead);
    if (!sanitizedText) {
      console.warn('⚠️ No valid text to read');
      alert('No valid text available to read.');
      return;
    }

    const textChunks = chunkText(sanitizedText);
    if (textChunks.length === 0) {
      console.warn('⚠️ No valid text chunks to read');
      alert('No valid text chunks to read.');
      return;
    }

    console.log(`Starting speech, ${textChunks.length} chunks`);
    isStoppedRef.current = false;
    retryCountRef.current = {};
    setIsSpeaking(true);
    setCurrentChunkIndex(0);
    setGlobalErrorCount(0);

    const speakChunk = async (index, attempt = 0) => {
      if (index >= textChunks.length || isStoppedRef.current) {
        console.log('Speech completed or stopped');
        stopSpeech();
        return;
      }

      if (globalErrorCount >= MAX_GLOBAL_RETRIES) {
        console.error(`Max global retries (${MAX_GLOBAL_RETRIES}) reached, stopping speech`);
        alert('Unable to continue reading due to repeated errors. Please try again later.');
        stopSpeech();
        return;
      }

      const waitForSpeechReady = async () => {
        let attempts = 0;
        const maxAttempts = 3;
        while ((speechSynthesis.speaking || speechSynthesis.pending) && attempts < maxAttempts) {
          console.log(`Engine busy, attempt ${attempts + 1}/${maxAttempts}`);
          await resetSpeechEngine();
          attempts++;
        }
        if (attempts >= maxAttempts) {
          console.warn('Engine still busy after max attempts');
          setGlobalErrorCount(prev => prev + 1);
          return false;
        }
        console.log('Engine ready, playing chunk');
        return true;
      };

      const isReady = await waitForSpeechReady();
      if (!isReady) {
        console.error('Failed to prepare engine, retrying');
        setTimeout(() => speakChunk(index, attempt), isSafari ? 1000 : 500);
        return;
      }

      console.log(`✅ Speaking chunk ${index}/${textChunks.length - 1} (length: ${textChunks[index].length}): "${textChunks[index]}"`);
      const utterance = new SpeechSynthesisUtterance(textChunks[index]);
      utterance.lang = 'en-US';
      utterance.rate = isSafari ? 0.6 : 0.9;
      utterance.pitch = 1;

      timeoutRef.current = setTimeout(() => {
        console.warn(`⏰ Timeout on chunk ${index}. Moving to next.`);
        resetSpeechEngine().then(() => {
          setGlobalErrorCount(prev => prev + 1);
          speakChunk(index + 1);
        });
      }, 12000);

      utterance.onstart = () => {
        console.log(`▶️ Chunk ${index} started`);
      };

      utterance.onend = () => {
        console.log(`✅ Chunk ${index} completed`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        if (!isStoppedRef.current) {
          setCurrentChunkIndex(index + 1);
          setTimeout(() => speakChunk(index + 1), isSafari ? 1000 : 300);
        }
      };

      utterance.onerror = (event) => {
        console.error(`❌ Error on chunk ${index}: ${event.error}`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        if (!isStoppedRef.current) {
          const retries = retryCountRef.current[index] || 0;
          if (event.error === 'interrupted' && retries < MAX_RETRIES_PER_CHUNK) {
            console.warn(`🔁 Retrying chunk ${index} (attempt ${retries + 1})`);
            retryCountRef.current[index] = retries + 1;
            setGlobalErrorCount(prev => prev + 1);
            resetSpeechEngine().then(() => {
              setTimeout(() => speakChunk(index, retries + 1), isSafari ? 1000 : 500);
            });
          } else {
            console.warn(`⚠️ Skipping chunk ${index} after ${retries} retries`);
            setGlobalErrorCount(prev => prev + 1);
            setTimeout(() => speakChunk(index + 1), isSafari ? 1000 : 300);
          }
        }
      };

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error calling speak:', error);
        setGlobalErrorCount(prev => prev + 1);
        stopSpeech();
      }
    };

    resetSpeechEngine().then(() => speakChunk(0));
  };

  useEffect(() => {
    return () => {
      console.log('Cleaning up SpeechButton');
      stopSpeech();
    };
  }, []);

  return (
    <SpeechButtonStyled
      position={position}
      onClick={speak}
      aria-label={isSpeaking ? 'Stop reading' : 'Read content'}
    >
      {isSpeaking ? (
        <>
          <FaStop />
          Stop
        </>
      ) : (
        <>
          <FaPlay />
          Read
        </>
      )}
    </SpeechButtonStyled>
  );
};

export default SpeechButton;