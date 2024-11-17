const crypto = require("crypto");
const fs = require('fs').promises; // 使用 promises API

function generateUniqueCode(length = 16) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

function isValidJson(data) {
  if (typeof data === "string") {
    try {
      JSON.parse(data);
      return true; // 字符串可以成功解析为 JSON
    } catch {
      return false; // 字符串不能解析为 JSON
    }
  }
  return false; // 字符串不能解析为 JSON
}

module.exports = {
  generateUniqueCode,
  isValidJson,
};