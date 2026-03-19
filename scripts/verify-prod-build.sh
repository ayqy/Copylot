#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
MANIFEST_JSON="${DIST_DIR}/manifest.json"
POPUP_JS="${DIST_DIR}/src/popup/popup.js"

fail() {
  echo "[verify-prod-build] FAIL: $*" >&2
  exit 1
}

info() {
  echo "[verify-prod-build] $*"
}

info "开始生产构建产物自检..."

if [[ ! -d "${DIST_DIR}" ]]; then
  fail "未找到 dist/，请先执行: npm run build:prod"
fi

if [[ ! -f "${MANIFEST_JSON}" ]]; then
  fail "未找到 ${MANIFEST_JSON}，请确认 build:prod 产物完整"
fi

if [[ ! -f "${POPUP_JS}" ]]; then
  fail "未找到 ${POPUP_JS}，请确认 build:prod 产物完整"
fi

info "检查：dist/ 不包含测试资源（*test* / *runner*）"
TEST_RESOURCE_MATCHES="$(find "${DIST_DIR}" \( -name "*test*" -o -name "*runner*" \) -print | sed '/^$/d' || true)"
if [[ -n "${TEST_RESOURCE_MATCHES}" ]]; then
  echo "${TEST_RESOURCE_MATCHES}" | sed 's#^#- #' >&2
  fail "dist/ 包含疑似测试资源文件/目录（请检查构建配置或清理产物）"
fi

info "检查：dist/manifest.json 不包含 test 引用"
if grep -qi "test" "${MANIFEST_JSON}"; then
  fail "dist/manifest.json 包含 test 字样引用（可能引入测试资源/入口）"
fi

info "检查：dist/src/popup/popup.js 不包含开发彩蛋/调试入口（clickCount|easter|test/index.html）"
if grep -Eq "clickCount|easter|test/index\\.html" "${POPUP_JS}"; then
  fail "dist/src/popup/popup.js 命中禁用关键字（clickCount|easter|test/index.html）"
fi

info "检查：权限白名单（permissions 必须严格等于 [storage, clipboardWrite, contextMenus]）"
node -e '
  const fs = require("fs");
  const manifestPath = process.argv[1];
  const expected = ["storage", "clipboardWrite", "contextMenus"];

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const permissions = manifest.permissions;

  if (!Array.isArray(permissions)) {
    console.error(`[verify-prod-build] permissions 不是数组: ${typeof permissions}`);
    process.exit(1);
  }

  const unique = Array.from(new Set(permissions));
  const sort = (arr) => [...arr].sort();

  const actualSorted = sort(permissions);
  const uniqueSorted = sort(unique);
  const expectedSorted = sort(expected);

  const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  if (permissions.length !== expected.length) {
    console.error(`[verify-prod-build] permissions 长度不匹配: expected=${expected.length}, actual=${permissions.length}`);
    console.error(`[verify-prod-build] actual permissions: ${JSON.stringify(permissions)}`);
    process.exit(1);
  }

  if (!equals(uniqueSorted, expectedSorted)) {
    console.error("[verify-prod-build] permissions 集合不匹配（缺失/新增权限）");
    console.error(`[verify-prod-build] expected: ${JSON.stringify(expectedSorted)}`);
    console.error(`[verify-prod-build] actual:   ${JSON.stringify(actualSorted)}`);
    process.exit(1);
  }

  if (!equals(actualSorted, expectedSorted)) {
    console.error("[verify-prod-build] permissions 顺序/内容异常（要求与白名单一致；不应包含重复项）");
    console.error(`[verify-prod-build] expected(sorted): ${JSON.stringify(expectedSorted)}`);
    console.error(`[verify-prod-build] actual(sorted):   ${JSON.stringify(actualSorted)}`);
    process.exit(1);
  }
' "${MANIFEST_JSON}"

info "OK：生产构建产物自检通过"
