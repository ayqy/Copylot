import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
/* eslint-disable no-control-regex */

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/ayqy/copy/blob/main/docs/eslint-rules/${name}.md`
);

export const noUntranslatedLiteral = createRule({
  name: 'no-untranslated-literal',
  meta: {
    type: 'problem',
    docs: {
      description: '禁止使用未本地化的固定文案',
    },
    fixable: undefined,
    schema: [],
    messages: {
      untranslatedLiteral: '[i18n] 未本地化文案: "{{text}}"',
    },
  },
  defaultOptions: [],
  create(context) {
    function isWithinConsoleCall(node: TSESTree.Node): boolean {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === 'CallExpression' &&
          parent.callee.type === 'MemberExpression' &&
          parent.callee.object.type === 'Identifier' &&
          parent.callee.object.name === 'console'
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function isWithinI18nCall(node: TSESTree.Node): boolean {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === 'CallExpression' &&
          parent.callee.type === 'MemberExpression' &&
          parent.callee.object.type === 'MemberExpression' &&
          parent.callee.object.object.type === 'MemberExpression' &&
          parent.callee.object.object.object.type === 'Identifier' &&
          parent.callee.object.object.object.name === 'chrome' &&
          parent.callee.object.object.property.type === 'Identifier' &&
          parent.callee.object.object.property.name === 'i18n' &&
          parent.callee.object.property.type === 'Identifier' &&
          parent.callee.object.property.name === 'getMessage'
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function checkStringLiteral(node: TSESTree.Literal | TSESTree.TemplateLiteral) {
      let text = '';
      
      if (node.type === 'Literal' && typeof node.value === 'string') {
        text = node.value;
      } else if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        // 只检查没有表达式的模板字符串
        text = node.quasis[0]?.value.cooked || '';
      } else {
        return;
      }

      // 过滤条件：长度 >= 4
      if (text.length < 4) {
        return;
      }

      // 检查是否包含非ASCII字符或英文单词
      const hasNonAscii = /[^\x00-\x7F]/.test(text);
      const hasEnglishWords = /[a-zA-Z]{2,}/.test(text);
      
      if (!hasNonAscii && !hasEnglishWords) {
        return;
      }

      // 排除 console 调用
      if (isWithinConsoleCall(node)) {
        return;
      }

      // 排除 chrome.i18n.getMessage 调用
      if (isWithinI18nCall(node)) {
        return;
      }

      // 检查是否是 fallback 文案 (|| 'fallback')
      const parent = node.parent;
      if (
        parent?.type === 'LogicalExpression' &&
        parent.operator === '||' &&
        parent.right === node
      ) {
        // 检查左侧是否是 chrome.i18n.getMessage 调用
        if (
          parent.left.type === 'CallExpression' &&
          parent.left.callee.type === 'MemberExpression' &&
          parent.left.callee.object.type === 'MemberExpression' &&
          parent.left.callee.object.object.type === 'MemberExpression' &&
          parent.left.callee.object.object.object.type === 'Identifier' &&
          parent.left.callee.object.object.object.name === 'chrome' &&
          parent.left.callee.object.object.property.type === 'Identifier' &&
          parent.left.callee.object.object.property.name === 'i18n' &&
          parent.left.callee.object.property.type === 'Identifier' &&
          parent.left.callee.object.property.name === 'getMessage'
        ) {
          // 这是 fallback 文案，也应该报错
        }
      }

      const displayText = text.length > 30 ? text.substring(0, 30) + '...' : text;
      
      context.report({
        node,
        messageId: 'untranslatedLiteral',
        data: {
          text: displayText,
        },
      });
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkStringLiteral(node);
        }
      },
      TemplateLiteral(node) {
        checkStringLiteral(node);
      },
    };
  },
});
