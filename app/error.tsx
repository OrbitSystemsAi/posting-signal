"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fatal-error">
      <h1>PostingSignal needs a moment</h1>
      <p>The workspace could not be loaded. Your saved browser data has not been removed.</p>
      <button className="primary" onClick={reset}>Try again</button>
    </main>
  );
}
