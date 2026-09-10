import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  try {
    // 1. Compute trending hashtags (platform-wide)
    // Count posts with each cultural_tag in the last 2 hours
    // cultural_tags is a TEXT[] column on posts
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Get recent posts with cultural_tags
    const { data: recentPosts } = await supabaseAdmin
      .from('posts')
      .select('cultural_tags, country_id, created_at')
      .gte('created_at', twentyFourHoursAgo)
      .not('cultural_tags', 'is', null)
    
    // Count hashtag frequency
    const hashtagCounts: Record<string, {last2h: number; last24h: number}> = {}
    const cutoff2h = new Date(twoHoursAgo)
    
    for (const post of recentPosts || []) {
      const tags: string[] = post.cultural_tags || []
      const isRecent = new Date(post.created_at) > cutoff2h
      for (const tag of tags) {
        if (!hashtagCounts[tag]) hashtagCounts[tag] = {last2h: 0, last24h: 0}
        hashtagCounts[tag].last24h++
        if (isRecent) hashtagCounts[tag].last2h++
      }
    }
    
    // Score: velocity (2h count * 3) + volume (24h count)
    const signals = Object.entries(hashtagCounts)
      .map(([tag, counts]) => ({
        territory_iso: null,
        signal_type: 'hashtag',
        entity_id: tag,
        entity_label: '#' + tag,
        score: counts.last2h * 3 + counts.last24h,
        post_count_last_2h: counts.last2h,
        post_count_last_24h: counts.last24h,
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
    
    // Delete old signals and insert new ones
    await supabaseAdmin.from('trending_signals')
      .delete()
      .eq('signal_type', 'hashtag')
      .is('territory_iso', null)
    
    if (signals.length > 0) {
      await supabaseAdmin.from('trending_signals').insert(signals)
    }
    
    return new Response(JSON.stringify({success: true, signalsComputed: signals.length}), {
      headers: {'Content-Type': 'application/json'}
    })
  } catch (error: any) {
    console.error('Trending computation error:', error)
    return new Response(JSON.stringify({error: error.message}), {status: 500})
  }
})
