import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="fatal-error">
      <h1>Page not found</h1>
      <p>Return to your PostingSignal workspace.</p>
      <Link className="primary" href="/">Open workspace</Link>
    </main>
  );
}
