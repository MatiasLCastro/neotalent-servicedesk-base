#!/bin/sh
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
case "$f" in
  *js/utils/*.js|*js/components/*.js)
    case "$f" in
      *.test.js) t="$f" ;;
      *) t="${f%.js}.test.js" ;;
    esac
    if [ -f "$t" ]; then
      node --test "$t"
    fi
    ;;
esac
