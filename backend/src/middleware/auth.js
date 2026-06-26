// backend/src/middleware/auth.js


export const verifyAuth = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

   

    // Ajouter les infos utilisateur à la requête
    req.auth = {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.org_role || 'user'
    };

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Middleware optionnel pour vérifier un rôle spécifique
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    next();
  };
};