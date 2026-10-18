/* global HTMLRewriter */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Fetch the original static response from Cloudflare Assets
    // This gets your index.html (the Quasar app shell)
    const response = await env.ASSETS.fetch(request);

    // Only rewrite for HTML requests
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      return response;
    }

    // 2. Determine SEO Metadata based on the URL
    let seo = {
      title: "Food Wright - Social Recipe Sharing",
      description: "Discover, share, and log your cooking masterpieces with the Food Wright community.",
      image: "https://foodwright.com/icons/icon-512x512.png", // Fallback logo
    };

    // Case: Individual Recipe Page (e.g., /recipe/123-grandmas-cookies)
    const recipeMatch = path.match(/^\/recipe\/(\d+)/);
    if (recipeMatch) {
      const recipeId = recipeMatch[1];
      try {
        // We make a quick sub-request to the Go API to get the recipe details
        // We use a shorter timeout to ensure the user doesn't wait too long
        const apiResponse = await fetch(`http://localhost:8080/api/recipes/${recipeId}`, {
           headers: { 'User-Agent': 'FoodWright-SEO-Bot' },
           signal: AbortSignal.timeout(2000)
        });

        if (apiResponse.ok) {
          const recipe = await apiResponse.json();
          seo.title = `${recipe.title} - Food Wright`;
          seo.description = recipe.description || seo.description;
          if (recipe.image_url && recipe.image_url.Valid) {
            seo.image = recipe.image_url.String;
          }
        }
      } catch (e) {
        console.error("SEO Fetch Error:", e);
      }
    }

    // 3. Inject the metadata using HTMLRewriter
    return new HTMLRewriter()
      .on("title", {
        element(e) {
          e.setInnerContent(seo.title);
        },
      })
      .on("head", {
        element(e) {
          // Standard Meta
          e.append(`<meta name="description" content="${seo.description}" />`, { html: true });
          
          // Open Graph (Facebook / Discord / etc)
          e.append(`<meta property="og:title" content="${seo.title}" />`, { html: true });
          e.append(`<meta property="og:description" content="${seo.description}" />`, { html: true });
          e.append(`<meta property="og:image" content="${seo.image}" />`, { html: true });
          e.append(`<meta property="og:type" content="website" />`, { html: true });
          
          // Twitter
          e.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
          e.append(`<meta name="twitter:title" content="${seo.title}" />`, { html: true });
          e.append(`<meta name="twitter:description" content="${seo.description}" />`, { html: true });
          e.append(`<meta name="twitter:image" content="${seo.image}" />`, { html: true });
        },
      })
      .transform(response);
  },
};
