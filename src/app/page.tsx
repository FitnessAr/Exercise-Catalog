export default function Home() {
  return (
    <main>
      <h1>Exercise Catalog API</h1>
      <p>API endpoints:</p>
      <ul>
        <li>GET /api/exercises - List all exercises with filters</li>
        <li>GET /api/exercises/:id - Get exercise by ID</li>
      </ul>
    </main>
  );
}
