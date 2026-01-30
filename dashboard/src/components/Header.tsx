interface HeaderProps {
  lastUpdated: string | null;
}

export function Header({ lastUpdated }: HeaderProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <header className="header">
      <div className="container">
        <h1>Class Portfolio Tracker</h1>
        <p className="subtitle">
          Capital Markets & Investments | Columbia Business School | Spring 2026
        </p>
        <p className="tagline">
          Real-time tracking of portfolios built from each section's favorite stocks
        </p>
        {lastUpdated && (
          <p className="last-updated">
            Last updated: {formatDate(lastUpdated)}
          </p>
        )}
      </div>
    </header>
  );
}
