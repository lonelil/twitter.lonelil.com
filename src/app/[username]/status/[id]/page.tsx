import type { Metadata } from "next";
import * as cheerio from "cheerio";

export async function generateMetadata({
  params,
}: {
  params: {
    username: string;
    id: string;
  };
}): Promise<Metadata> {
  const dataRequest = await fetch(
    `https://twitter.com/${params.username}/status/${params.id}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      },
    }
  );

  const data = await dataRequest.text();

  const $ = cheerio.load(data);

  const text = (id: string) => {
    return $(`[data-testid=${id}]`).text();
  };

  const dataAttr = (num: number) => {
    return $(`[data-testid=app-text-transition-container] > :eq(${num})`)
      .first()
      .text();
  };

  const displayName = $(`[data-testid=User-Name] > :eq(0)`).first().text();
  const handle = $(`[data-testid=User-Name] > :eq(1)`).first().text();

  const tweetPhotos = $('[data-testid="tweetPhoto"]');
  let imageLinks: string[] = [];

  tweetPhotos.each(function (i, el) {
    let imageLink = $(el).children().last().attr("src")?.split("?")[0] + ".jpg";
    imageLinks.push(imageLink);
  });

  return {
    title: "",
    description: "",
    openGraph: {
      siteName: "twitter.lonelil.com",
      description: `${text("tweetText")}${
        $(`[data-testid=birdwatch-pivot]`).length > 0
          ? `\n\n👪 𝗖𝗼𝗺𝗺𝘂𝗻𝗶𝘁𝘆 𝗡𝗼𝘁𝗲𝘀\n\n${$(
              `[data-testid=birdwatch-pivot] > :eq(2)`
            ).text()}`
          : ""
      }`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} ${
        $(`[data-testid=icon-verified]`) ? "✅ " : ""
      }(${handle})`,
      creator: handle,
      images:
        tweetPhotos.length === 1
          ? imageLinks[0]
          : tweetPhotos.length > 1
          ? `https://vxtwitter.com/rendercombined.jpg?imgs=${imageLinks.join(
              ","
            )}`
          : "",
    },
    alternates: {
      types: {
        "application/json+oembed": `https://webembed-sb.onrender.com/oembed?author_name=${encodeURIComponent(
          `👀 ${dataAttr(0)} ♻️ ${dataAttr(1)} 💬 ${dataAttr(2)} 👍 ${dataAttr(
            3
          )} 🔖 ${dataAttr(4)}`
        )}&author_url=https://twitter.com/${handle}&provider_name=twitter.lonelil.com&provider_url=https://lonelil.com`,
      },
    },
  };
}

export default function Page() {
  return <></>;
}
