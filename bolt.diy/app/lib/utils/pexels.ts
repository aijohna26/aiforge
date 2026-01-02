export interface PexelsImage {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export async function searchPexels(query: string, perPage: number = 5): Promise<PexelsImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.error('[Pexels] Missing API Key');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.photos || [];
  } catch (error) {
    console.error('[Pexels] Search failed:', error);
    return [];
  }
}
