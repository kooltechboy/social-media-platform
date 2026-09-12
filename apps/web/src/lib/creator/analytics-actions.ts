"use server";

import { createSupabaseServerClient, getCurrentUser } from "../supabase/server";
import { sumLedgerMinorUnits } from "@caribbean/payments";

export async function fetchCreatorAnalyticsAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { success: false, error: "Database client error" };

  try {
    const [
      profileCountsResult,
      postsResult,
      videosResult,
      ledgerAccountsResult,
      followsResult
    ] = await Promise.all([
      supabase
        .from("profile_counts")
        .select("followers_count, posts_count, likes_received_count")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("id, content, comments_count, likes_count, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("videos")
        .select("id, title, video_kind, view_count, created_at")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("ledger_accounts")
        .select("id")
        .eq("owner_id", user.id)
        .eq("account_type", "creator_pending")
        .maybeSingle(),
      supabase
        .from("follows")
        .select("follower:profiles!follower_id(current_country:countries!current_country_id(name))")
        .eq("following_id", user.id)
    ]);

    const counts = profileCountsResult.data || {
      followers_count: 0,
      posts_count: 0,
      likes_received_count: 0,
    };

    const posts = postsResult.data || [];
    const videos = (videosResult?.data || []) as any[];
    const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

    // Merge posts and videos for realistic content performance analytics
    const combinedContent = [
      ...videos.map(v => ({
        id: v.id,
        title: v.title || "Untitled Video",
        type: v.video_kind || "video",
        views: v.view_count || 0,
        engagement: v.view_count || 0,
        publishedAt: v.created_at,
      })),
      ...posts.map(p => ({
        id: p.id,
        title: p.content ? (p.content.length > 50 ? p.content.slice(0, 50) + "..." : p.content) : "Untitled Post",
        type: "post",
        views: (p.likes_count || 0) + (p.comments_count || 0),
        engagement: (p.comments_count || 0) + (p.likes_count || 0),
        publishedAt: p.created_at,
      }))
    ].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const recentContent = combinedContent.slice(0, 5);

    let monthlyRevenue = 0;
    if (ledgerAccountsResult.data?.id) {
      // Get only credits for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: entries } = await supabase
        .from("ledger_entries")
        .select("amount, entry_type")
        .eq("account_id", ledgerAccountsResult.data.id)
        .eq("entry_type", "CREDIT")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (entries) {
        monthlyRevenue = sumLedgerMinorUnits(entries);
      }
    }

    const countryCounts: Record<string, number> = {};
    const follows = followsResult.data || [];
    follows.forEach(f => {
      // @ts-ignore
      const countryName = f.follower?.current_country?.name || "Unknown";
      countryCounts[countryName] = (countryCounts[countryName] || 0) + 1;
    });

    const audienceByCountry = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, percentage: Math.round((count / (follows.length || 1)) * 100) }))
      .sort((a, b) => b.percentage - a.percentage);

    let bestTimeInsight = "Not enough data to calculate best posting times.";
    if (posts.length > 0) {
      let bestPost = posts[0];
      let maxEngagement = (bestPost.comments_count || 0) + (bestPost.likes_count || 0);
      posts.forEach(p => {
        const eng = (p.comments_count || 0) + (p.likes_count || 0);
        if (eng > maxEngagement) {
          maxEngagement = eng;
          bestPost = p;
        }
      });
      const d = new Date(bestPost.created_at);
      const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
      const hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = hours % 12 || 12;
      bestTimeInsight = `Based on your past content, you get the highest engagement when you post on ${days[d.getDay()]} at ${formattedHour}:00 ${ampm}.`;
    }

    return {
      success: true,
      data: {
        followersCount: counts.followers_count,
        postsCount: counts.posts_count,
        totalLikes: counts.likes_received_count,
        totalComments,
        monthlyRevenue,
        recentContent,
        audienceByCountry,
        bestTimeInsight,
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to fetch analytics" };
  }
}
