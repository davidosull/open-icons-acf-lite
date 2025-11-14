import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync, createWriteStream, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const buildsDir = join(rootDir, 'builds');
const pluginName = 'acf-open-icons';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Building distribution packages for version ${version}...`);

// Sync version to acf-open-icons.php
console.log('Syncing version to acf-open-icons.php...');
const pluginFile = join(rootDir, 'acf-open-icons.php');
let pluginContent = readFileSync(pluginFile, 'utf8');
pluginContent = pluginContent.replace(/Version:\s*[\d.]+/, `Version: ${version}`);
writeFileSync(pluginFile, pluginContent);

// Build assets
console.log('Building assets...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

// Ensure builds directory exists
if (!existsSync(buildsDir)) {
  mkdirSync(buildsDir, { recursive: true });
}

// Create temporary staging directory
const stageDir = join(buildsDir, '.stage');
if (existsSync(stageDir)) {
  rmSync(stageDir, { recursive: true, force: true });
}
mkdirSync(stageDir, { recursive: true });
const pluginStageDir = join(stageDir, pluginName);
mkdirSync(pluginStageDir, { recursive: true });

// Files to exclude from source zip
const excludePatterns = [
  'node_modules',
  '.git',
  '.gitignore',
  'builds',
  '.DS_Store',
  'Thumbs.db',
  '.log',
  '.dev',
  '.vscode',
  '.idea',
];

// Production files (only acf-open-icons.php, includes/, assets/)
const productionFiles = [
  'acf-open-icons.php',
  'includes',
  'assets',
];

// Helper function to check if a path should be excluded
function shouldExclude(filePath, patterns) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(normalizedPath);
    }
    const parts = normalizedPath.split('/');
    return parts.some(part => part === pattern || part.endsWith(pattern));
  });
}

// Recursively copy directory
function copyRecursive(src, dest, includeList = null, excludeList = []) {
  if (!existsSync(src)) {
    return;
  }

  const stats = statSync(src);

  if (stats.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    const entries = readdirSync(src);
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      const relativePath = relative(rootDir, srcPath).replace(/\\/g, '/');

      // Check if should be excluded
      if (shouldExclude(relativePath, excludeList)) {
        continue;
      }

      // If includeList provided, only include matching files
      if (includeList) {
        const shouldInclude = includeList.some(inc => {
          if (relativePath === inc || relativePath.startsWith(inc + '/')) {
            return true;
          }
          return false;
        });
        if (!shouldInclude) {
          continue;
        }
      }

      copyRecursive(srcPath, destPath, includeList, excludeList);
    }
  } else {
    const relativePath = relative(rootDir, src).replace(/\\/g, '/');

    // Check if should be excluded
    if (shouldExclude(relativePath, excludeList)) {
      return;
    }

    // If includeList provided, only include matching files
    if (includeList) {
      const shouldInclude = includeList.some(inc => {
        if (relativePath === inc || relativePath.startsWith(inc + '/')) {
          return true;
        }
        return false;
      });
      if (!shouldInclude) {
        return;
      }
    }

    // Ensure destination directory exists
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    cpSync(src, dest);
  }
}

// Copy production files
console.log('Preparing production build...');
copyRecursive(rootDir, pluginStageDir, productionFiles, []);

// Create production zip
const productionZipPath = join(buildsDir, `${pluginName}-${version}.zip`);
console.log(`Creating ${productionZipPath}...`);
await createZip(pluginStageDir, productionZipPath, pluginName);

// Create latest zip (same as production)
const latestZipPath = join(buildsDir, `${pluginName}-latest.zip`);
console.log(`Creating ${latestZipPath}...`);
await createZip(pluginStageDir, latestZipPath, pluginName);

// Clean and prepare source build
rmSync(pluginStageDir, { recursive: true, force: true });
mkdirSync(pluginStageDir, { recursive: true });

// Copy all files for source build (excluding node_modules, .git, etc.)
console.log('Preparing source build...');
copyRecursive(rootDir, pluginStageDir, null, excludePatterns);

// Create source zip
const sourceZipPath = join(buildsDir, `${pluginName}-${version}-src.zip`);
console.log(`Creating ${sourceZipPath}...`);
await createZip(pluginStageDir, sourceZipPath, pluginName);

// Clean up staging directory
rmSync(stageDir, { recursive: true, force: true });

console.log('\n✅ Distribution packages created successfully!');
console.log(`  - ${pluginName}-${version}.zip (production)`);
console.log(`  - ${pluginName}-latest.zip (production)`);
console.log(`  - ${pluginName}-${version}-src.zip (source)`);

// Helper function to create zip archive
function createZip(sourceDir, zipPath, entryName) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => reject(err));
    output.on('close', () => resolve());

    archive.pipe(output);

    // Add all files from sourceDir, but prefix with entryName
    archive.directory(sourceDir, entryName, false);
    archive.finalize();
  });
}
