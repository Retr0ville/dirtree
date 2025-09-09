#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import DirTreeGenerator from './index.js';

interface TestResults {
  passed: number;
  failed: number;
  errors: string[];
}

class DirTreeTest {
  private results: TestResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  private testDir = './test-temp';

  async runAllTests(): Promise<void> {
    console.log('🧪 Running DirTree Tests...\n');

    try {
      await this.setupTestEnvironment();
      await this.testIgnorePatternMatching();
      await this.testDirectoryCreation();
      await this.testTreeGeneration();
      await this.cleanupTestEnvironment();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.results.errors.push(`Test setup failed: ${errorMessage}`);
    }

    this.printResults();
  }

  private async setupTestEnvironment(): Promise<void> {
    // Create test directory structure
    await this.createDirectory(this.testDir);
    await this.createDirectory(path.join(this.testDir, 'src'));
    await this.createDirectory(path.join(this.testDir, 'node_modules'));
    await this.createDirectory(path.join(this.testDir, 'dist'));
    
    // Create test files
    await fs.writeFile(path.join(this.testDir, 'package.json'), '{}');
    await fs.writeFile(path.join(this.testDir, 'README.md'), '# Test');
    await fs.writeFile(path.join(this.testDir, 'src', 'index.ts'), 'console.log("test");');
    await fs.writeFile(path.join(this.testDir, 'node_modules', 'some-package.js'), '// package');
    await fs.writeFile(path.join(this.testDir, 'test.log'), 'log data');
  }

  private async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }
  }

  private async testIgnorePatternMatching(): Promise<void> {
    console.log('Testing ignore pattern matching...');
    
    const generator = new (DirTreeGenerator as any)(); // Access private methods for testing
    
    // Test exact match
    generator.ignorePatterns = [/^node_modules$/];
    const shouldIgnoreExact = generator.shouldIgnore('node_modules', './node_modules');
    this.assert(shouldIgnoreExact, 'Should ignore exact match "node_modules"');
    
    // Test wildcard pattern
    generator.ignorePatterns = [/^.*\.log$/];
    const shouldIgnoreWildcard = generator.shouldIgnore('test.log', './test.log');
    this.assert(shouldIgnoreWildcard, 'Should ignore wildcard pattern "*.log"');
    
    // Test should not ignore
    const shouldNotIgnore = generator.shouldIgnore('README.md', './README.md');
    this.assert(!shouldNotIgnore, 'Should not ignore "README.md"');
    
    console.log('✅ Ignore pattern tests completed\n');
  }

  private async testDirectoryCreation(): Promise<void> {
    console.log('Testing ignore file creation...');
    
    const ignoreFilePath = path.join(this.testDir, '.dirtree.ignore');
    
    // Ensure ignore file doesn't exist
    try {
      await fs.unlink(ignoreFilePath);
    } catch {
      // File doesn't exist, that's fine
    }
    
    const generator = new (DirTreeGenerator as any)();
    await generator.createDefaultIgnoreFile.call({ ignoreFile: ignoreFilePath });
    
    // Check if file was created
    try {
      const content = await fs.readFile(ignoreFilePath, 'utf8');
      this.assert(content.includes('node_modules'), 'Ignore file should contain "node_modules"');
      this.assert(content.includes('.git'), 'Ignore file should contain ".git"');
    } catch (error) {
      this.assert(false, 'Ignore file should be created successfully');
    }
    
    console.log('✅ Directory creation tests completed\n');
  }

  private async testTreeGeneration(): Promise<void> {
    console.log('Testing tree generation...');
    
    // Create a custom ignore file for this test
    const ignoreFilePath = path.join(this.testDir, '.dirtree.ignore');
    await fs.writeFile(ignoreFilePath, 'node_modules\n*.log\n');
    
    const generator = new (DirTreeGenerator as any)();
    generator.ignoreFile = ignoreFilePath;
    await generator.loadIgnorePatterns();
    
    const tree = await generator.generateTree(this.testDir);
    
    // Check tree structure
    this.assert(tree.includes('📁 src'), 'Tree should include src directory');
    this.assert(tree.includes('📄 package.json'), 'Tree should include package.json file');
    this.assert(tree.includes('📄 README.md'), 'Tree should include README.md file');
    this.assert(!tree.includes('node_modules'), 'Tree should not include ignored node_modules');
    this.assert(!tree.includes('test.log'), 'Tree should not include ignored log files');
    
    console.log('✅ Tree generation tests completed\n');
  }

  private async cleanupTestEnvironment(): Promise<void> {
    try {
      await fs.rm(this.testDir, { recursive: true, force: true });
    } catch (error) {
      // Cleanup failed, but don't fail the tests
      console.warn('⚠️  Could not clean up test directory');
    }
  }

  private assert(condition: boolean, message: string): void {
    if (condition) {
      this.results.passed++;
      console.log(`  ✅ ${message}`);
    } else {
      this.results.failed++;
      this.results.errors.push(message);
      console.log(`  ❌ ${message}`);
    }
  }

  private printResults(): void {
    console.log('═'.repeat(60));
    console.log('🧪 Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Failures:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : '0';
    
    console.log(`\n📊 Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log('\n🚨 Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
    }
  }
}

// Run tests if this file is executed directly
// Main execution (ESM-compatible, Node 18)
function isMainModule(): boolean {
  // Remove 'file://' prefix and normalize both paths to fix windows backslash quirkiness
  const metaPath = path.normalize(import.meta.url.replace('file:///', ''));
  const argvPath = process.argv[1] ? path.normalize(process.argv[1]) : '';
  return metaPath === argvPath;
}

if (isMainModule()) {
  const test = new DirTreeTest();
  test.runAllTests().catch(error => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Test runner failed:', errorMessage);
    process.exit(1);
  });
}

export default DirTreeTest;