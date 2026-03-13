// Utilitários para gerenciamento de textos
// Funções para carregar textos aleatórios

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Obtém um texto aleatório do arquivo JSON
 * @param {string} filePath - Caminho do arquivo JSON
 * @returns {string|null} - Texto aleatório ou null se não houver
 */
export function getRandomText(filePath) {
  try {
    const fullPath = join(__dirname, '..', filePath);
    const fileContent = readFileSync(fullPath, 'utf-8');
    const texts = JSON.parse(fileContent);
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return null;
    }
    
    return texts[Math.floor(Math.random() * texts.length)];
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error);
    return null;
  }
}

/**
 * Obtém um texto aleatório de arquivos .txt em uma pasta
 * @param {string} folderPath - Caminho da pasta com arquivos .txt
 * @returns {string|null} - Texto aleatório ou null se não houver
 */
export function getRandomFloodText(folderPath) {
  try {
    const fullPath = join(__dirname, '..', folderPath);
    
    // Ler todos os arquivos .txt da pasta
    const files = readdirSync(fullPath).filter(file => file.endsWith('.txt') || file.endsWith('.json'));
    
    if (files.length === 0) {
      console.error(`Nenhum arquivo de texto encontrado em ${folderPath}`);
      return null;
    }
    
    // Escolher um arquivo aleatório
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = join(fullPath, randomFile);
    
    // Ler o conteúdo completo do arquivo
    let content = readFileSync(filePath, 'utf-8').trim();
    
    if (randomFile.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(content);
        if (Array.isArray(jsonContent)) {
          content = jsonContent[Math.floor(Math.random() * jsonContent.length)];
        }
      } catch (e) {
        console.error(`Erro ao parsear JSON ${randomFile}:`, e.message);
      }
    }
    
    if (!content) {
      return null;
    }
    
    return content;
  } catch (error) {
    console.error(`Erro ao ler arquivos em ${folderPath}:`, error);
    return null;
  }
}
