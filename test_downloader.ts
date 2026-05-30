import { getVideoInfo } from './src/lib/downloader';

async function test() {
  console.log('Fetching info for a YouTube video...');
  const info = await getVideoInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw'); // "Me at the zoo" - short video
  console.log(info ? `Success: ${info.title}` : 'Failed to fetch info.');
}

test();
