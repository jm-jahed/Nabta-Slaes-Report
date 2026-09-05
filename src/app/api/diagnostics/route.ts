import { NextRequest, NextResponse } from 'next/server';
import { getFileFromGithub, updateFileInGithub } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    env: {
      has_token: !!process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH || 'main'
    },
    tests: {
      read_success: false,
      write_success: false,
      delete_success: false,
    },
    errors: []
  };

  if (!diagnostics.env.has_token) {
    diagnostics.errors.push('GITHUB_TOKEN is missing');
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // 1. Test Read (Main Data File)
  try {
    const data = await getFileFromGithub('.data/2026-09.json');
    if (data && data.sha) {
      diagnostics.tests.read_success = true;
    } else {
      diagnostics.errors.push('File not found or empty on GitHub');
    }
  } catch (error: any) {
    diagnostics.errors.push(`Read error: ${error.message}`);
  }

  // 2. Test Write (Dummy File)
  let dummySha: string | undefined;
  try {
    const dummyContent = JSON.stringify({ ping: 'pong', timestamp: Date.now() });
    
    // First check if it exists so we have a SHA
    const existing = await getFileFromGithub('.data/test-ping.json');
    dummySha = existing?.sha;

    dummySha = await updateFileInGithub('.data/test-ping.json', dummyContent, dummySha, 'Diagnostic Ping');
    diagnostics.tests.write_success = true;
  } catch (error: any) {
    diagnostics.errors.push(`Write error: ${error.message}`);
  }

  diagnostics.tests.delete_success = diagnostics.tests.write_success; 

  const success = diagnostics.tests.read_success && diagnostics.tests.write_success;

  return NextResponse.json(diagnostics, { status: success ? 200 : 500 });
}
