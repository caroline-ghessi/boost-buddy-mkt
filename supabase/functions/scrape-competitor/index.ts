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

async function fetchLatestApifyRun({ actorId, username }: { actorId: string; username?: string }) {
  const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
  
  console.log(`📥 Fetching latest run for actor: ${actorId}`);
  
  // 1. Listar últimos runs do actor
  const runsRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}&status=SUCCEEDED&limit=10`
  );
  
  const { data: { items: runs } } = await runsRes.json();
  
  if (!runs || runs.length === 0) {
    throw new Error(`No successful runs found for actor ${actorId}`);
  }
  
  // 2. Se username fornecido, buscar run específico para esse username
  let targetRun = runs[0]; // Por padrão, pegar o mais recente
  
  if (username) {
    // Verificar qual run é para o username específico
    for (const run of runs) {
      try {
        // Buscar input do run para verificar se é o username correto
        const inputRes = await fetch(
          `https://api.apify.com/v2/actor-runs/${run.id}/input?token=${APIFY_API_TOKEN}`
        );
        const runInput = await inputRes.json();
        
        if (runInput.usernames && runInput.usernames.includes(username)) {
          targetRun = run;
          console.log(`🎯 Found matching run for @${username}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not check run ${run.id}:`, (error as Error).message);
        continue;
      }
    }
  }
  
  console.log(`✅ Using run ID: ${targetRun.id}, finished at: ${targetRun.finishedAt}`);
  
  // 3. Buscar dados do dataset
  const datasetId = targetRun.defaultDatasetId;
  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
  );
  
  const results = await resultsRes.json();
  console.log(`📊 Retrieved ${results.length} items from latest run`);
  
  return {
    results,
    runInfo: {
      id: targetRun.id,
      finishedAt: targetRun.finishedAt,
      stats: targetRun.stats
    }
  };
}

async function runApifyActor({ actorId, input }: { actorId: string; input: any }) {
  const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
  
  console.log(`🚀 Starting Apify actor: ${actorId}`);
  
  // 1. Start actor run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  
  const { data: run } = await startRes.json();
  const runId = run.id;
  
  console.log(`⏳ Actor run ID: ${runId}, polling for completion...`);
  
  // 2. Poll for completion (max 5 min)
  let status = "RUNNING";
  let attempts = 0;
  const maxAttempts = 60; // 60 * 5s = 5 min
  
  while (status === "RUNNING" && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
    );
    const { data: runData } = await statusRes.json();
    status = runData.status;
    attempts++;
    
    console.log(`📊 Status check ${attempts}/${maxAttempts}: ${status}`);
  }
  
  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run failed with status: ${status}`);
  }
  
  // 3. Get results from default dataset
  const datasetId = run.defaultDatasetId;
  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
  );
  
  const results = await resultsRes.json();
  console.log(`✅ Actor completed, ${results.length} items scraped`);
  
  return results;
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
    hashtags.forEach(tag => {
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
        const websiteData = await runApifyActor({
          actorId: "apify/website-content-crawler",
          input: {
            startUrls: [{ url: platforms.website }],
            maxCrawlPages: scrapeType === "full" ? 50 : 5,
            crawlerType: "playwright:firefox",
            proxyConfiguration: { useApifyProxy: true },
          },
        });

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

    // Instagram scraping - USAR AMBOS OS ACTORS
    if (platforms.instagram) {
      try {
        console.log(`📷 Processing Instagram: ${platforms.instagram}`);
        const username = platforms.instagram
          .replace("@", "")
          .replace("https://instagram.com/", "")
          .replace("https://www.instagram.com/", "")
          .split("/")[0];
        
        let profileData;
        let postsData;
        let runInfo = { id: null, finishedAt: null };
        
        if (mode === "fetch") {
          console.log(`📥 Fetching latest data for @${username}...`);
          
          // FETCH: Buscar dados do perfil
          const profileResult = await fetchLatestApifyRun({
            actorId: "apify/instagram-scraper",
            username: username
          });
          profileData = profileResult.results[0];
          runInfo = profileResult.runInfo;
          
          // FETCH: Buscar posts
          const postsResult = await fetchLatestApifyRun({
            actorId: "apify/instagram-post-scraper",
            username: username
          });
          postsData = postsResult.results;
          
        } else {
          console.log(`🚀 Triggering new scraping for @${username}...`);
          
          // TRIGGER: Scraping do perfil
          const profileResults = await runApifyActor({
            actorId: "apify/instagram-scraper",
            input: {
              usernames: [username],
              resultsType: "details",
            },
          });
          profileData = profileResults[0];
          
          // TRIGGER: Scraping dos posts
          postsData = await runApifyActor({
            actorId: "apify/instagram-post-scraper",
            input: {
              usernames: [username],
              resultsLimit: scrapeType === "full" ? 50 : 20,
            },
          });
        }

        // Calcular métricas agregadas dos posts
        const postMetrics = calculatePostMetrics(postsData);

        // Calcular engagement rate com dados do perfil
        if (profileData?.followersCount && postsData.length > 0) {
          const totalEngagement = postsData.reduce((sum, p) => 
            sum + (p.likesCount || 0) + (p.commentsCount || 0), 0
          );
          const avgEngagement = totalEngagement / postsData.length;
          postMetrics.avgEngagementRate = ((avgEngagement / profileData.followersCount) * 100).toFixed(2);
        }

        // Salvar dados COMBINADOS no banco
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
              avgEngagementRate: postMetrics.avgEngagementRate || 0,
              postingFrequency: postMetrics.postingFrequency,
              mostEngagedPost: postMetrics.mostEngagedPost,
              topHashtags: postMetrics.topHashtags,
              postTypes: postMetrics.postTypes,
            },
            
            apifyRunIds: {
              profile: runInfo?.id,
              posts: runInfo?.id,
            },
            scrapedAt: runInfo?.finishedAt || new Date().toISOString(),
          },
          scraped_at: runInfo?.finishedAt || new Date().toISOString(),
        });

        results.push({ 
          platform: "instagram", 
          profileScraped: !!profileData,
          postsScraped: postsData.length,
          mode: mode,
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
        const fbData = await runApifyActor({
          actorId: "apify/facebook-pages-scraper",
          input: {
            startUrls: [`https://www.facebook.com/${platforms.facebook}`],
            maxPosts: scrapeType === "full" ? 50 : 10,
          },
        });

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
        const linkedinData = await runApifyActor({
          actorId: "apify/linkedin-company-scraper",
          input: {
            companyUrls: [`https://www.linkedin.com/company/${platforms.linkedin}`],
          },
        });

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
