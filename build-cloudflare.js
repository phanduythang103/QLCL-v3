#!/usr/bin/env node

// Build script for Cloudflare Pages
// This script creates a .env.local file from Cloudflare environment variables
// before running the actual build

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Cloudflare Build Script');
console.log('📝 Creating .env.local from Cloudflare environment variables...');
console.log('DEBUG - process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('DEBUG - process.env.VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('DEBUG - process.env.VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'EXISTS' : 'MISSING');

const envContent = `VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
VITE_GEMINI_API_KEY=${process.env.VITE_GEMINI_API_KEY || ''}
`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ .env.local created');
console.log('📦 Running npm run build...');

execSync('npm run build', { stdio: 'inherit' });
