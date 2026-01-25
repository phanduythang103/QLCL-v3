#!/usr/bin/env node

// Build script for Cloudflare Pages
// This script creates a .env.local file from Cloudflare environment variables
// before running the actual build

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Cloudflare Build Script');
console.log('📝 Environment check:');
console.log(' - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ PRESENT' : '❌ MISSING');
console.log(' - VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ PRESENT' : '❌ MISSING');

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ WARNING: Essential environment variables are missing! Your app will likely fail in production.');
    console.warn('Please ensure you have added them in the Cloudflare Pages Dashboard (Settings > Environment variables).');
}

console.log('📝 Creating .env.local for Vite build...');
const envContent = `VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
VITE_GEMINI_API_KEY=${process.env.VITE_GEMINI_API_KEY || ''}
`;

try {
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ .env.local created successfully');
} catch (err) {
    console.error('❌ Error creating .env.local:', err.message);
}

console.log('📦 Starting bundle build (npm run build)...');

execSync('npm run build', { stdio: 'inherit' });
