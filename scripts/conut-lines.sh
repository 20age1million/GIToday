#!/bin/bash
# count-lines.sh
# 用法: ./count-lines.sh <folder>

if [ -z "$1" ]; then
  echo "Usage: $0 <folder>"
  exit 1
fi

FOLDER=$1

# 总行数
TOTAL=0

# 遍历文件并统计行数
while IFS= read -r -d '' file; do
  # 只统计普通文件，避免出错
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    echo "$file: $LINES"
    TOTAL=$((TOTAL + LINES))
  fi
done < <(find "$FOLDER" -type f -print0)

echo "-------------------------"
echo "Total lines: $TOTAL"
