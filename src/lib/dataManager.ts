import fs from 'fs';
import path from 'path';
import { getFileFromGithub, updateFileInGithub } from './github';

export interface DataPayload {
  orders: any[];
  payments: any[];
  clients: any[];
  day_summaries: any[];
}

function getMonthlyFileName(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}.json`;
}

function getLocalFilePath(fileName: string): string {
  return path.join(process.cwd(), '.data', fileName);
}

const emptyPayload: DataPayload = {
  orders: [],
  payments: [],
  clients: [],
  day_summaries: []
};

// In-memory cache of SHA to prevent conflict when updating GitHub
let currentFileSha: string | undefined = undefined;

/**
 * Loads the monthly data file from GitHub (if configured) or local filesystem.
 */
export async function loadMonthlyData(dateStr?: string): Promise<DataPayload> {
  const fileName = getMonthlyFileName(dateStr);
  const isGithubConfigured = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);

  if (isGithubConfigured) {
    try {
      const githubData = await getFileFromGithub(`.data/${fileName}`);
      if (githubData) {
        currentFileSha = githubData.sha;
        return JSON.parse(githubData.content) as DataPayload;
      }
      return emptyPayload;
    } catch (err) {
      console.error('Failed to load from GitHub. Returning empty payload.', err);
      return emptyPayload;
    }
  }

  // Fallback to local filesystem
  try {
    const localPath = getLocalFilePath(fileName);
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      return JSON.parse(content) as DataPayload;
    }
  } catch (err) {
    console.error('Failed to load local file.', err);
  }
  
  return emptyPayload;
}

/**
 * Saves the monthly data file to GitHub (if configured) or local filesystem.
 */
export async function saveMonthlyData(data: DataPayload, dateStr?: string): Promise<void> {
  const fileName = getMonthlyFileName(dateStr);
  const isGithubConfigured = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
  const contentStr = JSON.stringify(data, null, 2);

  if (isGithubConfigured) {
    try {
      currentFileSha = await updateFileInGithub(`.data/${fileName}`, contentStr, currentFileSha, `Update data for ${fileName}`);
      return;
    } catch (err) {
      console.error('Failed to save to GitHub.', err);
      throw err;
    }
  }

  // Fallback to local filesystem
  try {
    const dir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const localPath = getLocalFilePath(fileName);
    fs.writeFileSync(localPath, contentStr, 'utf-8');
  } catch (err) {
    console.error('Failed to save to local file.', err);
    throw err;
  }
}
