export default function ComingSoon() {
  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <p style={styles.name}>danica sun</p>
        <p style={styles.message}>check back soon</p>
        <a href="/dayinthelife" style={styles.link}>log your data to contribute →</a>
        <a href="/dayatstanford" style={styles.link}>view an average stanford student's day in the life →</a>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    WebkitFontSmoothing: 'antialiased',
  },
  content: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  name: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '500',
    letterSpacing: '0.12em',
    textTransform: 'lowercase',
    color: '#000',
  },
  message: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '400',
    letterSpacing: '0.08em',
    color: '#000',
  },
  link: {
    marginTop: '8px',
    fontSize: '12px',
    fontWeight: '500',
    letterSpacing: '0.06em',
    color: '#000',
    textDecoration: 'none',
    borderBottom: '1px solid #000',
    paddingBottom: '1px',
    transition: 'opacity 0.15s',
  },
};
