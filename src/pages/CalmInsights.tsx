import { Link } from "react-router-dom";

type Section = {
  title: string;
  text: string;
  img: string;
  alt: string;
};

const sections: Section[] = [
  {
    title: "Box Breathing (4-4-4-4)",
    text:
      "A simple technique: inhale for 4, hold 4, exhale 4, hold 4. Repeat for 1–3 minutes to steady heart rate and calm the nervous system.",
    img: "https://ausflowers.com.au/cdn/shop/files/Meditation_Featured_Image_AdobeStock_278474252_Test01.jpg?v=1687833702",
    alt: "Calm breathing by the sea",
  },
  {
    title: "Ancient Egypt — Ma'at",
    text:
      "Ma'at embodied truth, balance, and order. Daily rituals and measured living reflected a desire for harmony with the cosmos.",
    img: "https://www.ancient-egypt-online.com/images/maat-sarcophagus.jpg",
    alt: "Egyptian artifact",
  },
  {
    title: "Stoic Pause",
    text:
      "Stoics practiced a mindful pause: distinguish what is up to you (judgment, intention) from what is not (outcomes, weather). Act on the former, accept the latter.",
    img: "https://pratigroup.org/wp-content/uploads/2021/07/sailboat-in-cosmos_johannes-plenio.jpg",
    alt: "Starry night sky with sailboat",
  },
  {
    title: "Greece — The Golden Mean",
    text:
      "Aristotle’s ‘mean’ pointed to balanced habits. Not too little, not too much — steady progress through daily practice.",
    img: "https://sirioti.com/cdn/shop/articles/golden-ratio-ancient-greece_e28cc2b0-b343-4913-808e-4e12e1696d21.jpg?v=1748883612",
    alt: "Ancient Greek columns",
  },
  {
    title: "Body Scan",
    text:
      "Gently move attention from the crown of your head to your toes. Notice sensations without judgment. If the mind wanders, kindly return.",
    img: "https://i.pinimg.com/736x/9e/73/14/9e731404256b8fa3677749814781158a.jpg",
    alt: "eye of horus",
  },
  {
    title: "India — Breath and Stillness",
    text:
      "Classical yoga linked breath (prāṇa) and attention (dhyāna). Short sessions of steady, gentle breathing can restore clarity. Serving as the vital bridge to consciousness and inner stillness, allowing thoughts to fade as awareness rests in pure being.",
    img: "https://c9admin.cottage9.com/uploads/4240/the-divine-incarnations-avatars-of-lord-vishnu.jpg",
    alt: "Ancient Indian artwork of Vishnu",
  },
];

export default function CalmInsightsPage() {
  return (
    <div className="min-h-screen animate-fadeIn">
      <div className="mx-auto max-w-screen-2xl md:px-10 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Calm Insights</h1>
            <p className="mt-2 text-gray-700 max-w-2xl">
              Gentle techniques and ancient notes on balance — paired with soothing imagery.
            </p>
          </div>
          <Link to="/" className="text-green-700 hover:underline">Back to Home</Link>
        </div>

        <div className="space-y-20">
          {sections.map((s, i) => (
            <div
              key={i}
              className="grid md:grid-cols-2 gap-8 items-center bg-white/40 backdrop-blur shadow rounded-2xl overflow-hidden"
            >
              {/* Image */}
              <div className={i % 2 === 0 ? "order-1" : "order-2" }>
                <img src={s.img} alt={s.alt} className="w-full h-72 md:h-96 object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              {/* Text */}
              <div className={i % 2 === 0 ? "order-2" : "order-1"}>
                <div className="p-8 md:p-10">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{s.title}</h2>
                  <p className="mt-3 text-gray-700 leading-relaxed">{s.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
