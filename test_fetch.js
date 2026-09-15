const url = "https://www.amazon.in/dp/B08N5W4NNB";
async function safeExtractMetadata(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!res.ok) {
       console.log("Fetch failed", res.status);
       return null;
    }
    
    const html = await res.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch) title = ogTitleMatch[1];
    
    const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    let image = ogImageMatch ? ogImageMatch[1] : '';
    
    if (!image) {
       const landingImage = html.match(/"large":"([^"]+)"/);
       if (landingImage) image = landingImage[1];
    }
    
    title = title.replace(/Buy\s+/i, '').replace(/\s+Online at Best Price.*/i, '').replace(/\s+at Amazon.*/i, '').replace(/\s*:\s*Amazon.*/i, '');
    
    let brand = '';
    const firstWord = title.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
       brand = firstWord;
    }
    
    return {
      title,
      image,
      brand,
      isMetadataFallback: true
    };
  } catch (e) {
    console.error("Error", e);
  }
}
safeExtractMetadata(url).then(console.log);
