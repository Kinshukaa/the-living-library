export type Quote = { text: string; by: string };

export const QUOTES: Quote[] = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", by: "George R.R. Martin" },
  { text: "Faith is the bird that feels the light and sings when the dawn is still dark.", by: "Rabindranath Tagore" },
  { text: "Tell me, what is it you plan to do with your one wild and precious life?", by: "Mary Oliver" },
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", by: "Marcus Aurelius" },
  { text: "Every time you make a choice, you are casting a vote for the type of person you wish to become.", by: "James Clear" },
  { text: "Once you learn to read, you will be forever free.", by: "Frederick Douglass" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", by: "Dr. Seuss" },
  { text: "It is good to have an end to journey toward; but it is the journey that matters, in the end.", by: "Ursula K. Le Guin" },
  { text: "Books are a uniquely portable magic.", by: "Stephen King" },
  { text: "Whatever you are, be a good one.", by: "Abraham Lincoln" },
  { text: "The journey of a thousand miles begins with a single step.", by: "Lao Tzu" },
  { text: "Not all those who wander are lost.", by: "J.R.R. Tolkien" },
  { text: "Let everything happen to you: beauty and terror. Just keep going. No feeling is final.", by: "Rainer Maria Rilke" },
  { text: "We read to know we are not alone.", by: "William Nicholson" },
  { text: "The mind, once stretched by a new idea, never returns to its original dimensions.", by: "Oliver Wendell Holmes" },
  { text: "Be curious, not judgmental.", by: "Walt Whitman" },
  { text: "Arise, awake, and stop not till the goal is reached.", by: "Swami Vivekananda" },
  { text: "There is no friend as loyal as a book.", by: "Ernest Hemingway" },
  { text: "Small deeds done are better than great deeds planned.", by: "Peter Marshall" },
  { text: "You are the sky. Everything else is just the weather.", by: "Pema Chödrön" },
];

/** Same quote all day; a saved highlight joins the rotation when available. */
export function quoteOfDay(highlights: Quote[] = [], date = new Date()): Quote {
  const pool = [...QUOTES, ...highlights];
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return pool[day % pool.length] ?? QUOTES[0]!;
}
