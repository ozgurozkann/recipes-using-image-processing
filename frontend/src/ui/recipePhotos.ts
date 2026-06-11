const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445",
  "https://images.unsplash.com/photo-1484723091739-30f299680de",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
  "https://images.unsplash.com/photo-1473093226795-af9932fe5856",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
  "https://images.unsplash.com/photo-1563379926898-05f4575a45d8",
];

const PHOTO_RULES: Array<{ keywords: string[]; urls: string[] }> = [
  {
    keywords: ["corba", "mercimek", "tarhana", "ezogelin"],
    urls: [
      "https://images.unsplash.com/photo-1547592166-23ac45744acd",
      "https://images.unsplash.com/photo-1604152135912-04a022e23696",
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a",
    ],
  },
  {
    keywords: ["salata", "yesillik", "ispanak", "roka"],
    urls: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999",
      "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af",
    ],
  },
  {
    keywords: ["tatli", "pasta", "kek", "kurabiye", "baklava", "sutlac", "muhallebi"],
    urls: [
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
      "https://images.unsplash.com/photo-1488477181946-6428a0291777",
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3",
    ],
  },
  {
    keywords: ["omlet", "yumurta", "menemen", "kahvalti"],
    urls: [
      "https://images.unsplash.com/photo-1525351484163-7529414344d8",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543",
    ],
  },
  {
    keywords: ["tavuk"],
    urls: [
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b",
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d",
    ],
  },
  {
    keywords: ["somon", "balik", "levrek", "palamut", "hamsi"],
    urls: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2",
      "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff",
      "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62",
    ],
  },
  {
    keywords: ["kiyma", "kofte", "dana", "kuzu", "et"],
    urls: [
      "https://images.unsplash.com/photo-1558030006-450675393462",
      "https://images.unsplash.com/photo-1544025162-d76694265947",
      "https://images.unsplash.com/photo-1600891964092-4316c288032e",
    ],
  },
  {
    keywords: ["makarna", "spagetti", "pasta"],
    urls: [
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8",
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
    ],
  },
  {
    keywords: ["pilav", "bulgur", "pirinc"],
    urls: [
      "https://images.unsplash.com/photo-1512058564366-18510be2db19",
      "https://images.unsplash.com/photo-1596797038530-2c107229654b",
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6",
    ],
  },
  {
    keywords: ["pizza"],
    urls: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
      "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    ],
  },
  {
    keywords: ["burger", "sandvic", "tost"],
    urls: [
      "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9",
      "https://images.unsplash.com/photo-1550547660-d9450f859349",
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af",
    ],
  },
  {
    keywords: ["borek", "pogaca"],
    urls: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff",
      "https://images.unsplash.com/photo-1608198093002-ad4e005484ec",
      "https://images.unsplash.com/photo-1586444248902-2f64eddc13df",
    ],
  },
  {
    keywords: ["cay", "kahve", "icecek"],
    urls: [
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
      "https://images.unsplash.com/photo-1544145945-f90425340c7e",
    ],
  },
];

function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ä±/g, "i")
    .replace(/ÄŸ/g, "g")
    .replace(/Ã¼/g, "u")
    .replace(/ÅŸ/g, "s")
    .replace(/Ã¶/g, "o")
    .replace(/Ã§/g, "c");
}

function sized(url: string, width: number, height: number): string {
  return `${url}?w=${width}&h=${height}&fit=crop&auto=format`;
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickPhoto(urls: string[], seed: string): string {
  return urls[hashText(seed) % urls.length];
}

export function getRecipePhoto(recipe: { id: number; title: string; image_url?: string }, width = 480, height = 320): string {
  if (recipe.image_url?.trim()) return recipe.image_url;
  const normalizedTitle = normalizeText(recipe.title);
  const match = PHOTO_RULES.find((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword)));
  const seed = `${recipe.id}-${normalizedTitle}`;
  if (match) return sized(pickPhoto(match.urls, seed), width, height);
  return sized(pickPhoto(FALLBACK_PHOTOS, seed), width, height);
}
