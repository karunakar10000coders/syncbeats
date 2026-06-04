const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const inMemoryUsers = new Map();

class User {
  static async findById(id) {
    try {
      const user = await db('users').where({ id }).first();
      return user;
    } catch (e) {
      return inMemoryUsers.get(id) || null;
    }
  }

  static async findByEmail(email) {
    try {
      const user = await db('users').where({ email }).first();
      return user;
    } catch (e) {
      return Array.from(inMemoryUsers.values()).find(u => u.email === email) || null;
    }
  }

  static async create(userData) {
    const id = uuidv4();
    const newUser = {
      id,
      email: userData.email || null,
      display_name: userData.display_name,
      avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.display_name)}`,
      auth_provider: userData.auth_provider || 'email',
      auth_provider_id: userData.auth_provider_id || null,
      password_hash: userData.password_hash || null,
      is_guest: userData.is_guest || false,
      created_at: new Date(),
      last_seen_at: new Date()
    };

    try {
      const [inserted] = await db('users').insert(newUser).returning('*');
      return inserted;
    } catch (e) {
      inMemoryUsers.set(id, newUser);
      return newUser;
    }
  }

  static async update(id, updateData) {
    try {
      const [updated] = await db('users')
        .where({ id })
        .update({ ...updateData, last_seen_at: new Date() })
        .returning('*');
      return updated;
    } catch (e) {
      const current = inMemoryUsers.get(id);
      if (!current) return null;
      const updated = { ...current, ...updateData, last_seen_at: new Date() };
      inMemoryUsers.set(id, updated);
      return updated;
    }
  }

  static async findOrCreateByProvider(provider, providerId, display_name, email) {
    try {
      let user = await db('users').where({ auth_provider: provider, auth_provider_id: providerId }).first();
      if (!user) {
        user = await this.create({
          display_name,
          email,
          auth_provider: provider,
          auth_provider_id: providerId,
          is_guest: false
        });
      }
      return user;
    } catch (e) {
      let user = Array.from(inMemoryUsers.values()).find(
        u => u.auth_provider === provider && u.auth_provider_id === providerId
      );
      if (!user) {
        user = await this.create({
          display_name,
          email,
          auth_provider: provider,
          auth_provider_id: providerId,
          is_guest: false
        });
      }
      return user;
    }
  }
}

module.exports = User;
