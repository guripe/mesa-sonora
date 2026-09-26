module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    url: process.env.SUPABASE_URL || null,
    key: process.env.SUPABASE_ANON_KEY || null
  }));
};
