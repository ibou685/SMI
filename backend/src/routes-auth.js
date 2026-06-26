// backend/src/routes-auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function registerAuthRoutes(app, supabase) {
  // ============================================
  // POST /api/auth/login
  // ============================================
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`\n🔐 Login: ${email}`);

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et password requis' });
      }

      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (dbError || !user) {
        console.log(`❌ Utilisateur non trouvé: ${email}`);
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      if (user.statut !== 'Active') {
        return res.status(403).json({ error: 'Compte désactivé' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        console.log(`❌ Password incorrect`);
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          nom: user.nom,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await supabase
        .from('users')
        .update({ dernier_login: new Date().toISOString() })
        .eq('id', user.id);

      console.log(`✅ Login OK: ${email} (${user.role})`);

      res.json({
        success: true,
        message: 'Connecté',
        token,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role
        }
      });

    } catch (err) {
      console.error('❌ Erreur login:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ============================================
  // POST /api/auth/register (ADMIN ONLY)
  // ============================================
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, nom, prenom, role = 'user', telephone } = req.body;
      console.log(`\n➕ Register: ${email} (${role})`);

      if (!email || !password || !nom) {
        return res.status(400).json({ error: 'Email, password et nom requis' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimum 6 caractères' });
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Email déjà utilisé' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: email.toLowerCase(),
          password_hash: passwordHash,
          nom,
          prenom: prenom || null,
          role,
          telephone: telephone || null,
          statut: 'Active'
        }])
        .select()
        .single();

      if (createError) throw createError;

      console.log(`✅ Utilisateur créé: ${email}`);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé',
        user: {
          id: newUser.id,
          email: newUser.email,
          nom: newUser.nom,
          role: newUser.role
        }
      });

    } catch (err) {
      console.error('❌ Erreur register:', err.message);
      res.status(500).json({ error: 'Erreur création' });
    }
  });

  // ============================================
  // GET /api/auth/verify
  // ============================================
  app.get('/api/auth/verify', async (req, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ error: 'Non authentifié' });
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.auth.userId)
        .single();

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          role: user.role
        }
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================
  // GET /api/auth/logout
  // ============================================
  app.get('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Déconnecté' });
  });

  console.log('✅ Routes auth chargées');
}