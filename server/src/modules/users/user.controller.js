const userService = require("./user.service");

// GET /api/v1/users
async function getUsers(req, res, next) {
  try {
    const users = await userService.getUsers(req.user.workspace_id);
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/users/create
async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.user.workspace_id, req.body);
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// PUT /api/v1/users/:id
async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.user.workspace_id,
      req.body
    );
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/users/:id
async function deactivateUser(req, res, next) {
  try {
    const result = await userService.deactivateUser(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, createUser, updateUser, deactivateUser };
