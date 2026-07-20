export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  content: string[];
};

export const posts: BlogPost[] = [
  {
    slug: "choosing-the-right-cup-size",
    title: "Choosing the Right Cup Size for Your Café",
    excerpt:
      "8oz, 12oz, or 16oz — how to match cup sizing to your menu and avoid over-ordering stock you don't need.",
    category: "Cups",
    date: "2026-06-02",
    readTime: "4 min read",
    content: [
      "Cup size feels like a small decision until you're staring at a storeroom full of the wrong one. The starting point is your menu, not your preference: espresso-based drinks and short pours rarely need more than an 8oz cup, while milk-forward drinks and iced beverages tend to move to 12oz or 16oz.",
      "A good rule of thumb for a new menu is to stock two sizes, not three. Most vendors find that offering 8oz and 12oz covers the vast majority of orders, with 16oz added only once a specific drink demands it — extra sizes mean extra SKUs to track, extra shelf space, and extra capital tied up in stock that turns over slowly.",
      "If you're switching from single-wall to double-wall cups, size your first order small. Double-wall cups have a different feel in hand and some customers do notice — it's worth testing customer reaction on a partial order before committing to a full pallet.",
    ],
  },
  {
    slug: "eco-friendly-containers-buyers-guide",
    title: "A Buyer's Guide to Eco-Friendly Food Containers",
    excerpt:
      "What 'eco-friendly' actually means on a spec sheet, and the questions worth asking before you switch suppliers.",
    category: "Containers",
    date: "2026-05-14",
    readTime: "5 min read",
    content: [
      "\"Eco-friendly\" gets used loosely in packaging, and it's worth unpacking what it actually covers before you make a switch: is the material biodegradable, recyclable, made from recycled input, or simply lighter than the alternative it replaces? Each of those is a different claim with different implications for how your customers should dispose of it.",
      "For food containers specifically, the practical questions to ask a supplier are: what temperature range is the container rated for, is the lid leak-resistant under transit conditions, and does the material hold up in a microwave without warping. A container that's technically compostable but falls apart in transit isn't solving the problem you have.",
      "The easiest way to start is a like-for-like swap on your highest-volume container size, run it for two to four weeks, and watch for customer feedback and breakage rates before rolling it across the rest of your range.",
    ],
  },
  {
    slug: "how-much-packaging-should-you-order",
    title: "How Much Packaging Should You Order? A Wholesale Sizing Guide",
    excerpt:
      "A simple way to estimate your first bulk order without over-committing capital to stock that sits in a corner.",
    category: "Wholesale",
    date: "2026-04-22",
    readTime: "4 min read",
    content: [
      "The most common mistake in a first wholesale order isn't ordering too little — it's ordering too much of the wrong item because a unit price looked good in bulk. Start from your actual weekly usage, not the discount curve.",
      "A workable formula: take your average weekly unit usage, multiply by six to eight weeks of cover, and round up to the nearest case size your supplier packs in. That gives you a buffer against demand spikes and shipping delays without tying up capital for months.",
      "Once you have two or three months of real usage data, it's worth revisiting that number — seasonal businesses in particular tend to over-correct after their first order and either run out during a peak or sit on stock through a quiet season.",
    ],
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}
