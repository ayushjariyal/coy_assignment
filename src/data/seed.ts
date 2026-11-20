import type { DbData, Profile, Swipe } from "@/lib/types";
import { CURRENT_USER_ID } from "@/lib/discovery";

const photo = (gender: "men" | "women", n: number) =>
  `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;

export const SEED_PROFILES: Profile[] = [
  { id: "p01", name: "Ananya", age: 21, photo: photo("women", 44), bio: "Filter coffee evangelist. Will judge your playlist, lovingly.", city: "Bengaluru", college: "Christ University", interests: ["Indie music", "Coffee", "Thrifting", "Poetry"] },
  { id: "p02", name: "Arjun", age: 22, photo: photo("men", 32), bio: "Building a startup nobody asked for. Also, a decent cook.", city: "Mumbai", college: "IIT Bombay", interests: ["Startups", "Cooking", "F1", "Chess"] },
  { id: "p03", name: "Ishita", age: 20, photo: photo("women", 65), bio: "Bharatanatyam on weekdays, horror movies on weekends.", city: "Chennai", college: "Stella Maris College", interests: ["Dance", "Horror films", "Baking", "Travel"] },
  { id: "p04", name: "Kabir", age: 23, photo: photo("men", 45), bio: "Sunrise treks and late-night chai. Pick one, I'm in.", city: "Pune", college: "Symbiosis", interests: ["Trekking", "Photography", "Chai", "Football"] },
  { id: "p05", name: "Meera", age: 22, photo: photo("women", 17), bio: "Med student. Yes, I'll look at that weird mole for you.", city: "Delhi", college: "AIIMS Delhi", interests: ["Medicine", "Sketching", "Podcasts", "Yoga"] },
  { id: "p06", name: "Rohan", age: 21, photo: photo("men", 11), bio: "Left-arm spinner, right-brain thinker.", city: "Kolkata", college: "Jadavpur University", interests: ["Cricket", "Bengali films", "Quizzing", "Street food"] },
  { id: "p07", name: "Sara", age: 20, photo: photo("women", 29), bio: "Probably at a bookstore. Recommend me something sad.", city: "Hyderabad", college: "University of Hyderabad", interests: ["Books", "Writing", "Cats", "Museums"] },
  { id: "p08", name: "Vikram", age: 24, photo: photo("men", 52), bio: "Product designer who still sketches on paper first.", city: "Bengaluru", interests: ["Design", "Cycling", "Board games", "Jazz"] },
  { id: "p09", name: "Diya", age: 21, photo: photo("women", 8), bio: "Debate captain. I will win the argument about pineapple pizza.", city: "Ahmedabad", college: "CEPT University", interests: ["Debating", "Architecture", "Pizza", "Sketching"] },
  { id: "p10", name: "Aditya", age: 22, photo: photo("men", 76), bio: "Guitar, gym, and getting lost in Old Delhi lanes.", city: "Delhi", college: "Delhi University", interests: ["Guitar", "Fitness", "History", "Food walks"] },
  { id: "p11", name: "Tara", age: 23, photo: photo("women", 90), bio: "Marine biology nerd. Ask me about octopuses.", city: "Goa", interests: ["Scuba", "Ocean", "Surfing", "Documentaries"] },
  { id: "p12", name: "Nikhil", age: 21, photo: photo("men", 3), bio: "Competitive coder by day, amateur stand-up by night.", city: "Chennai", college: "IIT Madras", interests: ["Coding", "Stand-up", "Anime", "Badminton"] },
  { id: "p13", name: "Riya", age: 20, photo: photo("women", 33), bio: "Fashion student with strong opinions about sneakers.", city: "Mumbai", college: "NIFT Mumbai", interests: ["Fashion", "Sneakers", "K-dramas", "Dance"] },
  { id: "p14", name: "Aarav", age: 22, photo: photo("men", 22), bio: "Learning Japanese so I can finally read the manga raw.", city: "Pune", college: "COEP", interests: ["Manga", "Languages", "Gaming", "Ramen"] },
  { id: "p15", name: "Kavya", age: 21, photo: photo("women", 51), bio: "Plant mom of 23. Each one has a name.", city: "Bengaluru", college: "Mount Carmel College", interests: ["Plants", "Pottery", "Lo-fi", "Farmers' markets"] },
  { id: "p16", name: "Siddharth", age: 23, photo: photo("men", 67), bio: "Finance by profession, birdwatcher by passion.", city: "Mumbai", interests: ["Birdwatching", "Investing", "Running", "Biographies"] },
  { id: "p17", name: "Naina", age: 22, photo: photo("women", 12), bio: "Theatre kid who never grew out of it. Proudly.", city: "Delhi", college: "Lady Shri Ram College", interests: ["Theatre", "Musicals", "Karaoke", "Thrifting"] },
  { id: "p18", name: "Dev", age: 21, photo: photo("men", 85), bio: "Weekend DJ. Weekday sleep-deprived engineering student.", city: "Hyderabad", college: "BITS Hyderabad", interests: ["DJing", "Electronic music", "Robotics", "Biryani"] },
  { id: "p19", name: "Aisha", age: 23, photo: photo("women", 72), bio: "Lawyer-in-training. I read the terms and conditions.", city: "Bengaluru", college: "NLSIU", interests: ["Law", "Baking", "True crime", "Swimming"] },
  { id: "p20", name: "Yash", age: 20, photo: photo("men", 14), bio: "Football Saturdays, film-club Sundays.", city: "Kolkata", college: "St. Xavier's Kolkata", interests: ["Football", "Cinema", "Photography", "Momos"] },
  { id: "p21", name: "Pooja", age: 22, photo: photo("women", 24), bio: "Physics major. Let's talk about the universe over golgappe.", city: "Jaipur", college: "Banasthali Vidyapith", interests: ["Astronomy", "Street food", "Classical music", "Travel"] },
  { id: "p22", name: "Karan", age: 24, photo: photo("men", 41), bio: "Ex-army brat. Lived in 9 cities, still can't pick a favourite.", city: "Chandigarh", interests: ["Travel", "Motorbikes", "Cooking", "Hiking"] },
  { id: "p23", name: "Zoya", age: 21, photo: photo("women", 39), bio: "Illustrator. I'll probably doodle you on a napkin.", city: "Lucknow", college: "Lucknow University", interests: ["Illustration", "Urdu poetry", "Kebabs", "Calligraphy"] },
  { id: "p24", name: "Harsh", age: 22, photo: photo("men", 58), bio: "Pro at Valorant, beginner at everything else. Teach me?", city: "Indore", college: "IIM Indore", interests: ["Gaming", "Esports", "Gym", "Poha"] },
  { id: "p25", name: "Nisha", age: 20, photo: photo("women", 56), bio: "Volunteers at an animal shelter. Dog photos available on request.", city: "Pune", college: "Fergusson College", interests: ["Animals", "Volunteering", "Running", "Photography"] },
  { id: "p26", name: "Rahul", age: 23, photo: photo("men", 28), bio: "Data scientist. My love language is a well-labelled chart.", city: "Gurugram", interests: ["Data", "Tennis", "Sci-fi", "Craft coffee"] },
  { id: "p27", name: "Sneha", age: 21, photo: photo("women", 81), bio: "Carnatic vocalist who secretly loves heavy metal.", city: "Chennai", college: "Women's Christian College", interests: ["Carnatic music", "Metal", "Cooking", "Cycling"] },
  { id: "p28", name: "Ayaan", age: 22, photo: photo("men", 7), bio: "Architecture student. I notice fonts on shop signs.", city: "Ahmedabad", college: "CEPT University", interests: ["Architecture", "Typography", "Film photography", "Heritage walks"] },
  { id: "p29", name: "Myra", age: 23, photo: photo("women", 3), bio: "Journalist chasing stories and the perfect dosa.", city: "Bengaluru", interests: ["Journalism", "Food", "Podcasts", "Badminton"] },
  { id: "p30", name: "Ishaan", age: 21, photo: photo("men", 92), bio: "Rock climber. Scared of commitment, not heights.", city: "Dehradun", college: "Doon University", interests: ["Climbing", "Camping", "Folk music", "Maggi"] },
  { id: "p31", name: "Anika", age: 22, photo: photo("women", 60), bio: "Economics + espresso. Fluent in sarcasm and Spanish.", city: "Delhi", college: "St. Stephen's College", interests: ["Economics", "Spanish", "Coffee", "Salsa"] },
  { id: "p32", name: "Varun", age: 24, photo: photo("men", 61), bio: "Chef in the making. Will feed you before I text back.", city: "Kochi", interests: ["Cooking", "Kayaking", "Malayalam films", "Food blogging"] },
];

/**
 * Profiles that have already liked the logged-in user, so matches can happen
 * during a demo. Deliberately spread across the list, and the feed is shuffled
 * anyway, so they never cluster at the top of the deck.
 *
 * This list is server-only data. It is never sent to the client.
 */
export const LIKED_CURRENT_USER = ["p03", "p07", "p10", "p14", "p18", "p21", "p25", "p28", "p31"];

export function buildSeed(now: Date = new Date()): DbData {
  const swipes: Swipe[] = LIKED_CURRENT_USER.map((id, i) => ({
    swiperId: id,
    targetId: CURRENT_USER_ID,
    direction: "like",
    // Spread the "they liked you" timestamps over the previous days.
    createdAt: new Date(now.getTime() - (i + 1) * 36e5 * 7).toISOString(),
  }));

  // A few seeded profiles also passed on the user, to prove a pass never leaks either.
  for (const id of ["p02", "p11", "p26"]) {
    swipes.push({
      swiperId: id,
      targetId: CURRENT_USER_ID,
      direction: "pass",
      createdAt: new Date(now.getTime() - 864e5).toISOString(),
    });
  }

  return {
    version: 1,
    profiles: structuredClone(SEED_PROFILES),
    swipes,
    matches: [],
  };
}
