import type { Metadata } from "next";
import * as cheerio from "cheerio";
import Script from "next/script";

const TWEET_ID = /^[0-9]+$/;

function getToken(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)
    .replace(/(0+|\.)/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: {
    username: string;
    id: string;
  };
}): Promise<Metadata> {
  if (params.id.length > 40 || !TWEET_ID.test(params.id)) {
    throw new Error(`Invalid tweet id: ${params.id}`);
  }

  const url = new URL("https://cdn.syndication.twimg.com/tweet-result");

  url.searchParams.set("id", params.id);
  url.searchParams.set("lang", "en");
  url.searchParams.set(
    "features",
    [
      "tfw_timeline_list:",
      "tfw_follower_count_sunset:true",
      "tfw_tweet_edit_backend:on",
      "tfw_refsrc_session:on",
      "tfw_fosnr_soft_interventions_enabled:on",
      "tfw_show_birdwatch_pivots_enabled:on",
      "tfw_show_business_verified_badge:on",
      "tfw_duplicate_scribes_to_settings:on",
      "tfw_use_profile_image_shape_enabled:on",
      "tfw_show_blue_verified_badge:on",
      "tfw_legacy_timeline_sunset:true",
      "tfw_show_gov_verified_badge:on",
      "tfw_show_business_affiliate_badge:on",
      "tfw_tweet_edit_frontend:on",
    ].join(";")
  );
  url.searchParams.set("token", getToken(params.id));

  const dataRequest = await fetch(url.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0",
    },
  });
  const pageRequest = await fetch(
    `https://twitter.com/${params.username}/status/${params.id}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      },
    }
  );

  const page = await pageRequest.text();
  const data = await dataRequest.json();

  const $ = cheerio.load(page);

  const displayName = data.user.name;
  const handle = "@" + data.user.screen_name;

  const siteName = `twitter.lonelil.com · ${new Date(
    data.created_at
  ).toLocaleString()}`;
  const communityNotes = data.birdwatch_pivot;

  const description = `${data.text}${
    communityNotes
      ? `\n\n👪 ${communityNotes.title}\n\n${communityNotes.subtitle}`
      : ""
  }`;
  const dataAttr = (num: number) => {
    return $(`[data-testid=app-text-transition-container] > :eq(${num})`)
      .first()
      .text();
  };

  return {
    title: "",
    description: "",
    themeColor:
      /*data.photos
      ? rgbToHex(
          data.photos[0].backgroundColor.red,
          data.photos[0].backgroundColor.green,
          data.photos[0].backgroundColor.blue
        )
      : */ "#2B2D31",
    openGraph: {
      siteName,
      description,
      videos: data.video && {
        url: data.video.variants[0].src,
        type: data.video.variants[0].type,
      },
    },
    twitter: {
      card: data.video ? "player" : "summary_large_image",
      title: `${displayName} ${
        data.user.verified
          ? "✅ "
          : data.user.is_blue_verified
          ? "🟦 "
          : data.user.verified_type === "Business"
          ? "🟨 "
          : ""
      }(${handle})`,
      site: handle,
      creator: handle,
      images: data.photos
        ? data.photos.length === 1
          ? data.photos[0].url
          : data.photos.length > 1
          ? `https://vxtwitter.com/rendercombined.jpg?imgs=${data.photos
              .map((photo: any) => {
                return photo.url;
              })
              .join(",")}`
          : ""
        : "",
    },
    alternates: {
      types: {
        "application/json+oembed": `https://webembed-sb.onrender.com/oembed?author_name=${encodeURIComponent(
          `👀 ${dataAttr(0)} ♻️ ${dataAttr(1)} 💬 ${dataAttr(2)} 👍 ${dataAttr(
            3
          )} 🔖 ${dataAttr(4)}${data.video ? `\n\n${description}` : ""}`
        )}&author_url=https://twitter.com/${handle}&provider_name=${encodeURIComponent(
          siteName
        )}&provider_url=https://lonelil.com`,
      },
    },
  };
}

export default function Page({
  params,
}: {
  params: {
    username: string;
    id: string;
  };
}) {
  return (
    <>
      {process.env.NODE_ENV === "production" && (
        <Script id="redirect" strategy="beforeInteractive">
          {`
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        window.location.replace(isMobile ? "twitter://status?id=${params.id}" : "https://twitter.com/${params.username}/status/${params.id}")
        `}
        </Script>
      )}
    </>
  );
}
