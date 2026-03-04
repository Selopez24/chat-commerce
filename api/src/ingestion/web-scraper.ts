import * as cheerio from 'cheerio';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  links: string[];
}

export interface ChunkedContent {
  source: string;
  chunks: string[];
}

export class WebScraper {
  private static readonly USER_AGENT =
    'Mozilla/5.0 (compatible; ChatCommerceBot/1.0; +https://chatcommerce.ai)';

  static async scrape(url: string): Promise<ScrapedContent> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, header, footer, aside, noscript').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || url;

    const bodyText = $('body').text();
    const content = this.cleanText(bodyText);

    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && this.isValidUrl(href)) {
        links.push(href);
      }
    });

    return {
      url,
      title,
      content,
      links: [...new Set(links)],
    };
  }

  static async scrapeWithDepth(
    startUrl: string,
    maxDepth: number = 1,
    maxPages: number = 10,
    visited: Set<string> = new Set(),
  ): Promise<ScrapedContent[]> {
    const results: ScrapedContent[] = [];
    const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
    const baseUrl = new URL(startUrl).origin;

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth } = queue.shift()!;

      if (visited.has(url)) continue;
      visited.add(url);

      try {
        const scraped = await this.scrape(url);
        results.push(scraped);

        if (depth < maxDepth) {
          for (const link of scraped.links) {
            const absoluteLink = this.toAbsoluteUrl(link, baseUrl);
            if (
              absoluteLink &&
              !visited.has(absoluteLink) &&
              this.isSameDomain(absoluteLink, baseUrl)
            ) {
              queue.push({ url: absoluteLink, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to scrape ${url}:`, error);
      }
    }

    return results;
  }

  static chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (
        currentChunk.length + trimmedSentence.length + 1 > maxChunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5)).join(' ');
        currentChunk = overlapWords + ' ' + trimmedSentence + '.';
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence + '.';
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private static toAbsoluteUrl(href: string, baseUrl: string): string | null {
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
      }
      if (href.startsWith('/')) {
        return baseUrl + href;
      }
      if (href.startsWith('./') || href.startsWith('../')) {
        return new URL(href, baseUrl).toString();
      }
      return null;
    } catch {
      return null;
    }
  }

  private static isSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);
      return urlObj.hostname === baseObj.hostname;
    } catch {
      return false;
    }
  }
}
