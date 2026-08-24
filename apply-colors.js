const fs = require('fs');
const path = require('path');

function replaceColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-\[#0B132B\]/g, 'bg-brand-twilight');
  content = content.replace(/bg-\[#060B14\]/g, 'bg-brand-dusk');
  content = content.replace(/bg-\[#05080f\]/g, 'bg-brand-twilight');
  content = content.replace(/bg-slate-950/g, 'bg-brand-twilight');
  content = content.replace(/bg-slate-900/g, 'bg-brand-dusk');
  content = content.replace(/bg-slate-800/g, 'bg-brand-dusk');
  
  // Texts
  content = content.replace(/text-slate-100/g, 'text-brand-sandstone');
  content = content.replace(/text-white/g, 'text-brand-sandstone');
  
  // Accents
  content = content.replace(/sky-500/g, 'brand-caribbeanSea');
  content = content.replace(/sky-400/g, 'brand-caribbeanSea');
  content = content.replace(/sky-300/g, 'brand-caribbeanSea');
  
  content = content.replace(/amber-400/g, 'brand-goldenHour');
  content = content.replace(/amber-500/g, 'brand-goldenHour');
  
  content = content.replace(/emerald-400/g, 'brand-sunriseCoral');
  content = content.replace(/emerald-500/g, 'brand-sunriseCoral');
  
  content = content.replace(/slate-400/g, 'brand-sandstone\/60');
  content = content.replace(/slate-500/g, 'brand-sandstone\/40');
  content = content.replace(/slate-800\/50/g, 'brand-dusk');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceColors(fullPath);
    }
  }
}

walkDir('apps/web/src');
walkDir('apps/admin/src');
walkDir('apps/moderation/src');
