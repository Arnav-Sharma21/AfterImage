import dotenv from 'dotenv';
import { chromium } from '@playwright/test';
import { createJamendoProvider } from '../src/providers/jamendo.js';

dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true });
const clientId = process.env.JAMENDO_CLIENT_ID;
if (!clientId) {
  console.error('Set JAMENDO_CLIENT_ID in server/.env before verifying live music.');
  process.exit(1);
}

let browser;
try {
  const provider = createJamendoProvider({ clientId });
  const { tracks: results } = await provider.search({ q: process.env.MUSIC_TEST_QUERY || 'ambient', page: 1, limit: 20 });
  const tracks = results.filter(track => track.isPlayable);
  if (!tracks.length) console.log(JSON.stringify({ candidates: results.map(track => ({ id: track.id, licenseUrl: track.licenseUrl, hasStream: Boolean(track.streamUrl), isPlayable: track.isPlayable })) }));
  console.log(JSON.stringify({ provider: 'jamendo', trackCount: tracks.length, sampleTracks: tracks.slice(0, 3).map(track => ({ id: track.providerTrackId, title: track.title, artist: track.artistName, durationSeconds: track.durationSeconds, licenseUrl: track.licenseUrl, sourceUrl: track.sourceUrl, streamHost: new URL(track.streamUrl).hostname })) }));
  if (!tracks.length) throw new Error('no streams');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const selected = tracks.filter(track => track.durationSeconds > 2).sort((a, b) => a.durationSeconds - b.durationSeconds)[0] || tracks[0];
  console.log(JSON.stringify({ verifiedTrackId: selected.providerTrackId, title: selected.title, artist: selected.artistName, licenseUrl: selected.licenseUrl }));
  await page.setContent('<button id="play">Verify real audio</button>');
  await page.evaluate(url => {
    const audio = new Audio(url);
    audio.preload = 'metadata';
    window.verificationAudio = audio;
    document.querySelector('button').addEventListener('click', () => { audio.play().catch(() => {}); });
  }, selected.streamUrl);
  await page.click('#play');
  await page.waitForFunction(() => window.verificationAudio.currentTime > 1 && !window.verificationAudio.paused, null, { timeout: 25000 });
  const result = await page.evaluate(async () => {
    const audio = window.verificationAudio;
    const before = audio.currentTime;
    audio.pause();
    audio.volume = .3;
    audio.currentTime = Math.min(6, audio.duration / 2);
    await new Promise((resolve, reject) => {
      audio.addEventListener('seeked', resolve, { once: true });
      setTimeout(() => reject(new Error('seek timeout')), 10000);
    });
    return { progressSeconds: before, paused: audio.paused, seekSeconds: audio.currentTime, volume: audio.volume, durationSeconds: audio.duration, readyState: audio.readyState };
  });
  console.log(JSON.stringify({ browser: 'Chromium', realAudio: result }));
  if (process.env.MUSIC_VERIFY_FULL_TRACK === '1' && result.durationSeconds <= 30) {
    await page.evaluate(() => { window.verificationAudio.currentTime = 0; });
    await page.click('#play');
    await page.waitForFunction(() => window.verificationAudio.ended, null, { timeout: Math.ceil(result.durationSeconds * 1000) + 15000 });
    console.log(JSON.stringify({ fullRecordingCompletedFromStart: true, durationSeconds: result.durationSeconds }));
  }
} catch (error) {
  // Upstream URLs may contain credentials. Keep failure reporting redacted.
  console.error(JSON.stringify({ verification: 'failed', errorType: error.name, networkCode: error.cause?.code || null }));
  process.exitCode = 1;
} finally {
  await browser?.close();
}
