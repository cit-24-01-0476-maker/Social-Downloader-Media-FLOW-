/**
 * Decodes standard HTML entities in scraped text strings
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}

/**
 * Compliant HTML scraper that retrieves public Open Graph meta tags (og:title, og:image)
 * from public links without requiring login or access tokens.
 */
export async function fetchOpenGraphMetadata(url: string): Promise<{ title: string | null; image: string | null; creator: string | null } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Regex matchers for og:title, og:image, and og:site_name (for creator tags)
    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || 
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

    const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    const siteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);

    return {
      title: titleMatch ? decodeHtmlEntities(titleMatch[1]) : null,
      image: imageMatch ? imageMatch[1] : null,
      creator: siteMatch ? decodeHtmlEntities(siteMatch[1]) : null
    };
  } catch (e) {
    console.warn('[MediaFlow OG Parser] Scraping failed, using adapter fallback:', e);
    return null;
  }
}
