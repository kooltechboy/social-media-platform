"use client";

import React, { useEffect, useState } from "react";
import { fetchCreatorAnalyticsAction } from "../../lib/creator/analytics-actions";
import { Loader2, Users, TrendingUp, DollarSign, MessageSquare, Globe, AlertCircle, Clock } from "lucide-react";
import { Money } from "@caribbean/payments";

export default function CreatorAnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetchCreatorAnalyticsAction();
        if (res?.error) {
          throw new Error(res.error);
        }
        if (res && isMounted) {
          setData(res.data);
        } else if (isMounted) {
          setError("Failed to load analytics");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Unknown error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-brand-goldenHour animate-spin" />
        <p className="text-sm font-medium text-brand-sandstone/70">Crunching your numbers...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error || "Failed to load data"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 border-t border-white/10 animate-fadeIn">
      <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> Performance Analytics
      </h3>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface-card rounded-2xl p-4 border border-white/10 space-y-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-brand-sandstone/60 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" /> Followers
          </p>
          <p className="text-2xl font-black text-white">{data.followersCount.toLocaleString()}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 border border-white/10 space-y-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-brand-sandstone/60 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Likes
          </p>
          <p className="text-2xl font-black text-white">{data.totalLikes.toLocaleString()}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 border border-white/10 space-y-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-brand-sandstone/60 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Comments
          </p>
          <p className="text-2xl font-black text-white">{data.totalComments.toLocaleString()}</p>
        </div>
        <div className="surface-card rounded-2xl p-4 border border-white/10 space-y-1">
          <p className="text-[10px] uppercase font-black tracking-wider text-brand-sandstone/60 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 30-Day Rev
          </p>
          <p className="text-2xl font-black text-white">{new Money(data.monthlyRevenue, "USD").format()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Performance Table */}
        <div className="surface-card rounded-2xl p-5 border border-white/10 space-y-4">
          <h4 className="text-sm font-black text-white">Recent Content Performance</h4>
          {data.recentContent.length === 0 ? (
            <p className="text-xs text-brand-sandstone/60">No recent content data.</p>
          ) : (
            <div className="space-y-3">
              {data.recentContent.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-xs p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <p className="text-brand-sandstone/60 text-[10px] mt-0.5">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <p className="text-[10px] uppercase text-brand-sandstone/60">Views</p>
                      <p className="font-black text-emerald-400">{item.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-brand-sandstone/60">Engage</p>
                      <p className="font-black text-purple-400">{item.engagement.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Audience Geography (CSS Bar Chart) */}
          <div className="surface-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-sunriseCoral" /> Audience Geography
            </h4>
            {data.audienceByCountry.length === 0 ? (
              <p className="text-xs text-brand-sandstone/60">Not enough data to display geography.</p>
            ) : (
              <div className="space-y-3">
                {data.audienceByCountry.map((loc: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white">{loc.country}</span>
                      <span className="text-brand-sandstone/70">{loc.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-brand-sunriseCoral h-full rounded-full" 
                        style={{ width: `${loc.percentage}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Best Posting Times Insight */}
          <div className="surface-card rounded-2xl p-5 border border-blue-500/20 bg-blue-950/20 space-y-2">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Best Time to Post
            </h4>
            <p className="text-xs text-brand-sandstone/80 leading-relaxed">
              {data.bestTimeInsight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
