const jsonContainer = document.getElementById('json-container');
const copyButton = document.getElementById('copy-button');

copyButton.addEventListener('click', () => {
  navigator.clipboard.writeText(jsonContainer.value);
});

function getElementJson(element) {
  // This function will be executed in the context of the inspected page
  const getStableSelector = (el) => {
    if (!(el instanceof Element)) return;
    if (el.id) {
      return `#${el.id}`;
    }

    const uniqueAttr = Array.from(el.attributes).find(attr => attr.name.startsWith('data-') && document.querySelectorAll(`[${attr.name}="${attr.value}"]`).length === 1);
    if (uniqueAttr) {
      return `[${uniqueAttr.name}="${uniqueAttr.value}"]`;
    }

    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  };

  const getCssSelector = (el) => {
    if (!(el instanceof Element)) return;
    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el, nth = 1;
        while (sib = sib.previousElementSibling) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  };

  const getXPath = (el) => {
    if (el.id !== '') return `id("${el.id}")`;
    if (el === document.body) return el.tagName;

    let ix = 0;
    const siblings = el.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === el) return `${getXPath(el.parentNode)}/${el.tagName}[${ix + 1}]`;
      if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
    }
  };

  const buildNode = (el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const tagName = el.tagName.toLowerCase();
    const attributes = {};
    const importantAttributes = ['id', 'href', 'src', 'alt', 'placeholder', 'name', 'type', 'value'];
    for (const attr of el.attributes) {
      if (importantAttributes.includes(attr.name) || attr.name.startsWith('data-')) {
        attributes[attr.name] = attr.value;
      }
    }

    const children = Array.from(el.children).map(child => buildNode(child)).filter(Boolean);

    return {
      tagName,
      attributes,
      innerText: el.innerText.trim().replace(/\s+/g, ' '),
      selectors: {
        xpath: getXPath(el),
        css: getCssSelector(el),
        stable: getStableSelector(el)
      },
      children,
    };
  };

  return buildNode(element);
}

function updateSidebar() {
  chrome.devtools.inspectedWindow.eval(
    `(${getElementJson.toString()})($0)`,
    (result, isException) => {
      if (isException) {
        jsonContainer.value = 'Error: ' + result;
      } else {
        jsonContainer.value = JSON.stringify(result, null, 2);
      }
    }
  );
}

chrome.devtools.panels.elements.onSelectionChanged.addListener(updateSidebar);

// Initial update
updateSidebar();
