'use client';
import { useEffect } from 'react';

// Visitors from other countries often press the browser's "Translate this page" (Chrome, Edge, Safari). That is free and
// works for every language, so the site relies on it for its buttons and menus. But the translator wraps text in
// <font> tags, and the next time React updates that text it fails with "Failed to execute 'removeChild' on 'Node'"
// and the page goes blank. This is the standard workaround (React issue #11538): if the node React wants to remove or
// insert next to has already been moved by the translator, skip the call instead of throwing.
// Side effect: a text update on translated text can be missed until the next change. Much better than a blank page.
export default function TranslateFix() {
  useEffect(() => {
    if (typeof Node !== 'function' || !Node.prototype || Node.prototype.__translateSafe) return;
    const { removeChild, insertBefore } = Node.prototype;
    Node.prototype.removeChild = function (child) {
      if (child && child.parentNode !== this) return child;
      return removeChild.apply(this, arguments);
    };
    Node.prototype.insertBefore = function (node, reference) {
      if (reference && reference.parentNode !== this) return node;
      return insertBefore.apply(this, arguments);
    };
    Node.prototype.__translateSafe = true;
  }, []);
  return null;
}
