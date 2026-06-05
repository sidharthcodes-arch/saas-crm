const filesService = require("./files.service");

async function uploadFile(req, res, next) {
  try {
    const fileRecord = await filesService.uploadFile(
      req.user.workspace_id,
      req.user.id,
      req.body,
      req.file
    );
    return res.status(201).json({ success: true, data: fileRecord });
  } catch (err) {
    next(err);
  }
}

async function getFiles(req, res, next) {
  try {
    const list = await filesService.getFilesByEntity(
      req.user.workspace_id,
      req.params.entity_type,
      req.params.entity_id
    );
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function deleteFile(req, res, next) {
  try {
    const result = await filesService.deleteFile(
      req.params.id,
      req.user.workspace_id
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
};
