/**
 * Canonical built-in card records.
 * Keep record fields and values stable: card IDs are persisted ownership keys.
 */
const builtInCardCatalog = [

   /* ======================
      E GRADE — KNOWN BUT NICHE (8)
   ===================== */
   { id: "hawkeye", title: "Hawkeye", grade: "E", quote: "I’m just a guy with a bow.", image: "Images/e1.jpg", cost: 5 },
   { id: "ant_man", title: "Ant-Man", grade: "E", quote: "Sometimes, the smallest hero makes the biggest difference.", image: "Images/e2.jpg", cost: 6 },
   { id: "falcon", title: "Falcon", grade: "E", quote: "I do what he does, just slower.", image: "Images/e3.jpg", cost: 7 },
   { id: "luke_cage", title: "Luke Cage", grade: "E", quote: "I’m bulletproof for a reason.", image: "Images/e4.jpg", cost: 7 },
   { id: "green_arrow", title: "Green Arrow", grade: "E", quote: "You have failed this city.", image: "Images/e5.jpg", cost: 8 },
   { id: "nightwing", title: "Nightwing", grade: "E", quote: "I had to become my own hero.", image: "Images/e6.jpg", cost: 9 },
   { id: "shazam", title: "Shazam", grade: "E", quote: "I’m just a kid trying to do good.", image: "Images/e7.jpg", cost: 10 },
   { id: "martian_manhunter", title: "Martian Manhunter", grade: "E", quote: "I live between worlds.", image: "Images/e8.jpg", cost: 11 },

   /* ======================
      D GRADE — STRONG FAN FAVORITES (7)
   ====================== */
   { id: "daredevil", title: "Daredevil", grade: "D", quote: "I don’t get to quit.", image: "Images/d1.jpg", cost: 15 },
   { id: "winter_soldier", title: "Winter Soldier", grade: "D", quote: "I remember all of them.", image: "Images/d2.jpg", cost: 17 },
   { id: "black_widow", title: "Black Widow", grade: "D", quote: "I’ve got red in my ledger.", image: "Images/d3.jpg", cost: 18 },
   { id: "doctor_fate", title: "Doctor Fate", grade: "D", quote: "Fate is not a straight line.", image: "Images/d4.jpg", cost: 19 },
   { id: "aquaman", title: "Aquaman", grade: "D", quote: "I’m nobody’s king but my own.", image: "Images/d5.jpg", cost: 20 },
   { id: "scarlet_witch", title: "Scarlet Witch", grade: "D", quote: "You took everything from me.", image: "Images/d6.jpg", cost: 22 },
   { id: "vision", title: "Vision", grade: "D", quote: "A thing isn’t beautiful because it lasts.", image: "Images/d7.jpg", cost: 25 },

   /* ======================
      C GRADE — FRANCHISE PILLARS (5)
   ====================== */
   { id: "captain_america", title: "Captain America", grade: "C", quote: "I can do this all day.", image: "Images/c1.jpg", cost: 30 },
   { id: "wonder_woman", title: "Wonder Woman", grade: "C", quote: "It’s about what you believe.", image: "Images/c2.jpg", cost: 34 },
   { id: "doctor_strange", title: "Doctor Strange", grade: "C", quote: "We’re in the endgame now.", image: "Images/c3.jpg", cost: 38 },
   { id: "black_panther", title: "Black Panther", grade: "C", quote: "Wakanda forever.", image: "Images/c4.jpg", cost: 42 },
   { id: "flash", title: "The Flash", grade: "C", quote: "You don’t have to be fast to do the right thing.", image: "Images/c5.jpg", cost: 48 },

   /* ======================
      B GRADE — GLOBAL ICONS (5)
   ====================== */
   { id: "iron_man", title: "Iron Man", grade: "B", quote: "I am Iron Man.", image: "Images/b1.jpg", cost: 55 },
   { id: "thor", title: "Thor", grade: "B", quote: "I am still worthy.", image: "Images/b2.jpg", cost: 60 },
   { id: "hulk", title: "Hulk", grade: "B", quote: "That’s my secret… I’m always angry.", image: "Images/b3.jpg", cost: 66 },
   { id: "batman", title: "Batman", grade: "B", quote: "I am vengeance.", image: "Images/b4.jpg", cost: 72 },
   { id: "spiderman", title: "Spider-Man", grade: "B", quote: "With great power comes great responsibility.", image: "Images/b5.jpg", cost: 80 },

   /* ======================
      A GRADE — ERA DEFINERS (3)
   ====================== */
   { id: "superman", title: "Superman", grade: "A", quote: "I choose to be human.", image: "Images/a1.jpg", cost: 95 },
   { id: "thanos", title: "Thanos", grade: "A", quote: "I am inevitable.", image: "Images/a2.jpg", cost: 110 },
   { id: "darkseid", title: "Darkseid", grade: "A", quote: "I am many things… but not a liar.", image: "Images/a3.jpg", cost: 125 },

   /* ======================
      S GRADE — MYTHIC (2)
   ====================== */
   { id: "one_above_all", title: "One Above All", grade: "S", quote: "All things return to one.", image: "Images/s1.jpg", cost: 160 },
   { id: "the_presence", title: "The Presence", grade: "S", quote: "I am what must be.", image: "Images/s2.jpg", cost: 200 },

   /* ======================
   w GRADE - LIMITED EDITIONS 
   ========================*/
   // { id: "momo_ayase", title: "Momo Ayase", grade: "w", quote: "Come On, Someone Comfort Me !", cost: 48, image: "Images/w1.jpg", limited: true, expiresAt: "2026-01-31T23:29:30Z" },
   // { id: "okarun", title: "Okarun", grade: "w", cost: 11,  image: "Images/w3.jpg", limited: true, expiresAt: "2026-01-10T23:29:30Z" },
   // { id: "chainsaw_man", title: "Chainsaw Man", grade: "w", cost: 11, image: "Images/w2.jpg", limited: true, expiresAt: "2026-01-10T23:29:30Z" },
   // { id: "jjk_sukuna", title: "Ryomen Sukuna", grade: "w", cost: 70, image: "Images/jjk.gif", limited: true, expiresAt: "2026-09-30T23:29:30Z" },

   { id: "Endgame_Cap", title: "Captain America - Endgame", grade: "w", quote: "The Worthy Human.", cost: 200, image: "Images/Endgame_Cap.gif", limited: true, expiresAt: "2026-09-30T23:29:30Z" },
   { id: "Endgame_Thor", title: "Thor - Ragnarock", grade: "w", quote: "God Of Thunder.", cost: 210, image: "Images/Endgame_Thor.gif", limited: true, expiresAt: "2026-09-30T23:29:30Z" },
   { id: "JJK_Sukuna", title: "Ryomen Sukuna", grade: "w", quote: "The King Of Curses.", cost: 200, image: "Images/JJK_Sukuna.gif", limited: true, expiresAt: "2026-10-31T23:29:30Z" },
   { id: "JJK_Gojo", title: "Saturo Gojo", grade: "w", quote: "I Am Alone Honoured One.", cost: 210, image: "Images/JJK_Gojo.gif", limited: true, expiresAt: "2026-10-31T23:29:30Z" },
   { id: "Rama", title: "Shri Ram", grade: "w", quote: "Only Those Who DO Not Believe In Their Own Abilities Are Tested.", cost: 250, image: "Images/Rama.gif", limited: true, expiresAt: "2026-11-30T23:29:30Z" },
   { id: "Ravana", title: "Ravan", grade: "w", quote: "No Force In The Universe Can Break My Will, I Bow Only To My Own Principles.", cost: 230, image: "Images/Ravana.gif", limited: true, expiresAt: "2026-11-30T23:29:30Z" },
   { id: "Raje", title: "Raje", grade: "w", quote: "Dharmo Rakshati Rakshitah.", cost: 50, image: "Images/Raje.jpeg", limited: true, expiresAt: "2026-11-08T23:29:30Z", specialCard: true, specialPower: "discount" },
   
   { id: "season_01_card", title: "The Ascension", quote: "You don't rise by chance. You rise by choice.", grade: "A", cost: 0, image: "assets/cards/season-01-ascension.png", limited: true, expiresAt: "2026-09-30T23:29:30Z", season: "season-01", seasonReward: true},
   { id: "season_01_exclusive_card", title: "Beyond Limits", quote: "The limit was never the wall. It was the belief.", grade: "S", cost: 0, image: "assets/cards/season-01-beyond-limits.png", limited: true, expiresAt: "2026-09-30T23:29:30Z", season: "season-01", seasonReward: true},
   { id: "season_02_card", title: "Domain Expansion", quote: "Power Resides Where We Believe It Resides.", grade: "S", cost: 0, image: "assets/cards/season-02-domain-expansion.png", limited: true, expiresAt: "2026-10-31T23:29:30Z", season: "season-02", seasonReward: true},
   { id: "season_02_exclusive_card", title: "The Cursed Awakening", quote: "A Different World Lies Within.", grade: "S", cost: 0, image: "assets/cards/season-02-the-cursed-awakening.png", limited: true, expiresAt: "2026-10-31T23:29:30Z", season: "season-02", seasonReward: true},
   { id: "season_03_card", title: "Jatayu", quote: "Always Follow Your Dharma, Even If Death Standing Against You.", grade: "S", cost: 0, image: "assets/cards/season-02-Jatayu.jpeg", limited: true, expiresAt: "2026-11-30T23:29:30Z", season: "season-03", seasonReward: true},
   { id: "season_03_exclusive_card", title: "Sita Maa", quote: "Never Lose Hope.", grade: "S", cost: 0, image: "assets/cards/season-03-Sitamaa.jpeg", limited: true, expiresAt: "2026-11-30T23:29:30Z", season: "season-03", seasonReward: true},
   
];

// Publish synchronously during the modular bootstrap dependency evaluation.
// Legacy classic-script functions resolve this live global when invoked.
window.cardCatalog = builtInCardCatalog;

export { builtInCardCatalog };
