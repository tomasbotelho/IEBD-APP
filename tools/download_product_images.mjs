import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const FOTOS_DIR = path.join(ROOT, 'fotos');

const products = [
  { id: 1, sport: 'corrida', name: 'Nike Air Zoom Pegasus 40', slug: 'nike-air-zoom-pegasus-40' },
  { id: 2, sport: 'corrida', name: 'Adidas Own the Run Tee', slug: 'adidas-own-the-run-tee' },
  { id: 3, sport: 'corrida', name: 'Garmin Forerunner 55', slug: 'garmin-forerunner-55' },
  { id: 4, sport: 'fitness', name: 'Domyos Hex Dumbbell 10 kg', slug: 'domyos-hex-dumbbell-10kg' },
  { id: 5, sport: 'fitness', name: 'Adidas Training Mat 10 mm', slug: 'adidas-training-mat-10mm' },
  { id: 6, sport: 'fitness', name: 'Nike Resistance Band Medium', slug: 'nike-resistance-band-medium' },
  { id: 7, sport: 'outdoor', name: 'Quechua NH Escape 500 23L', slug: 'quechua-nh-escape-500-23l' },
  { id: 8, sport: 'outdoor', name: 'Columbia Ascender Softshell', slug: 'columbia-ascender-softshell' },
  { id: 9, sport: 'outdoor', name: 'Petzl Actik Core', slug: 'petzl-actik-core' },
  { id: 10, sport: 'futebol', name: 'Adidas UCL League Ball', slug: 'adidas-ucl-league-ball' },
  { id: 11, sport: 'futebol', name: 'Nike Mercurial Superfly 9 Club', slug: 'nike-mercurial-superfly-9-club' },
  { id: 12, sport: 'futebol', name: 'Kipsta Essential 24 Cones', slug: 'kipsta-essential-24-cones' },
  { id: 13, sport: 'ciclismo', name: 'Giro Register MIPS', slug: 'giro-register-mips' },
  { id: 14, sport: 'ciclismo', name: 'Lezyne Hecto Drive 500XL Set', slug: 'lezyne-hecto-drive-500xl-set' },
  { id: 15, sport: 'ciclismo', name: 'Castelli Arenberg Gel 2 Gloves', slug: 'castelli-arenberg-gel-2-gloves' },
  { id: 16, sport: 'caminhada', name: 'Merrell Moab 3 Mid GTX', slug: 'merrell-moab-3-mid-gtx' },
  { id: 17, sport: 'caminhada', name: 'Forclaz MT500 Anti-Shock', slug: 'forclaz-mt500-anti-shock' },
  { id: 18, sport: 'caminhada', name: 'CamelBak Arete 18', slug: 'camelbak-arete-18' },
  { id: 19, sport: 'andebol', name: 'Select Ultimate EHF', slug: 'select-ultimate-ehf' },
  { id: 20, sport: 'andebol', name: 'Hummel Knee Pad Pro', slug: 'hummel-knee-pad-pro' },
  { id: 21, sport: 'andebol', name: 'Quickplay Handball Goal 3x2', slug: 'quickplay-handball-goal-3x2' },
  { id: 22, sport: 'basquetebol', name: 'Wilson NBA DRV Pro', slug: 'wilson-nba-drv-pro' },
  { id: 23, sport: 'basquetebol', name: 'Nike Precision 6', slug: 'nike-precision-6' },
  { id: 24, sport: 'basquetebol', name: 'Nike Pro Elite Sleeves', slug: 'nike-pro-elite-sleeves' },
  { id: 25, sport: 'voleibol', name: 'Mikasa V200W Replica', slug: 'mikasa-v200w-replica' },
  { id: 26, sport: 'voleibol', name: 'Mizuno VS-1 Knee Pads', slug: 'mizuno-vs-1-knee-pads' },
  { id: 27, sport: 'voleibol', name: 'Molten Double Action Pump', slug: 'molten-double-action-pump' },
  { id: 28, sport: 'natacao', name: 'Speedo Biofuse 2.0 Goggles', slug: 'speedo-biofuse-2-0-goggles' },
  { id: 29, sport: 'natacao', name: 'Arena Classic Silicone Cap', slug: 'arena-classic-silicone-cap' },
  { id: 30, sport: 'natacao', name: 'Nabaiji Kickboard 500', slug: 'nabaiji-kickboard-500' },
];

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractImageCandidates(html) {
  const matches = [...html.matchAll(/murl&quot;:&quot;([^&]+?)(?:&quot;|,)/g)];
  const urls = matches
    .map((match) => decodeHtmlEntities(match[1]))
    .filter((url) => /^https?:\/\//i.test(url));
  return [...new Set(urls)];
}

function extensionFromContentType(contentType, url) {
  const cleanType = (contentType || '').split(';')[0].trim().toLowerCase();
  if (cleanType === 'image/jpeg') return '.jpg';
  if (cleanType === 'image/png') return '.png';
  if (cleanType === 'image/webp') return '.webp';
  if (cleanType === 'image/gif') return '.gif';
  const pathname = new URL(url).pathname.toLowerCase();
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp', '.gif']) {
    if (pathname.endsWith(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext;
    }
  }
  return '.jpg';
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      'accept-language': 'pt-PT,pt;q=0.9,en;q=0.8',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function downloadImage(url, destinationWithoutExtension) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0',
      referer: 'https://www.bing.com/',
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`content-type inesperado: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 10_000) {
    throw new Error(`imagem demasiado pequena: ${buffer.length} bytes`);
  }

  const ext = extensionFromContentType(contentType, response.url);
  const fullPath = `${destinationWithoutExtension}${ext}`;
  await fs.writeFile(fullPath, buffer);
  return {
    fullPath,
    ext,
    size: buffer.length,
    sourceUrl: response.url,
    contentType,
  };
}

async function main() {
  await fs.mkdir(FOTOS_DIR, { recursive: true });
  const manifest = [];

  for (const product of products) {
    const sportDir = path.join(FOTOS_DIR, product.sport);
    await fs.mkdir(sportDir, { recursive: true });

    const query = encodeURIComponent(product.name);
    const searchUrl = `https://www.bing.com/images/search?q=${query}&form=HDRSC3`;
    const html = await fetchText(searchUrl);
    const candidates = extractImageCandidates(html).slice(0, 12);

    if (!candidates.length) {
      throw new Error(`Sem resultados de imagem para: ${product.name}`);
    }

    let downloaded = null;
    const baseTarget = path.join(sportDir, product.slug);
    for (const candidate of candidates) {
      try {
        downloaded = await downloadImage(candidate, baseTarget);
        break;
      } catch (error) {
        // Tenta a imagem seguinte sem parar o lote.
      }
    }

    if (!downloaded) {
      throw new Error(`Falha a descarregar imagem para: ${product.name}`);
    }

    const relativePath = path.relative(ROOT, downloaded.fullPath).replaceAll('\\', '/');
    manifest.push({
      id: product.id,
      name: product.name,
      sport: product.sport,
      localPath: relativePath,
      imageUrl: downloaded.sourceUrl,
      bytes: downloaded.size,
      contentType: downloaded.contentType,
    });

    console.log(`${product.id}. ${product.name} -> ${relativePath}`);
  }

  await fs.writeFile(
    path.join(FOTOS_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

await main();
