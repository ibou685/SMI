// backend/src/middleware/auth.js - VERSION CORRIGÉE

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ✅ Middleware pour vérifier le token JWT
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié - Token manquant' });
    }

    const token = authHeader.substring(7);

    // ✅ Vérifier le token (la ligne qui manquait !)
    const decoded = jwt.verify(token, JWT_SECRET);

    req.auth = {
      userId: decoded.userId,
      email: decoded.email,
      nom: decoded.nom,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error('❌ Auth error:', err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }

    return res.status(401).json({ error: 'Non authentifié' });
  }
};

// ✅ Middleware optionnel pour vérifier un rôle spécifique
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Accès refusé - Permissions insuffisantes' });
    }

    next();
  };
};