const { execSync } = require('child_process');

// Ensure DATABASE_URL is defined during prisma client compilation to prevent build crashes in clean Vercel environments
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.log('[MediaFlow Build] No valid DATABASE_URL detected. Setting build-time PostgreSQL fallback URL.');
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/mediaflow?schema=public';
}

try {
  console.log('[MediaFlow Build] 🌀 Running "prisma generate" to build db client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('[MediaFlow Build] 🚀 Running "next build" to compile Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('[MediaFlow Build] 🎉 Build compiled successfully!');
} catch (error) {
  console.error('[MediaFlow Build] ❌ Build step execution failed:', error.message || error);
  process.exit(1);
}
