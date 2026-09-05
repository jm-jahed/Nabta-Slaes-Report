import { Octokit } from '@octokit/rest';

// In Vercel, this will use the environment variable.
const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER || '';
const repo = process.env.GITHUB_REPO || '';
const branch = process.env.GITHUB_BRANCH || 'main';

let octokit: Octokit | null = null;

if (token && owner && repo) {
  octokit = new Octokit({ 
    auth: token,
    request: { fetch: (url: any, opts: any) => fetch(url, { ...opts, cache: 'no-store' }) }
  });
}

/**
 * Gets a file from the GitHub repository.
 * Returns the decoded content and the file's SHA (needed for updates).
 */
export async function getFileFromGithub(path: string): Promise<{ content: string; sha: string } | null> {
  if (!octokit || !owner || !repo) {
    console.warn('GitHub API is not configured. Missing GITHUB_TOKEN or GITHUB_REPO.');
    return null;
  }

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(response.data)) {
      throw new Error(`Path ${path} is a directory, not a file.`);
    }

    if (response.data.type === 'file' && response.data.content) {
      // GitHub API returns Base64 encoded content
      const decodedContent = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return {
        content: decodedContent,
        sha: response.data.sha,
      };
    }
    return null;
  } catch (error: any) {
    // 404 means the file doesn't exist yet
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching file from GitHub: ${path}`, error);
    throw error;
  }
}

/**
 * Creates or updates a file in the GitHub repository.
 */
export async function updateFileInGithub(
  path: string,
  content: string,
  sha?: string,
  message?: string
): Promise<string> {
  if (!octokit || !owner || !repo) {
    throw new Error('GitHub API is not configured. Cannot update file.');
  }

  try {
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || `Update ${path}`,
      content: Buffer.from(content).toString('base64'),
      sha, // If updating an existing file, the SHA must be provided
      branch,
    });

    return response.data.content?.sha || '';
  } catch (error) {
    console.error(`Error updating file in GitHub: ${path}`, error);
    throw error;
  }
}
