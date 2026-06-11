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

const PHOTO_RULES: Array<{ keywords: string[]; url: string }> = [
  { keywords: ["corba", "mercimek", "tarhana", "ezogelin"], url: "https://images.unsplash.com/photo-1547592166-23ac45744acd" },
  { keywords: ["salata", "yesillik", "ispanak"], url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd" },
  { keywords: ["tatli", "pasta", "kek", "kurabiye", "baklava", "sutlac", "muhallebi"], url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187" },
  { keywords: ["omlet", "yumurta", "menemen", "kahvalti"], url: "https://images.unsplash.com/photo-1525351484163-7529414344d8" },
  { keywords: ["tavuk"], url: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b" },
  { keywords: ["somon", "balik", "levrek", "palamut", "hamsi"], url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2" },
  { keywords: ["kiyma", "kofte", "dana", "kuzu", "et"], url: "https://images.unsplash.com/photo-1558030006-450675393462" },
  { keywords: ["makarna", "spagetti", "pasta"], url: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8" },
  { keywords: ["pilav", "bulgur", "pirinc"], url: "https://images.unsplash.com/photo-1512058564366-18510be2db19" },
  { keywords: ["pizza"], url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" },
  { keywords: ["burger", "sandvic", "tost"], url: "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9" },
  { keywords: ["borek", "pogaca"], url: "https://images.unsplash.com/photo-1509440159596-0249088772ff" },
  { keywords: ["cay", "kahve", "icecek"], url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574" },
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
    .replace(/ç/g, "c");
}

function sized(url: string, width: number, height: number): string {
  return `${url}?w=${width}&h=${height}&fit=crop&auto=format`;
}

export function getRecipePhoto(recipe: { id: number; title: string; image_url?: string }, width = 480, height = 320): string {
  if (recipe.image_url?.trim()) return recipe.image_url;
  const normalizedTitle = normalizeText(recipe.title);
  const match = PHOTO_RULES.find((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword)));
  if (match) return sized(match.url, width, height);
  return sized(FALLBACK_PHOTOS[recipe.id % FALLBACK_PHOTOS.length], width, height);
}
