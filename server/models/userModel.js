const { query } = require('../config/db');

function generateMemberNumberCandidate() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `666-${year}-${random}`;
}

async function generateUniqueMemberNumber() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateMemberNumberCandidate();
    const { rows } = await query('SELECT id FROM users WHERE member_number = $1', [candidate]);
    if (rows.length === 0) return candidate;
  }
  throw new Error('Unable to generate a unique member number, please retry.');
}

async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ fullName, email, passwordHash }) {
  const memberNumber = await generateUniqueMemberNumber();
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, member_number)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [fullName, email.toLowerCase(), passwordHash, memberNumber]
  );
  return rows[0];
}

async function updateProfile(id, { fullName, bio }) {
  const { rows } = await query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         bio = COALESCE($3, bio),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, fullName, bio]
  );
  return rows[0] || null;
}

async function updatePhoto(id, filename) {
  const { rows } = await query(
    `UPDATE users
     SET photo_filename = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, filename]
  );
  return rows[0] || null;
}

function toPublicProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    memberNumber: user.member_number,
    bio: user.bio,
    photoFilename: user.photo_filename,
    createdAt: user.created_at
  };
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateProfile,
  updatePhoto,
  toPublicProfile
};
