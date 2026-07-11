import 'dotenv/config';
import { getCorePlayerSitemap, getCoreTeamSitemap, getCoreMatchSitemap } from '@/shared/seo/sitemap';

async function main() {
  console.log('Fetching sitemap entry counts...');
  try {
    const teams = await getCoreTeamSitemap();
    console.log(`Core Teams sitemap count: ${teams.length}`);
  } catch (e) {
    console.error('Error fetching teams:', e);
  }

  try {
    const players = await getCorePlayerSitemap();
    console.log(`Core Players sitemap count: ${players.length}`);
  } catch (e) {
    console.error('Error fetching players:', e);
  }

  try {
    const players = await getCorePlayerSitemap();
    console.log('Sample player URLs:');
    players.slice(0, 10).forEach(p => console.log(`  ${p.url}`));
  } catch (e) {}
}

main();
