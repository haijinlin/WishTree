"use client";

import { useMemo, useState } from "react";

const filters = [
  ["ALL", "All"],
  ["PENDING", "Pending"],
  ["UNDER_CONSIDERATION", "Thinking"],
  ["GRANTED", "Granted"],
];

const emptyStateCopy = {
  ALL: [
    "No wishes planted yet",
    "Derick can plant the first wish seed.",
  ],
  PENDING: [
    "No pending wishes",
    "Every wish has been read by a parent.",
  ],
  UNDER_CONSIDERATION: [
    "Nothing is being thought about",
    "Parent can move a wish here when it needs more thinking.",
  ],
  GRANTED: [
    "No granted wishes yet",
    "Granted wishes will show up here after Parent says yes.",
  ],
};

function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function toDateInput(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toISOString().slice(0, 10);
}

function relativeDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 14) return `${diffDays} days ago`;
  return formatDate(dateValue);
}

function defaultReply(wish) {
  if (wish.adultReply) return wish.adultReply;
  if (wish.status === "PENDING") return "Waiting for a parent to read this wish.";
  if (wish.status === "UNDER_CONSIDERATION") {
    return "A parent is thinking about this wish.";
  }
  return "This wish has been granted.";
}

export default function WishBoard({
  wishes,
  statuses,
  statusClass,
  categoryIcon,
  isManager,
  updateWish,
  deleteWish,
  initialFilter = "ALL",
  expandManager = false,
}) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [statusDrafts, setStatusDrafts] = useState(() =>
    Object.fromEntries(wishes.map((wish) => [wish.id, wish.status]))
  );

  const visibleWishes = useMemo(() => {
    if (activeFilter === "ALL") return wishes;
    return wishes.filter((wish) => wish.status === activeFilter);
  }, [activeFilter, wishes]);
  const [emptyTitle, emptyMessage] = emptyStateCopy[activeFilter];

  return (
    <>
      <section className="filterBar" aria-label="Filter wishes">
        {filters.map(([value, label]) => (
          <button
            className={activeFilter === value ? "filterButton active" : "filterButton"}
            key={value}
            onClick={() => setActiveFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>

      <section className="board" aria-label="Wishes">
        {visibleWishes.length === 0 ? (
          <div className="emptyBoard">
            <span className="bigIcon">{"\u2B50"}</span>
            <h2>{emptyTitle}</h2>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          visibleWishes.map((wish, index) => {
            const selectedStatus = statusDrafts[wish.id] || wish.status;
            const isGranted = selectedStatus === "GRANTED";

            return (
              <article className="wishCard" key={wish.id}>
                <div className="cardTop">
                  <span className={`iconBadge ${wish.category.toLowerCase()}`}>
                    {categoryIcon[wish.category] || categoryIcon.OTHER}
                  </span>
                  <span className={`statusPill ${statusClass[wish.status]}`}>
                    {statuses.find(([value]) => value === wish.status)?.[1] ||
                      statuses[0][1]}
                  </span>
                </div>

                <h2>{wish.title}</h2>
                {wish.note ? <p className="wishNote">{wish.note}</p> : null}

                <div className="answerPanel">
                  <p className="miniLabel">Parent reply</p>
                  <p>{defaultReply(wish)}</p>
                  {wish.condition ? (
                    <>
                      <p className="miniLabel">Quest</p>
                      <p>{wish.condition}</p>
                    </>
                  ) : null}
                  {wish.status === "GRANTED" && wish.targetDate ? (
                    <p className="targetDate">
                      Promise date: {formatDate(wish.targetDate)}
                    </p>
                  ) : null}
                </div>

                <p className="cardMeta">
                  Planted {relativeDate(wish.createdAt)}
                  {wish.updatedAt && wish.updatedAt !== wish.createdAt
                    ? ` · Updated ${relativeDate(wish.updatedAt)}`
                    : ""}
                </p>

                {isManager ? (
                  <details className="managePanel" open={expandManager && index === 0}>
                    <summary>Manage</summary>
                    <form action={updateWish} className="replyForm">
                      <input type="hidden" name="id" value={wish.id} />
                      <label>
                        <span>Status</span>
                        <select
                          name="status"
                          defaultValue={wish.status}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [wish.id]: event.target.value,
                            }))
                          }
                        >
                          {statuses.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Reply</span>
                        <textarea
                          name="adultReply"
                          maxLength="320"
                          rows="2"
                          defaultValue={wish.adultReply || ""}
                          placeholder="Write a kind answer."
                        />
                      </label>
                      <label>
                        <span>Condition</span>
                        <input
                          name="condition"
                          maxLength="180"
                          defaultValue={wish.condition || ""}
                          placeholder="Optional quest, e.g. finish 3 reading nights"
                        />
                      </label>
                      {isGranted ? (
                        <label>
                          <span>Promise date</span>
                          <input
                            name="targetDate"
                            type="date"
                            defaultValue={toDateInput(wish.targetDate)}
                          />
                        </label>
                      ) : null}
                      <div className="cardActions">
                        <button type="submit">Save Reply</button>
                        <button
                          className="ghostButton"
                          type="submit"
                          formAction={deleteWish}
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  </details>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </>
  );
}
