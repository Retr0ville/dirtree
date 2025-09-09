#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';

interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface IgnoreFileAnswers {
  createIgnoreFile: boolean;
}

interface CustomPatternsAnswers {
  customPatterns: string;
}

class DirTreeGenerator {
  private readonly ignoreFile: string = '.dirtree.ignore';
  private readonly outputFile: string = 'directory-tree.txt';
  private ignorePatterns: RegExp[] = [];
  private readonly defaultIgnores: readonly string[] = [
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    'target',
    '.next',
    '.nuxt',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env',
    '.venv',
    '.env',
    'vendor',
    '.idea',
    '.vscode',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'coverage',
    '.nyc_output',
    'tmp',
    'temp',
    '.cache',
    '.parcel-cache'
  ] as const;

  async init(): Promise<void> {
    try {
      await this.checkAndCreateIgnoreFile();
      await this.loadIgnorePatterns();
      const tree = await this.generateTree('.');
      await this.writeTreeToFile(tree);
      console.log(`Directory tree generated successfully in ${this.outputFile}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating directory tree:', errorMessage);
      process.exit(1);
    }
  }

}

// Main execution
if (require.main === module) {
  const generator = new DirTreeGenerator();
  generator.init().catch(error => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fatal error:', errorMessage);
    process.exit(1);
  });
}

export default DirTreeGenerator;