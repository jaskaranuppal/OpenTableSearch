/**
 * Maps the ~20 dataset cuisines into 6 generated "bucket" images.
 * Keeps imagery relevant without generating hundreds of photos.
 */
const BUCKET: Record<string, string> = {
  Italian: "italian",
  Pizza: "italian",
  French: "italian",
  Spanish: "mediterranean",
  Greek: "mediterranean",
  Mediterranean: "mediterranean",
  Indian: "mediterranean",
  Japanese: "asian",
  Sushi: "asian",
  Ramen: "asian",
  Thai: "asian",
  Chinese: "asian",
  Korean: "asian",
  Vietnamese: "asian",
  Mexican: "mexican",
  American: "american",
  Steakhouse: "american",
  Barbecue: "american",
  Vegan: "plants",
  Seafood: "plants",
}

export function cuisineImage(cuisines: string[]): string {
  const first = cuisines?.find((c) => BUCKET[c])
  const bucket = first ? BUCKET[first] : "american"
  return `/images/cuisine/${bucket}.png`
}
