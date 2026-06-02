const authService = require("./auth.service");

// Cookie config — httpOnly prevents JS access (XSS protection)
const COOKIE_NAME = "token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// POST /api/v1/auth/register
// Body: { workspaceName, name, email, password }
// role_id is NOT required — admin role is auto-created for the workspace
async function register(req, res, next) {
  try {
    const { workspaceName, name, email, password } = req.body;
    const { token, user } = await authService.register({
      workspaceName,
      name,
      email,
      password,
    });

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/login
// Body: { email, password }
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });

    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/logout
async function logout(req, res, next) {
  try {
    await authService.logout(req.user?.id);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout };
