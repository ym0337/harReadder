const crypto = require("crypto");
const fs = require("fs").promises; // 使用 promises API

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

// 判断2个对象是否key-value相同
function isEqualAsObject(obj1, obj2) {
  // 检查类型
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 === null ||
    obj2 === null
  ) {
    console.log("不是对象或为 null");
    return false; // 不是对象或为 null，返回 false
  }

  // 获取对象的键
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // 检查键的数量是否相同
  if (keys1.length !== keys2.length) {
    console.log("键的数量是不相同");
    return false;
  }

  // 遍历每个键，检查值是否相等
  for (let key of keys1) {
    // 检查是否存在于第二个对象中
    if (!keys2.includes(key)) {
      console.log("不存在或者值不相等");
      return false; // 如果键不存在，返回 false
    }

    // 如果值也是对象，递归判断
    if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      if (!isEqualAsObject(obj1[key], obj2[key])) {
        console.log("嵌套对象不相等");
        return false; // 如果嵌套对象不相等，返回 false
      }
    } else if (obj1[key] !== obj2[key]) {
      console.log("值不相等");
      return false; // 如果值不相等，返回 false
    }
  }
  return true; // 都相等，返回 true
}

// 判断2个数组是否相同，忽略顺序
function isEqualArrayUnordered(arr1, arr2) {
  // 检查数组长度
  if (arr1.length !== arr2.length) {
    return false;
  }

  // 将对象转化为字符串，并存储在 Set 中
  const set1 = new Set(arr1.map((obj) => JSON.stringify(obj)));
  const set2 = new Set(arr2.map((obj) => JSON.stringify(obj)));

  // 检查两个 Set 是否相等
  if (set1.size !== set2.size) {
    return false; // 如果大小不相等，返回 false
  }

  for (let item of set1) {
    if (!set2.has(item)) {
      return false; // 如果 set2 中没有 set1 的某个元素，返回 false
    }
  }

  return true; // 所有元素都相同
}

// ?a=1&b=2&c=3 => {a: '1', b: '2', c: '3'}
function queryStringToObject(queryString) {
  // 去除开头的问号
  if (queryString.startsWith("?")) {
    queryString = queryString.substring(1);
  }

  // 使用split方法将查询字符串分割成键值对
  const params = queryString.split("&");

  // 初始化一个空对象
  const resultObject = {};

  // 遍历每个键值对并将其添加到对象中
  params.forEach((param) => {
    // const [key, value] = param.split('='); 防止异常情况,有多个=号时会结果有误 a=1&b=e=&c=dd
    const equalIndex = param.indexOf('=');
    if (equalIndex === -1) {
        return [param, '']; // 如果没有找到=，返回原字符串和空字符串
    }
    const key = param.slice(0, equalIndex); // 获取`=`前面的部分
    const value = param.slice(equalIndex + 1); // 获取`=`后面的部分
    resultObject[key] = value;
  });

  return resultObject;
}

// 仅判断普通对象（即不包括数组）
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

module.exports = {
  generateUniqueCode,
  isValidJson,
  isEqualAsObject,
  isEqualArrayUnordered,
  queryStringToObject,
  isObject
};
