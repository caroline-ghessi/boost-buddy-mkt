import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapeRequest {
  competitorName: string;
  platforms: {
    website?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  scrapeType: "full" | "quick";
  userId: string;
  mode?: "trigger" | "fetch"; // Modo de operação: trigger = novo scraping, fetch = buscar resultado existente
}

// Fetch latest scheduled run results (optimized endpoint)
async function fetchLatestApifyRun({ actorId, username }: { actorId: string; username?: string }) {
  const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
  
  console.log(`📥 Fetching latest run results for actor: ${actorId}${username ? ` (@${username})` : ''}`);
  
  try {
    // Use the optimized endpoint to get last run dataset items directly
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/runs/last/dataset/items?token=${APIFY_API_TOKEN}&status=SUCCEEDED`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Apify API returned ${response.status}: ${response.statusText}`);
    }
    
    const results = await response.json();
    
    if (!results || results.length === 0) {
      throw new Error(`No data found in last successful run for actor ${actorId}`);
    }
    
    // Get run metadata from headers
    const runId = response.headers.get('x-apify-run-id');
    const finishedAt = response.headers.get('x-apify-run-finished-at') || new Date().toISOString();
    
    console.log(`✅ Retrieved ${results.length} items from last run (${runId})`);
    console.log(`📅 Run finished at: ${finishedAt}`);
    
    return {
      results,
      runInfo: {
        id: runId,
        finishedAt,
        stats: null
      }
    };
  } catch (error) {
    console.error(`❌ Error fetching latest run for ${actorId}:`, (error as Error).message);
    throw error;
  }
}

// Run actor synchronously (optimized endpoint - no polling needed)
async function runApifyActorSync({ actorId, input }: { actorId: string; input: any }) {
  const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
  
  console.log(`🚀 Running Apify actor synchronously: ${actorId}`);
  console.log(`📋 Input:`, JSON.stringify(input, null, 2));
  
  try {
    // Use synchronous endpoint that waits for completion and returns dataset items directly
    const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API error ${response.status}: ${errorText}`);
    }
    
    const results = await response.json();
    
    // Get run metadata from headers
    const runId = response.headers.get('x-apify-run-id');
    const finishedAt = response.headers.get('x-apify-run-finished-at') || new Date().toISOString();
    
    console.log(`✅ Actor completed synchronously, ${results.length} items scraped`);
    console.log(`🆔 Run ID: ${runId}`);
    console.log(`📅 Finished at: ${finishedAt}`);
    
    return {
      results,
      runInfo: {
        id: runId,
        finishedAt
      }
    };
  } catch (error) {
    console.error(`❌ Error running actor ${actorId}:`, (error as Error).message);
    throw error;
  }
}

function calculatePostMetrics(posts: any[]) {
  if (!posts || posts.length === 0) {
    return {
      avgLikes: 0,
      avgComments: 0,
      postingFrequency: "0 posts/semana",
      mostEngagedPost: null,
      topHashtags: [],
      postTypes: {},
    };
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
  
  const avgLikes = Math.round(totalLikes / posts.length);
  const avgComments = Math.round(totalComments / posts.length);
  
  // Posting frequency
  const oldestPost = new Date(posts[posts.length - 1]?.timestamp || Date.now());
  const newestPost = new Date(posts[0]?.timestamp || Date.now());
  const daysDiff = Math.max(1, (newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24));
  const postsPerWeek = (posts.length / daysDiff) * 7;
  
  // Most engaged post
  const mostEngagedPost = posts.reduce((max, p) => {
    const engagement = (p.likesCount || 0) + (p.commentsCount || 0);
    const maxEngagement = (max.likesCount || 0) + (max.commentsCount || 0);
    return engagement > maxEngagement ? p : max;
  }, posts[0]);
  
  // Top hashtags
  const hashtagCounts: Record<string, number> = {};
  posts.forEach(p => {
    const caption = p.caption || "";
    const hashtags = caption.match(/#\w+/g) || [];
    hashtags.forEach((tag: string) => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag);
  
  // Post types
  const postTypes = posts.reduce((acc, p) => {
    const type = p.type || "image";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    avgLikes,
    avgComments,
    postingFrequency: `${postsPerWeek.toFixed(1)} posts/semana`,
    mostEngagedPost: {
      url: mostEngagedPost.url,
      caption: mostEngagedPost.caption?.substring(0, 100),
      likes: mostEngagedPost.likesCount,
      comments: mostEngagedPost.commentsCount,
    },
    topHashtags,
    postTypes,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { competitorName, platforms, scrapeType, userId, mode = "trigger" }: ScrapeRequest = await req.json();

    console.log(`🐶 Thiago Costa iniciando scraping de ${competitorName}`);
    console.log(`📍 Plataformas:`, Object.keys(platforms));

    const results = [];

    // Website scraping
    if (platforms.website) {
      try {
        console.log(`🌐 Scraping website: ${platforms.website}`);
        const websiteResult = await runApifyActorSync({
          actorId: "apify/website-content-crawler",
          input: {
            startUrls: [{ url: platforms.website }],
            maxCrawlPages: scrapeType === "full" ? 50 : 5,
            crawlerType: "playwright:firefox",
            proxyConfiguration: { useApifyProxy: true },
          },
        });
        const websiteData = websiteResult.results;

        await supabase.from("competitor_data").insert({
          user_id: userId,
          competitor_name: competitorName,
          platform: "website",
          data_type: "content",
          data: {
            url: platforms.website,
            pages: websiteData.slice(0, 10), // Limit stored data
            totalPages: websiteData.length,
          },
          scraped_at: new Date().toISOString(),
        });

        results.push({ platform: "website", itemsScraped: websiteData.length });
      } catch (error) {
        console.error("❌ Website scraping error:", error);
        results.push({ platform: "website", error: (error as Error).message });
      }
    }

    // Instagram scraping - HYBRID MODE
    if (platforms.instagram) {
      try {
        console.log(`📷 Processing Instagram: ${platforms.instagram} (mode: ${mode})`);
        const username = platforms.instagram
          .replace("@", "")
          .replace("https://instagram.com/", "")
          .replace("https://www.instagram.com/", "")
          .split("/")[0];
        
        let profileData;
        let postsData;
        let runInfo: { id: string | null; finishedAt: string | null } = { id: null, finishedAt: null };
        let scrapingMode = mode; // Track actual mode used
        
        if (mode === "fetch") {
          console.log(`📥 Fetching latest scheduled data for @${username}...`);
          
          try {
            // FETCH: Buscar dados do último run programado do perfil
            const profileResult = await fetchLatestApifyRun({
              actorId: "apify/instagram-scraper",
              username: username
            });
            profileData = profileResult.results[0];
            runInfo = profileResult.runInfo;
            
            // FETCH: Buscar posts do último run programado
            const postsResult = await fetchLatestApifyRun({
              actorId: "apify/instagram-post-scraper",
              username: username
            });
            postsData = postsResult.results;
            
            console.log(`✅ Fetched data from scheduled run: ${runInfo.finishedAt}`);
            
          } catch (fetchError) {
            console.warn(`⚠️ Could not fetch scheduled data: ${(fetchError as Error).message}`);
            console.log(`🔄 Falling back to on-demand scraping...`);
            scrapingMode = "trigger"; // Fall back to trigger mode
          }
        }
        
        if (mode === "trigger" || scrapingMode === "trigger") {
          console.log(`🚀 Running on-demand scraping for @${username}...`);
          
          // TRIGGER: Scraping síncrono do perfil
          const profileResult = await runApifyActorSync({
            actorId: "apify/instagram-scraper",
            input: {
              usernames: [username],
              resultsType: "details",
            },
          });
          profileData = profileResult.results[0];
          runInfo = profileResult.runInfo;
          
          // TRIGGER: Scraping síncrono dos posts
          const postsResult = await runApifyActorSync({
            actorId: "apify/instagram-post-scraper",
            input: {
              usernames: [username],
              resultsLimit: scrapeType === "full" ? 50 : 20,
            },
          });
          postsData = postsResult.results;
          
          console.log(`✅ On-demand scraping completed`);
        }

        // Calcular métricas agregadas dos posts
        const postMetrics = calculatePostMetrics(postsData);

        // Calcular engagement rate com dados do perfil
        if (profileData?.followersCount && postsData.length > 0) {
          const totalEngagement = postsData.reduce((sum: number, p: any) => 
            sum + (p.likesCount || 0) + (p.commentsCount || 0), 0
          );
          const avgEngagement = totalEngagement / postsData.length;
          (postMetrics as any).avgEngagementRate = ((avgEngagement / profileData.followersCount) * 100).toFixed(2);
        }

        // Salvar dados COMBINADOS no banco com metadata completa
        const scrapedAt = runInfo?.finishedAt || new Date().toISOString();
        
        await supabase.from("competitor_data").insert({
          user_id: userId,
          competitor_name: competitorName,
          platform: "instagram",
          data_type: "combined",
          data: {
            username: username,
            
            // DADOS DO PERFIL
            profile: {
              fullName: profileData?.fullName,
              biography: profileData?.biography,
              followersCount: profileData?.followersCount,
              followsCount: profileData?.followsCount,
              postsCount: profileData?.postsCount,
              verified: profileData?.verified,
              isPrivate: profileData?.isPrivate,
              profilePicUrl: profileData?.profilePicUrl,
              externalUrl: profileData?.externalUrl,
            },
            
            // DADOS DOS POSTS
            posts: postsData.slice(0, 30),
            
            // MÉTRICAS CALCULADAS
            metrics: {
              totalPostsAnalyzed: postsData.length,
              avgLikes: postMetrics.avgLikes,
              avgComments: postMetrics.avgComments,
              avgEngagementRate: (postMetrics as any).avgEngagementRate || 0,
              postingFrequency: postMetrics.postingFrequency,
              mostEngagedPost: postMetrics.mostEngagedPost,
              topHashtags: postMetrics.topHashtags,
              postTypes: postMetrics.postTypes,
            },
            
            // METADATA DO SCRAPING
            scrapeMetadata: {
              mode: scrapingMode, // "fetch" ou "trigger"
              apifyRunId: runInfo?.id,
              scrapedAt: scrapedAt,
              dataSource: mode === "fetch" ? "scheduled_run" : "on_demand",
            },
          },
          scraped_at: scrapedAt,
        });

        console.log(`💾 Data saved to database (scraped_at: ${scrapedAt}, mode: ${scrapingMode})`);

        results.push({ 
          platform: "instagram", 
          profileScraped: !!profileData,
          postsScraped: postsData.length,
          mode: scrapingMode,
          scrapedAt: scrapedAt,
        });
        
      } catch (error) {
        console.error("❌ Instagram processing error:", error);
        results.push({ 
          platform: "instagram", 
          error: (error as Error).message 
        });
      }
    }

    // Facebook scraping
    if (platforms.facebook) {
      try {
        console.log(`📘 Scraping Facebook: ${platforms.facebook}`);
        const fbResult = await runApifyActorSync({
          actorId: "apify/facebook-pages-scraper",
          input: {
            startUrls: [`https://www.facebook.com/${platforms.facebook}`],
            maxPosts: scrapeType === "full" ? 50 : 10,
          },
        });
        const fbData = fbResult.results;

        await supabase.from("competitor_data").insert({
          user_id: userId,
          competitor_name: competitorName,
          platform: "facebook",
          data_type: "social",
          data: {
            pageUrl: platforms.facebook,
            posts: fbData.slice(0, 10),
          },
          scraped_at: new Date().toISOString(),
        });

        results.push({ platform: "facebook", itemsScraped: fbData.length });
      } catch (error) {
        console.error("❌ Facebook scraping error:", error);
        results.push({ platform: "facebook", error: (error as Error).message });
      }
    }

    // LinkedIn scraping
    if (platforms.linkedin) {
      try {
        console.log(`💼 Scraping LinkedIn: ${platforms.linkedin}`);
        const linkedinResult = await runApifyActorSync({
          actorId: "apify/linkedin-company-scraper",
          input: {
            companyUrls: [`https://www.linkedin.com/company/${platforms.linkedin}`],
          },
        });
        const linkedinData = linkedinResult.results;

        await supabase.from("competitor_data").insert({
          user_id: userId,
          competitor_name: competitorName,
          platform: "linkedin",
          data_type: "social",
          data: {
            companyUrl: platforms.linkedin,
            profile: linkedinData[0] || {},
          },
          scraped_at: new Date().toISOString(),
        });

        results.push({ platform: "linkedin", itemsScraped: linkedinData.length });
      } catch (error) {
        console.error("❌ LinkedIn scraping error:", error);
        results.push({ platform: "linkedin", error: (error as Error).message });
      }
    }

    console.log(`✅ Scraping completo! Iniciando análise com Thiago Costa...`);

    // Trigger analysis
    await supabase.functions.invoke("analyze-competitor", {
      body: {
        competitorName,
        userId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        competitorName,
        results,
        message: "🐶 Thiago está analisando os dados coletados...",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro no scraping:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
