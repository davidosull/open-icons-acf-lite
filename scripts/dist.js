import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync, createWriteStream, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const buildsDir = join(rootDir, 'builds');
const pluginName = 'open-icons-acf';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Building distribution packages for version ${version}...`);

// Sync version to open-icons-acf.php
console.log('Syncing version to open-icons-acf.php...');
const pluginFile = join(rootDir, 'open-icons-acf.php');
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
  'docs',
];

// Files to always exclude (applied to all builds including production)
const alwaysExclude = [
  '.DS_Store',
  '.gitignore',
  '.git',
  '.dev',
  'Thumbs.db',
  'docs',
];

// Production files for WordPress.org submission
const productionFiles = [
  'open-icons-acf.php',
  'includes',
  'assets',
  'src',
  'readme.txt',
  'LICENSE',
];

// Helper function to check if a path should be excluded
function shouldExclude(filePath, patterns) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const fileName = parts[parts.length - 1];

  if (fileName.startsWith('.')) {
    return true;
  }

  if (alwaysExclude.some(exc => parts.some(part => part === exc))) {
    return true;
  }

  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(normalizedPath);
    }
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

      if (shouldExclude(relativePath, excludeList)) {
        continue;
      }

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

    if (shouldExclude(relativePath, excludeList)) {
      return;
    }

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

console.log('\nDistribution packages created successfully!');
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

    archive.directory(sourceDir, entryName, false);
    archive.finalize();
  });
}
