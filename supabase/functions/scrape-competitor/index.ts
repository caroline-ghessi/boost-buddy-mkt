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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { competitorName, platforms, scrapeType, userId }: ScrapeRequest = await req.json();

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
        results.push({ platform: "website", error: error.message });
      }
    }

    // Instagram scraping
    if (platforms.instagram) {
      try {
        console.log(`📷 Scraping Instagram: ${platforms.instagram}`);
        const username = platforms.instagram.replace("@", "").replace("https://instagram.com/", "");
        
        const instaData = await runApifyActor({
          actorId: "apify/instagram-profile-scraper",
          input: {
            usernames: [username],
            resultsLimit: scrapeType === "full" ? 50 : 10,
          },
        });

        await supabase.from("competitor_data").insert({
          user_id: userId,
          competitor_name: competitorName,
          platform: "instagram",
          data_type: "social",
          data: {
            username: username,
            profile: instaData[0] || {},
            posts: instaData.slice(0, 10),
          },
          scraped_at: new Date().toISOString(),
        });

        results.push({ platform: "instagram", itemsScraped: instaData.length });
      } catch (error) {
        console.error("❌ Instagram scraping error:", error);
        results.push({ platform: "instagram", error: error.message });
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
        results.push({ platform: "facebook", error: error.message });
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
        results.push({ platform: "linkedin", error: error.message });
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
