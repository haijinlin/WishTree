import { canCreate, canManage, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWish, deleteWish, login, logout, updateWish } from "./actions";
import WishBoard from "./WishBoard";

export const dynamic = "force-dynamic";

const categories = [
  ["FUN", "Fun", "\u2B50"],
  ["TOY", "Toy", "\u{1F9F1}"],
  ["BOOK", "Book", "\u{1F4DA}"],
  ["GAME", "Game", "\u{1F3AE}"],
  ["TRIP", "Trip", "\u{1F5FA}\uFE0F"],
  ["LEARNING", "Learning", "\u{1F4A1}"],
  ["OTHER", "Other", "\u2728"],
];

const statuses = [
  ["PENDING", "\u{1F331} Pending"],
  ["UNDER_CONSIDERATION", "\u{1F33F} Thinking About It"],
  ["GRANTED", "\u{1F34E} Granted"],
];

const statusClass = {
  PENDING: "statusPending",
  UNDER_CONSIDERATION: "statusConsidering",
  GRANTED: "statusGranted",
};

const categoryIcon = Object.fromEntries(
  categories.map(([value, , icon]) => [value, icon])
);

const roleLabel = {
  derick: "Emma",
  grownup: "Parent",
};

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database request timed out")), ms);
    }),
  ]);
}

async function getWishes(hasDatabase) {
  if (!hasDatabase) return { wishes: demoWishes, isDemo: true };

  try {
    const wishes = await withTimeout(
      prisma.wish.findMany({
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      5000
    );
    return { wishes, isDemo: false };
  } catch {
    return { wishes: demoWishes, isDemo: true };
  }
}

const demoWishes = [
  {
    id: "demo-lego",
    title: "Build a giant space station",
    note: "I want a weekend LEGO mission with lights and a moon base.",
    category: "TOY",
    status: "UNDER_CONSIDERATION",
    adultReply: "Let's make it a quest first.",
    condition: "Finish four reading nights and help tidy the play room.",
    targetDate: new Date("2026-07-18T12:00:00"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-trip",
    title: "Go to the beach with cousins",
    note: "I want to dig a huge tunnel and bring snacks.",
    category: "TRIP",
    status: "PENDING",
    adultReply: "We are checking the calendar.",
    condition: null,
    targetDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "demo-book",
    title: "Get a new adventure book",
    note: "Something funny with maps and puzzles.",
    category: "BOOK",
    status: "GRANTED",
    adultReply: "Granted for our next library or bookstore visit.",
    condition: null,
    targetDate: new Date("2026-06-27T12:00:00"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const session = await getSession();
  const isCreator = canCreate(session);
  const isManager = canManage(session);
  const screenshotMode = process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true";
  const hasDatabase = Boolean(process.env.DATABASE_URL) && !screenshotMode;
  const { wishes, isDemo } = await getWishes(hasDatabase);

  const grantedCount = wishes.filter((wish) => wish.status === "GRANTED").length;
  const considerationCount = wishes.filter(
    (wish) => wish.status === "UNDER_CONSIDERATION"
  ).length;
  const viewWishes = wishes.map((wish) => ({
    ...wish,
    targetDate: wish.targetDate ? wish.targetDate.toISOString() : null,
    createdAt: wish.createdAt.toISOString(),
    updatedAt: wish.updatedAt.toISOString(),
  }));

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Every wish starts as a seed.</p>
          <h1>
            <span className="logoMark">{"\u2B50"}</span>
            {screenshotMode ? "Emma's WishTree" : "Derick's WishTree"}
          </h1>
          <p className="intro">
            {screenshotMode ? "Emma" : "Derick"} plants the wishes. Parents can reply, set a quest, and turn
            granted wishes into real plans.
          </p>
        </div>
        <div className="scoreStrip" aria-label="WishTree summary">
          <span>
            <strong>{wishes.length}</strong>
            wishes
          </span>
          <span>
            <strong>{considerationCount}</strong>
            thinking
          </span>
          <span>
            <strong>{grantedCount}</strong>
            granted
          </span>
        </div>
      </section>

      <section className="loginBand" aria-label="Login">
        {session ? (
          <>
            <p>
              Signed in as <strong>{roleLabel[session.role]}</strong>
            </p>
            <form action={logout}>
              <button className="ghostButton" type="submit">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <form action={login} className="loginForm">
            {params?.login === "failed" ? (
              <p className="loginError">Wrong password. Try again.</p>
            ) : null}
            <label>
              <span>Who are you?</span>
              <select name="role" defaultValue="derick">
                <option value="derick">Derick</option>
                <option value="grownup">Parent</option>
              </select>
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" required />
            </label>
            <button type="submit">Sign In</button>
          </form>
        )}
      </section>

      {isCreator ? (
        <section className="wishMaker" aria-labelledby="new-wish-title">
          <div>
            <p className="sectionLabel">Plant a seed</p>
            <h2 id="new-wish-title">What wish should grow on the tree?</h2>
          </div>
          <form action={createWish} className="createForm">
            {isDemo ? (
              <p className="demoNotice">
                Demo mode: database is not connected right now, so changes will
                not be saved.
              </p>
            ) : null}
            <label>
              <span>Wish seed</span>
              <input
                name="title"
                maxLength="80"
                placeholder="A LEGO rocket, a beach day, a new book..."
                required
              />
            </label>
            <label>
              <span>Why it should grow</span>
              <textarea
                name="note"
                maxLength="240"
                rows="3"
                placeholder="Tell us the story behind this seed."
              />
            </label>
            <div className="formRow">
              <label>
                <span>Kind</span>
                <select name="category" defaultValue="FUN">
                  {categories.map(([value, label, icon]) => (
                    <option key={value} value={value}>
                      {icon} {label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Plant Seed</button>
            </div>
          </form>
        </section>
      ) : null}

      {isDemo && !screenshotMode ? (
        <p className="globalNotice">
          Demo mode: the database is not connected, so changes will not be saved.
        </p>
      ) : null}

      <WishBoard
        wishes={viewWishes}
        statuses={statuses}
        statusClass={statusClass}
        categoryIcon={categoryIcon}
        isManager={isManager}
        updateWish={updateWish}
        deleteWish={deleteWish}
        initialFilter={screenshotMode ? params?.filter || "ALL" : "ALL"}
        expandManager={screenshotMode && params?.manage === "true"}
      />
    </main>
  );
}
