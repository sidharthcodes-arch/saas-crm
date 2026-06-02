const authService = require("./auth.service");

// POST /api/v1/auth/register
async function register(req, res, next) {
  try {
    const { workspaceName, name, email, password, role_id } = req.body;
    const result = await authService.register({
      workspaceName,
      name,
      email,
      password,
      role_id,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/logout
async function logout(req, res, next) {
  try {
    // req.user is set by the auth middleware (built next)
    await authService.logout(req.user?.id);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout };
