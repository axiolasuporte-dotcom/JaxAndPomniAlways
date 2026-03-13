// Utilitários para gerenciamento de mídia
// Funções para carregar e validar arquivos de mídia

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Limite de tamanho do Discord (25MB em bytes)
const DISCORD_FILE_SIZE_LIMIT = 25 * 1024 * 1024;

/**
 * Obtém um arquivo aleatório de uma pasta
 * @param {string} folderPath - Caminho da pasta
 * @param {string[]} allowedExtensions - Extensões permitidas
 * @returns {object|null} - Objeto com path e size do arquivo, ou null se não houver
 */
export function getRandomMedia(folderPath, allowedExtensions = ['.gif', '.png', '.jpg', '.jpeg', '.mp4', '.webm']) {
  const fullPath = join(__dirname, '..', folderPath);
  
  try {
    const files = readdirSync(fullPath)
      .filter(file => {
        const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
        return allowedExtensions.includes(ext);
      });
    
    if (files.length === 0) {
      return null;
    }
    
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = join(fullPath, randomFile);
    const stats = statSync(filePath);
    
    return {
      path: filePath,
      size: stats.size,
      name: randomFile,
    };
  } catch (error) {
    console.error(`Erro ao ler pasta ${folderPath}:`, error);
    return null;
  }
}

/**
 * Verifica se o arquivo excede o limite do Discord
 * @param {number} fileSize - Tamanho do arquivo em bytes
 * @returns {boolean} - true se exceder o limite
 */
export function exceedsDiscordLimit(fileSize) {
  return fileSize > DISCORD_FILE_SIZE_LIMIT;
}

/**
 * Formata tamanho de arquivo para exibição
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
