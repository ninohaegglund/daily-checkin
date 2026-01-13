import { useMemo } from "react";

type Quote = {
  text: string;
  author: string;
  source?: string;
};

const quotes: Quote[] = [
  {
    text:
      "By doing just actions we become just; by doing temperate actions we become temperate; by doing brave actions we become brave.",
    author: "Aristotle",
    source: "Nicomachean Ethics",
  },
  {
    text: "Excellence is a habit formed by repeated choices.",
    author: "Aristotle",
    source: "Nicomachean Ethics (paraphrase)",
  },
  {
    text: "The aim of the wise is not to secure pleasure, but to avoid pain.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "We find the mean by practice and judgment; virtue lies there.",
    author: "Aristotle",
    source: "Nicomachean Ethics (paraphrase)",
  },
  {
    text: "Character is the result of habit; choose well, and live well.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "Happiness depends upon ourselves.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "Well begun is half done.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "The soul never thinks without a picture.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "The ultimate value of life depends upon awareness and contemplation.",
    author: "Aristotle",
    source: "(paraphrase)",
  },
  {
    text: "You have power over your mind—not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "Very little is needed to make a happy life; it is all within yourself.",
    author: "Marcus Aurelius",
    source: "Meditations",
  },
  {
    text: "When you arise in the morning, consider what a privilege it is to be alive.",
    author: "Marcus Aurelius",
    source: "Meditations (paraphrase)",
  },
  {
    text: "Make the best use of what is in your power, and take the rest as it happens.",
    author: "Epictetus",
    source: "Enchiridion",
  },
  {
    text: "First say to yourself what you would be; and then do what you have to do.",
    author: "Epictetus",
    source: "Discourses",
  },
  {
    text: "No man is free who is not master of himself.",
    author: "Epictetus",
    source: "Discourses",
  },
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    source: "Letters",
  },
  {
    text: "Luck is what happens when preparation meets opportunity.",
    author: "Seneca",
    source: "Letters",
  },
  {
    text: "If a man knows not to which port he sails, no wind is favorable.",
    author: "Seneca",
    source: "Letters",
  },
  {
    text: "Begin at once to live, and count each day as a separate life.",
    author: "Seneca",
    source: "Letters (paraphrase)",
  },
  {
    text: "The first and greatest victory is to conquer yourself.",
    author: "Plato",
    source: "(paraphrase)",
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Laozi",
    source: "(paraphrase)",
  },
];

function daySeed(): number {
  const d = new Date();
  const iso = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let acc = 0;
  for (let i = 0; i < iso.length; i++) acc += iso.charCodeAt(i);
  return acc;
}

export default function HeroQuote() {
  const quote = useMemo(() => {
    const seed = daySeed();
    return quotes[seed % quotes.length];
  }, []);

  return (
    <div className="mt-6 max-w-2xl text-center mx-auto animate-fadeIn">
      <p className="text-lg md:text-xl text-gray-200 italic">
        “{quote.text}”
      </p>
      <p className="mt-2 text-sm md:text-base text-gray-300">
        — {quote.author}{quote.source ? `, ${quote.source}` : ""}
      </p>
    </div>
  );
}
