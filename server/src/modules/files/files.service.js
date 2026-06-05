const File = require("../../models/File");
const Contact = require("../../models/Contact");
const Deal = require("../../models/Deal");
const Property = require("../../models/Property");
const Lead = require("../../models/Lead");
const { db } = require("../../config/db/db");
const fs = require("fs").promises;
const path = require("path");

async function uploadFile(workspaceId, userId, data, file) {
  if (!file) {
    const err = new Error("No file uploaded");
    err.statusCode = 400;
    throw err;
  }

  const { entity_type, entity_id } = data;

  if (!entity_type || !entity_id) {
    const err = new Error("entity_type and entity_id are required");
    err.statusCode = 400;
    throw err;
  }

  const entityIdInt = parseInt(entity_id, 10);
  if (isNaN(entityIdInt)) {
    const err = new Error("entity_id must be a number");
    err.statusCode = 400;
    throw err;
  }

  // Validate that the target entity exists in the workspace
  let entityExists = false;
  if (entity_type === "lead") {
    const lead = await Lead.findById(entityIdInt, workspaceId);
    entityExists = !!lead;
  } else if (entity_type === "contact") {
    const contact = await Contact.findById(entityIdInt, workspaceId);
    entityExists = !!contact;
  } else if (entity_type === "deal") {
    const deal = await Deal.findById(entityIdInt, workspaceId);
    entityExists = !!deal;
  } else if (entity_type === "property") {
    const property = await Property.findById(entityIdInt, workspaceId);
    entityExists = !!property;
  } else {
    const err = new Error("Invalid entity_type. Must be lead, contact, deal, or property");
    err.statusCode = 400;
    throw err;
  }

  if (!entityExists) {
    const err = new Error(`Target ${entity_type} not found`);
    err.statusCode = 404;
    throw err;
  }

  // Normalize path to use forward slashes (especially for Windows support, though OS is Linux here)
  const filePath = file.path.replace(/\\/g, "/");

  try {
    const fileId = await File.create(workspaceId, userId, {
      entity_type,
      entity_id: entityIdInt,
      file_path: filePath,
    });

    return File.findById(fileId, workspaceId);
  } catch (err) {
    // Clean up physical file on DB failure
    try {
      await fs.unlink(path.join(process.cwd(), filePath));
    } catch (ignore) {}

    if (err.message.includes("required") || err.message.includes("must be")) {
      err.statusCode = 400;
    }
    throw err;
  }
}

async function getFilesByEntity(workspaceId, entityType, entityId) {
  const entityIdInt = parseInt(entityId, 10);
  if (isNaN(entityIdInt)) {
    const err = new Error("entity_id must be a number");
    err.statusCode = 400;
    throw err;
  }

  const validEntityTypes = ["lead", "contact", "deal", "property"];
  if (!validEntityTypes.includes(entityType)) {
    const err = new Error("Invalid entity_type. Must be lead, contact, deal, or property");
    err.statusCode = 400;
    throw err;
  }

  return File.findByEntity(workspaceId, entityType, entityIdInt);
}

async function deleteFile(id, workspaceId) {
  const fileRecord = await File.findById(id, workspaceId);
  if (!fileRecord) {
    const err = new Error("File not found");
    err.statusCode = 404;
    throw err;
  }

  // Delete from database
  await File.delete(id, workspaceId);

  // Delete actual file from physical disk
  try {
    const absolutePath = path.join(process.cwd(), fileRecord.file_path);
    await fs.unlink(absolutePath);
  } catch (err) {
    console.error(`⚠️ Could not delete physical file ${fileRecord.file_path}:`, err.message);
    // Continue despite physical file deletion error (e.g. if file was already deleted manually)
  }

  return { message: "File deleted successfully" };
}

module.exports = {
  uploadFile,
  getFilesByEntity,
  deleteFile,
};
